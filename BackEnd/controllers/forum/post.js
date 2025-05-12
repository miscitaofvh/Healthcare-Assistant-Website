import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import PostDB from "../../models/Forum/post.js";

dotenv.config();

const handleError = (error, req, res, action = 'process') => {
  console.error(`[${req.requestId || 'no-request-id'}] Error in ${action}:`, error);

  const errorMap = {
    // Authentication errors
    "No authentication token provided": StatusCodes.UNAUTHORIZED,
    "Invalid or expired token": StatusCodes.UNAUTHORIZED,
    "Invalid token payload": StatusCodes.UNAUTHORIZED,

    // Validation errors
    "Invalid post ID": StatusCodes.BAD_REQUEST,
    "Invalid thread ID": StatusCodes.BAD_REQUEST,
    "Invalid username format": StatusCodes.BAD_REQUEST,
    "Invalid pagination parameters": StatusCodes.BAD_REQUEST,
    "Invalid sort parameter": StatusCodes.BAD_REQUEST,
    "Title is required": StatusCodes.BAD_REQUEST,
    "Content is required": StatusCodes.BAD_REQUEST,
    "Invalid post type": StatusCodes.BAD_REQUEST,

    // Authorization errors
    "Unauthorized to modify this post": StatusCodes.FORBIDDEN,
    "User is banned from posting": StatusCodes.FORBIDDEN,
    "Thread is locked": StatusCodes.FORBIDDEN,

    // Conflict errors
    "Post already exists": StatusCodes.CONFLICT,
    "Duplicate vote": StatusCodes.CONFLICT,

    // Not found errors
    "Post not found": StatusCodes.NOT_FOUND,
    "Thread not found": StatusCodes.NOT_FOUND,
    "User not found": StatusCodes.NOT_FOUND,
    "No posts found": StatusCodes.NOT_FOUND,
    "No posts found for this user": StatusCodes.NOT_FOUND
  };

  const statusCode = errorMap[error.message] || StatusCodes.INTERNAL_SERVER_ERROR;
  const response = {
    success: false,
    message: error.message || `Failed to ${action} post`,
    timestamp: new Date().toISOString()
  };

  if (process.env.NODE_ENV === 'development') {
    response.debug = {
      message: error.message,
      stack: error.stack?.split("\n")[0]
    };
  }

  if (error.message.includes("Invalid") || error.message.includes("required")) {
    response.errorCode = "VALIDATION_ERROR";
  }

  return res.status(statusCode).json(response);
};

// Helper functions
const validatePagination = (page, limit, maxLimit = 100) => {
  if (page < 1 || limit < 1 || limit > maxLimit) {
    throw new Error(`Invalid pagination: Page must be ≥1 and limit between 1-${maxLimit}`);
  }
  return { page: parseInt(page), limit: parseInt(limit) };
};

const validateSorting = (sortBy, sortOrder) => {
  const allowedFields = {
    created: 'created_at',
    updated: 'last_updated',
    views: 'view_count',
    likes: 'like_count',
    comments: 'comment_count',
    title: 'title'
  };

  const orderByField = allowedFields[sortBy] || allowedFields.created;
  const orderDirection = sortOrder && sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  return { orderByField, orderDirection };
};

const getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'created', sortOrder = 'DESC' } = req.query;
    const { page: p, limit: l } = validatePagination(page, limit);
    const { orderByField, orderDirection } = validateSorting(sortBy, sortOrder);

    const { posts, pagination } = await PostDB.getAllPostsDB(p, l, orderByField, orderDirection);

    res.status(StatusCodes.OK).json({
      success: true,
      posts: posts,
      pagination: pagination,
      metadata: {
        message: posts.length ? "Posts retrieved successfully." : "No posts found.",
        retrievedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    handleError(error, req, res, 'fetch all posts');
  }
};

const getSummaryPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const type = req.query.type || 'recent'; // recent, popular, trending, featured

    if (limit < 1 || limit > 20) {
      throw new Error("Invalid limit parameter. Must be between 1 and 20");
    }

    const validTypes = ['recent', 'popular', 'trending', 'featured'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid type parameter. Valid types are: ${validTypes.join(', ')}`);
    }

    const posts = await PostDB.getSummaryPostsDB(limit, type);

    res.set('Cache-Control', 'public, max-age=300'); // 5 minute cache

    res.status(StatusCodes.OK).json({
      success: true,
      posts: posts,
      metadata: {
        type,
        count: posts.length,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    handleError(error, req, res, 'fetch post summaries');
  }
};

const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;

    let author_id = null;
    try {
      if (req.cookies.auth_token) {
        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        author_id = decoded.user_id;
      }
    } catch (error) {
    }

    const options = {
      includeComments: req.query.includeComments === 'true',
      includeAuthor: req.query.includeAuthor !== 'false',
      includeStats: req.query.includeStats === 'true',
      includeReplies: req.query.includeCommentReplies === 'true',
    };

    const post = await PostDB.getPostByIdDB(postId, options, author_id);

    if (!post) {
      throw new Error("Post not found");
    }

    res.status(StatusCodes.OK).json({
      success: true,
      post: post,
      metadata: {
        includes: options,
        retrievedAt: new Date().toISOString(),
        ...(!author_id && { warning: "Viewing as guest - some features may be limited" })
      }
    });
  } catch (error) {
    handleError(error, req, res, 'fetch post by ID');
  }
};

const getPostsByUser = async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10, sortBy = 'created', sortOrder = 'DESC' } = req.query;
    const { page: p, limit: l } = validatePagination(page, limit);
    const { orderByField, orderDirection } = validateSorting(sortBy, sortOrder, getPostSortFields());

    const { posts, pagination } = await PostDB.getPostsByUserDB(username, p, l, orderByField, orderDirection);

    res.status(StatusCodes.OK).json({
      success: true,
      posts: posts,
      pagination: pagination,
      user: {
        username,
        postCount: pagination.totalItems
      },
      metadata: {
        retrievedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    handleError(error, req, res, 'fetch posts by user');
  }
};

const createPost = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { thread_id, title, content, tags = [] } = req.body;

    const result = await PostDB.createPostDB(userId, thread_id, title.trim(), content.trim(), tags);

    res.status(StatusCodes.CREATED).json({
      success: true,
      post: {
        id: result.post_id,
        title: result.title,
        threadId: result.thread_id
      },
      metadata: {
        createdBy: userId,
        createdAt: new Date().toISOString(),
        links: {
          viewPost: `/posts/${result.post_id}`,
          viewThread: `/threads/${result.thread_id}`
        }
      }
    });
  } catch (error) {
    handleError(error, req, res, 'create post');
  }
};

const updatePost = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { postId } = req.params;
    const { title, content, edit_reason, tags } = req.body;


    const result = await PostDB.updatePostDB(postId, userId, title?.trim(), content?.trim(), tags);

    res.status(StatusCodes.OK).json({
      success: true,
      post: {
        id: postId,
        updatedAt: result.updated_at,
        editCount: result.edit_count
      },
      metadata: {
        updatedFields: Object.keys({ title, content, tags }).filter(k => k in req.body),
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    handleError(error, req, res, 'update post');
  }
};

const deletePost = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const isModerator = req.user.is_moderator || false;
    const { postId } = req.params;
    const { delete_reason } = req.body;

    const result = await PostDB.deletePostDB(
      postId,
      userId,
      isModerator,
      delete_reason?.trim()
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Post deleted successfully",
      metadata: {
        postId,
        deletedBy: isModerator ? `moderator:${userId}` : `user:${userId}`,
        deletedAt: new Date().toISOString(),
        ...(delete_reason && { deleteReason: delete_reason.trim() })
      }
    });
  } catch (error) {
    handleError(error, req, res, 'delete post');
  }
};

const voteOnPost = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { postId } = req.params;
    const { vote } = req.body; // Expected values: 1 (like), -1 (dislike), 0 (remove vote)

    if (![-1, 0, 1].includes(vote)) {
      throw new Error("Invalid vote value");
    }

    const result = await PostDB.voteOnPostDB(postId, userId, vote);

    res.status(StatusCodes.OK).json({
      success: true,
      vote: {
        postId,
        newVote: vote,
        newScore: result.score
      },
      metadata: {
        votedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    handleError(error, req, res, 'process vote');
  }
};

export default {
  getAllPosts,
  getSummaryPosts,
  getPostById,
  getPostsByUser,
  createPost,
  updatePost,
  deletePost,
  voteOnPost
};