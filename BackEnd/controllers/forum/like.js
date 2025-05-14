import express from 'express';
import pino from 'pino';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import LikeDB from '../../models/Forum/like.js';
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
const validateId = (id, type) => {
  const parsedId = parseInt(id);
  if (isNaN(parsedId) || parsedId < 1) {
    throw new ValidationError(`Invalid ${type}`, { id });
  }
  return parsedId;
};

const getUserIdFromToken = (req) => {
  if (!req.cookies?.auth_token) {
    throw new UnauthorizedError('No authentication token provided');
  }

  try {
    const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
    if (!decoded.user_id) {
      throw new UnauthorizedError('Invalid token payload');
    }
    return decoded.user_id;
  } catch (jwtError) {
    throw new UnauthorizedError('Invalid or expired token', { token: req.cookies.auth_token });
  }
};

// Controller Functions
const likePost = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    const { postId } = req.params;
    const validatedPostId = validateId(postId, 'Post ID');

    const result = await LikeDB.likePostDB(userId, validatedPostId);

    if (!result) {
      throw new AppError('Failed to like post', StatusCodes.INTERNAL_SERVER_ERROR, 'LIKE_FAILED');
    }

    if (result.message?.includes('already liked')) {
      throw new ConflictError('Post already liked by user', { userId, postId: validatedPostId });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message || 'Post liked successfully',
      metadata: {
        userId,
        postId: validatedPostId,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    errorHandler(error, req, res, 'like post');
  }
};

const unlikePost = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    const { postId } = req.params;
    const validatedPostId = validateId(postId, 'Post ID');

    const result = await LikeDB.unlikePostDB(userId, validatedPostId);

    if (!result) {
      throw new NotFoundError('Like not found for this post', { userId, postId: validatedPostId });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message || 'Post unliked successfully',
      metadata: {
        userId,
        postId: validatedPostId,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    errorHandler(error, req, res, 'unlike post');
  }
};

const likeComment = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    const { commentId } = req.params;
    const validatedCommentId = validateId(commentId, 'Comment ID');

    const result = await LikeDB.likeCommentDB(userId, validatedCommentId);

    if (!result) {
      throw new AppError('Failed to like comment', StatusCodes.INTERNAL_SERVER_ERROR, 'LIKE_FAILED');
    }

    if (result.message?.includes('already liked')) {
      throw new ConflictError('Comment already liked by user', { userId, commentId: validatedCommentId });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message || 'Comment liked successfully',
      metadata: {
        userId,
        commentId: validatedCommentId,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    errorHandler(error, req, res, 'like comment');
  }
};

const unlikeComment = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    const { commentId } = req.params;
    const validatedCommentId = validateId(commentId, 'Comment ID');
    const { postId } = req.body;
    let validatedPostId = null;
    if (postId) {
      validatedPostId = validateId(postId, 'Post ID');
    }

    const result = await LikeDB.unlikeCommentDB(userId, validatedCommentId, validatedPostId);

    if (!result) {
      throw new NotFoundError('Like not found for this comment', { userId, commentId: validatedCommentId });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message || 'Comment unliked successfully',
      metadata: {
        userId,
        commentId: validatedCommentId,
        postId: validatedPostId,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    errorHandler(error, req, res, 'unlike comment');
  }
};

// Global Error Handler
app.use((err, req, res, next) => {
  errorHandler(err, req, res, 'unknown operation');
});

export default {
  likePost,
  unlikePost,
  likeComment,
  unlikeComment,
};