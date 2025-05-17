import express from 'express';
import pino from 'pino';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import PostDB from '../../models/Forum/post.js';
import crypto from 'crypto';

dotenv.config();

const app = express();

// Structured Logger Setup
const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
});

// Request ID Middleware
const requestIdMiddleware = (req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};
app.use(requestIdMiddleware);

// Custom Error Classes
class AppError extends Error {
  constructor(message, statusCode, errorCode, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isAppError = true;
  }
}

class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, StatusCodes.BAD_REQUEST, 'VALIDATION_ERROR', details);
  }
}

class NotFoundError extends AppError {
  constructor(message, details = {}) {
    super(message, StatusCodes.NOT_FOUND, 'NOT_FOUND', details);
  }
}

class ConflictError extends AppError {
  constructor(message, details = {}) {
    super(message, StatusCodes.CONFLICT, 'CONFLICT', details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message, details = {}) {
    super(message, StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED', details);
  }
}

class ForbiddenError extends AppError {
  constructor(message, details = {}) {
    super(message, StatusCodes.FORBIDDEN, 'FORBIDDEN', details);
  }
}

// Error Handler
const errorHandler = (error, req, res, action = 'process') => {
  const requestId = req.requestId || crypto.randomUUID();

  // Default values for unexpected errors
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = `Failed to ${action}`;
  const details = {};

  // Handle AppError instances
  if (error.isAppError) {
    statusCode = error.statusCode;
    errorCode = error.errorCode;
    message = error.message;
    Object.assign(details, error.details);
  }

  // Log the error
  logger.error({
    requestId,
    action,
    method: req.method,
    url: req.originalUrl,
    error: {
      message: error.message,
      code: errorCode,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    },
  });

  // Send response
  res.status(statusCode).json({
    success: false,
    errorCode,
    message,
    details,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      debug: { message: error.message, stack: error.stack?.split('\n')[0] },
    }),
  });
};

// Helper Functions
const validatePagination = (page, limit, maxLimit = 100) => {
  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);
  if (isNaN(parsedPage) || isNaN(parsedLimit) || parsedPage < 1 || parsedLimit < 1 || parsedLimit > maxLimit) {
    throw new ValidationError(`Invalid pagination parameters: Page must be ≥1 and limit between 1-${maxLimit}`, {
      page,
      limit,
      maxLimit,
    });
  }
  return { page: parsedPage, limit: parsedLimit };
};

const validateSorting = (sortBy, sortOrder) => {
  const allowedFields = {
    created: 'created_at',
    updated: 'last_updated',
    views: 'view_count',
    likes: 'like_count',
    comments: 'comment_count',
    title: 'title',
  };

  const orderByField = allowedFields[sortBy] || allowedFields.created;
  const orderDirection = sortOrder && sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  return { orderByField, orderDirection };
};

const getUserIdFromToken = (req, requireAuth = false) => {
  if (!req.cookies?.auth_token) {
    if (requireAuth) {
      throw new UnauthorizedError('No authentication token provided');
    }
    return null;
  }

  try {
    const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
    if (!decoded.user_id) {
      throw new UnauthorizedError('Invalid token payload');
    }
    return decoded.user_id;
  } catch (jwtError) {
    if (requireAuth) {
      throw new UnauthorizedError('Invalid or expired token', { token: req.cookies.auth_token });
    }
    return null;
  }
};

// Controller Functions
const getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'created', sortOrder = 'DESC' } = req.query;
    const { page: p, limit: l } = validatePagination(page, limit);
    const { orderByField, orderDirection } = validateSorting(sortBy, sortOrder);

    const { posts, pagination } = await PostDB.getAllPostsDB(p, l, orderByField, orderDirection);

    if (!posts || posts.length === 0) {
      throw new NotFoundError('No posts found');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      posts,
      pagination,
      metadata: {
        message: 'Posts retrieved successfully',
        retrievedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    errorHandler(error, req, res, 'fetch all posts');
  }
};

const getSummaryPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    if (isNaN(limit) || limit < 1 || limit > 20) {
      throw new ValidationError('Invalid limit parameter. Must be between 1 and 20', { limit });
    }

    const posts = await PostDB.getSummaryPostsDB(limit);

    if (!posts || posts.length === 0) {
      throw new NotFoundError('No posts found');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      posts,
      metadata: {
        count: posts.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    errorHandler(error, req, res, 'fetch post summaries');
  }
};

const getPopularPosts = async (req, res) => {
  try {
    let { limit } = req.query;
    if (limit !== undefined && (isNaN(limit) || parseInt(limit) < 1)) {
      throw new ValidationError('Limit must be a positive number', { limit });
    }
    limit = limit ? parseInt(limit) : null;

    const posts = await PostDB.getPopularPostsDB(limit);

    if (!posts || posts.length === 0) {
      throw new NotFoundError('No posts found');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      posts,
      metadata: {
        count: posts.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    errorHandler(error, req, res, 'fetch post summaries');
  }
};

const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;
    const parsedPostId = parseInt(postId);
    if (isNaN(parsedPostId) || parsedPostId < 1) {
      throw new ValidationError('Invalid post ID', { postId });
    }

    const author_id = getUserIdFromToken(req);

    const options = {
      includeComments: req.query.includeComments === 'true',
      includeAuthor: req.query.includeAuthor !== 'false',
      includeStats: req.query.includeStats === 'true',
      includeReplies: req.query.includeCommentReplies === 'true',
    };

    const post = await PostDB.getPostByIdDB(parsedPostId, options, author_id);

    if (!post) {
      throw new NotFoundError('Post not found', { postId });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      post,
      metadata: {
        includes: options,
        retrievedAt: new Date().toISOString(),
        ...(!author_id && { warning: 'Viewing as guest - some features may be limited' }),
      },
    });
  } catch (error) {
    errorHandler(error, req, res, 'fetch post by ID');
  }
};

