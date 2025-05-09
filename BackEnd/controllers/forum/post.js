import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import {
  getAllPostsDB,
  getSummaryPostsDB,
  getPostByIdDB,
  getPostsByUserDB,
  createPostDB,
  updatePostDB,
  deletePostDB,
} from "../../models/Forum/post.js";

dotenv.config();

/**
 * Handles post-related errors consistently across all routes
 * @param {Error} error - The error object
 * @param {Response} res - Express response object
 * @param {string} action - The action being performed (e.g., 'create', 'update', 'delete')
 */
export const handlePostError = (error, res, action = 'process') => {
  console.error(`Error while trying to ${action} post:`, error);

  // JWT Authentication Errors
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: "Invalid or expired token"
    });
  }

  // Input Validation Errors
  if (error.message.includes("required") ||
    error.message.includes("Invalid") ||
    error.message.includes("must be")) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  // Not Found Errors
  if (error.message.includes("not found")) {
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }

  // Authorization Errors
  if (error.message.includes("Unauthorized") ||
    error.message.includes("permission") ||
    error.message.includes("banned")) {
    return res.status(403).json({
      success: false,
      message: error.message
    });
  }

  // Resource Locked Errors
  if (error.message.includes("locked")) {
    return res.status(423).json({
      success: false,
      message: error.message
    });
  }

  // Database Constraint Errors
  if (error.code === 'ER_NO_REFERENCED_ROW' ||
    error.code === 'ER_DUP_ENTRY' ||
    error.code === 'ER_DATA_TOO_LONG') {
    return res.status(409).json({
      success: false,
      message: "Database constraint error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }

  // Default Server Error
  res.status(500).json({
    success: false,
    message: `Failed to ${action} post`,
    error: process.env.NODE_ENV === 'development' ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : undefined
  });
};

export const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';
    const categoryId = req.query.categoryId;
    const tagId = req.query.tagId;

    if (page < 1 || limit < 1 || limit > 100) {
      throw new Error("Invalid pagination parameters. Page must be ≥ 1 and limit must be between 1 and 100");
    }

    const validSortColumns = ['title', 'created_at', 'updated_at', 'view_count', 'like_count'];
    if (!validSortColumns.includes(sortBy)) {
      throw new Error(`Invalid sort parameter. Valid columns are: ${validSortColumns.join(', ')}`);
    }

    const { posts, totalPosts } = await getAllPostsDB(
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      categoryId,
      tagId
    );

    const totalPages = Math.ceil(totalPosts / limit);

    res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          totalItems: totalPosts,
          totalPages,
          currentPage: page,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        },
        filters: {
          search,
          sortBy,
          sortOrder,
          ...(categoryId && { categoryId }),
          ...(tagId && { tagId })
        }
      }
    });
  } catch (error) {
    handlePostError(error, res, 'fetch');
  }
};