const getPostsByUser = async (req, res) => {
  try {
    const { username } = req.params;
    if (!username || typeof username !== 'string' || username.trim() === '') {
      throw new ValidationError('Valid username is required', { username });
    }

    const { page = 1, limit = 10, sortBy = 'created', sortOrder = 'DESC' } = req.query;
    const { page: p, limit: l } = validatePagination(page, limit);
    const { orderByField, orderDirection } = validateSorting(sortBy, sortOrder);

    const { posts, pagination } = await PostDB.getPostsByUserDB(username.trim(), p, l, orderByField, orderDirection);

    if (!posts || posts.length === 0) {
      throw new NotFoundError('No posts found for this user', { username });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      posts,
      pagination,
      user: {
        username: username.trim(),
        postCount: pagination.totalItems,
      },
      metadata: {
        retrievedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    errorHandler(error, req, res, 'fetch posts by user');
  }
};

const createPost = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req, true);
    const { thread_id, title, content, tags = [] } = req.body;

    if (!thread_id || isNaN(parseInt(thread_id)) || parseInt(thread_id) < 1) {
      throw new ValidationError('Valid thread ID is required', { thread_id });
    }
    if (!title || typeof title !== 'string' || title.trim() === '') {
      throw new ValidationError('Title is required', { title });
    }
    if (!content || typeof content !== 'string' || content.trim() === '') {
      throw new ValidationError('Content is required', { content });
    }
    if (!Array.isArray(tags)) {
      throw new ValidationError('Tags must be an array', { tags });
    }

    const result = await PostDB.createPostDB(userId, parseInt(thread_id), title.trim(), content.trim(), tags);

    if (!result.postId) {
      throw new AppError('Failed to create post', StatusCodes.INTERNAL_SERVER_ERROR, 'CREATE_FAILED');
    }

    res.status(StatusCodes.CREATED).json({
      success: true,
      post: {
        id: result.postId,
        title: result.title,
        threadId: result.threadId,
      },
      metadata: {
        createdBy: userId,
        createdAt: new Date().toISOString(),
        links: {
          viewPost: `/posts/${result.postId}`,
          viewThread: `/threads/${result.threadId}`,
        },
      },
    });
  } catch (error) {
    errorHandler(error, req, res, 'create post');
  }
};

const updatePost = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req, true);
    const { postId } = req.params;
    const parsedPostId = parseInt(postId);
    if (isNaN(parsedPostId) || parsedPostId < 1) {
      throw new ValidationError('Invalid post ID', { postId });
    }

    const { title, content, edit_reason, tags } = req.body;
    if (!title && !content && !tags && !edit_reason) {
      throw new ValidationError('At least one field (title, content, tags, or edit_reason) must be provided for update');
    }

    const result = await PostDB.updatePostDB(parsedPostId, userId, title?.trim(), content?.trim(), tags);

    if (!result) {
      throw new NotFoundError('Post not found', { postId });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      post: {
        id: parsedPostId,
        updatedAt: result.updated_at,
        editCount: result.edit_count,
      },
      metadata: {
        updatedFields: Object.keys({ title, content, tags, edit_reason }).filter((k) => k in req.body),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    errorHandler(error, req, res, 'update post');
  }
};

const deletePost = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req, true);
    const isModerator = req.user?.is_moderator || false;
    const { postId } = req.params;
    const parsedPostId = parseInt(postId);
    if (isNaN(parsedPostId) || parsedPostId < 1) {
      throw new ValidationError('Invalid post ID', { postId });
    }

    const { delete_reason } = req.body;

    const result = await PostDB.deletePostDB(parsedPostId, userId, isModerator, delete_reason?.trim());

    if (!result) {
      throw new NotFoundError('Post not found', { postId });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Post deleted successfully',
      metadata: {
        postId: parsedPostId,
        deletedBy: isModerator ? `moderator:${userId}` : `user:${userId}`,
        deletedAt: new Date().toISOString(),
        ...(delete_reason && { deleteReason: delete_reason.trim() }),
      },
    });
  } catch (error) {
    errorHandler(error, req, res, 'delete post');
  }
};

const voteOnPost = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req, true);
    const { postId } = req.params;
    const parsedPostId = parseInt(postId);
    if (isNaN(parsedPostId) || parsedPostId < 1) {
      throw new ValidationError('Invalid post ID', { postId });
    }

    const { vote } = req.body;
    if (![-1, 0, 1].includes(vote)) {
      throw new ValidationError('Invalid vote value. Must be -1, 0, or 1', { vote });
    }

    const result = await PostDB.voteOnPostDB(parsedPostId, userId, vote);

    if (!result) {
      throw new NotFoundError('Post not found', { postId });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      vote: {
        postId: parsedPostId,
        newVote: vote,
        newScore: result.score,
      },
      metadata: {
        votedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    errorHandler(error, req, res, 'process vote');
  }
};

// Global Error Handler
app.use((err, req, res, next) => {
  errorHandler(err, req, res, 'unknown operation');
});

export default {
  getAllPosts,
  getSummaryPosts,
  getPopularPosts,
  getPostById,
  getPostsByUser,
  createPost,
  updatePost,
  deletePost,
  voteOnPost,
};