export const getSummaryPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const type = req.query.type || 'recent'; // recent, popular, trending

    if (limit < 1 || limit > 20) {
      throw new Error("Invalid limit parameter. Must be between 1 and 20");
    }

    const validTypes = ['recent', 'popular', 'trending'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid type parameter. Valid types are: ${validTypes.join(', ')}`);
    }

    const posts = await getSummaryPostsDB(limit, type);

    res.status(200).json({
      success: true,
      data: {
        posts,
        meta: {
          count: posts.length,
          type,
          limit
        }
      }
    });
  } catch (error) {
    handlePostError(error, res, 'fetch summary');
  }
};

export const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;

    let author_id = null;
    if (req.cookies.auth_token) {
      const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
      author_id = decoded.user_id;
    }

    const includeComments = req.query.includeComments === 'true';
    const includeAuthor = req.query.includeAuthor !== 'false';
    const includeStats = req.query.includeStats === 'true';
    const includeCommentReplies = req.query.includeCommentReplies === 'true';
    
    const post = await getPostByIdDB(
      postId,
      {
        includeComments,
        includeAuthor,
        includeStats,
        includeCommentReplies
      },
      author_id
    );

    if (!post) {
      throw new Error(`Post with ID ${postId} not found`);
    }

    res.status(200).json({
      success: true,
      post: post,
      meta: {
        includes: {
          comments: includeComments,
          author: includeAuthor,
          stats: includeStats,
          commentReplies: includeCommentReplies
        }
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      // If token is invalid but we still want to show the post
      try {
        const post = await getPostByIdDB(
          req.params.postId,
          {
            includeComments: req.query.includeComments === 'true',
            includeAuthor: req.query.includeAuthor !== 'false',
            includeStats: req.query.includeStats === 'true',
            includeCommentReplies: req.query.includeCommentReplies === 'true'
          },
          null
        );
        
        if (post) {
          return res.status(200).json({
            success: true,
            post: post,
            meta: {
              includes: {
                comments: req.query.includeComments === 'true',
                author: req.query.includeAuthor !== 'false',
                stats: req.query.includeStats === 'true',
                commentReplies: req.query.includeCommentReplies === 'true'
              },
              warning: "Authentication token was invalid - showing public view"
            }
          });
        }
      } catch (dbError) {
        // Fall through to original error handling
      }
    }
    handlePostError(error, res, 'fetch');
  }
};

export const getPostsByUser = async (req, res) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';

    if (page < 1 || limit < 1 || limit > 50) {
      throw new Error("Invalid pagination parameters. Page must be ≥ 1 and limit must be between 1 and 50");
    }

    const validSortColumns = ['created_at', 'updated_at', 'view_count', 'like_count'];
    if (!validSortColumns.includes(sortBy)) {
      throw new Error(`Invalid sort parameter. Valid columns are: ${validSortColumns.join(', ')}`);
    }

    const { posts, totalPosts } = await getPostsByUserDB(
      username.trim(),
      page,
      limit,
      sortBy,
      sortOrder
    );

    res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          totalItems: totalPosts,
          totalPages: Math.ceil(totalPosts / limit),
          currentPage: page,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(totalPosts / limit),
          hasPreviousPage: page > 1
        },
        user: {
          username,
          postCount: totalPosts
        }
      }
    });
  } catch (error) {
    handlePostError(error, res, 'fetch user');
  }
};

export const createPost = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { thread_id, title, content, tag_name = [] } = req.body;

    const result = await createPostDB(
      userId,
      thread_id,
      title.trim(),
      content.trim(),
      tag_name && tag_name.length > 0 ? tag_name : null
    );

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: {
        postId: result.post_id,
        threadId: result.thread_id,
        threadName: result.thread_name,
        createdAt: result.created_at
      },
      links: {
        viewPost: `/forum/posts/${result.post_id}`,
        viewThread: `/forum/threads/${result.thread_id}`
      }
    });
  } catch (error) {
    handlePostError(error, res, 'create');
  }
};

export const updatePost = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { postId } = req.params;
    const { title, content, edit_reason, tags } = req.body;

    const result = await updatePostDB(
      postId,
      userId,
      title,
      content?.trim(),
      tags
    );

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: {
        postId: postId,
        updatedAt: result.updated_at,
        editCount: result.edit_count,
        ...(edit_reason && { editReason: edit_reason.trim() })
      },
      links: {
        viewPost: `/forum/posts/${postId}`,
        viewHistory: `/forum/posts/${postId}/history`
      }
    });
  } catch (error) {
    handlePostError(error, res, 'update');
  }
};

export const deletePost = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const is_moderator = decoded.is_moderator || false;

    const { postId } = req.params;
    const { delete_reason } = req.body;

    const result = await deletePostDB(
      postId,
      userId,
      is_moderator,
      delete_reason?.trim()
    );

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
      data: {
        postId: postId,
        deletedAt: new Date().toISOString(),
        ...(is_moderator && { deletedBy: `moderator:${author_id}` }),
        ...(delete_reason && { deleteReason: delete_reason.trim() })
      }
    });
  } catch (error) {
    handlePostError(error, res, 'delete');
  }
};