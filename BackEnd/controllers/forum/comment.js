import express from 'express';
import pino from 'pino';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import CommentDB from '../../models/Forum/comment.js';
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
const validateId = (id, type) => {
    const parsedId = parseInt(id);
    if (isNaN(parsedId) || parsedId < 1) {
        throw new ValidationError(`Invalid ${type}`, { id });
    }
    return parsedId;
};

const validatePagination = (page, limit, maxLimit = 50) => {
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

const validateContent = (content) => {
    if (!content || typeof content !== 'string' || content.trim() === '') {
        throw new ValidationError('Content is required and must be a non-empty string', { content });
    }
    if (content.length > 2000) {
        throw new ValidationError('Content must be less than 2000 characters', { contentLength: content.length });
    }
    return content.trim();
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
const getCommentsByPostId = async (req, res) => {
    try {
        const { postId } = req.params;
        const validatedPostId = validateId(postId, 'Post ID');
        const { page = 1, limit = 20 } = req.query;
        const { page: p, limit: l } = validatePagination(page, limit);

        const { comments, totalCount } = await CommentDB.getCommentsByPostIdDB(validatedPostId, p, l);

        if (!comments || comments.length === 0) {
            throw new NotFoundError('No comments found for this post', { postId: validatedPostId });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            comments,
            pagination: {
                currentPage: p,
                totalPages: Math.ceil(totalCount / l),
                totalItems: totalCount,
                itemsPerPage: l,
            },
            metadata: {
                postId: validatedPostId,
                retrievedAt: new Date().toISOString(),
                cacheHint: {
                    recommended: true,
                    duration: '5m',
                },
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'fetch comments by post');
    }
};

const getAllCommentsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const validatedUserId = validateId(userId, 'User ID');
        const { page = 1, limit = 20 } = req.query;
        const { page: p, limit: l } = validatePagination(page, limit);

        const { comments, totalCount } = await CommentDB.getAllCommentsByUserDB(validatedUserId, p, l);

        if (!comments || comments.length === 0) {
            throw new NotFoundError('No comments found for this user', { userId: validatedUserId });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            comments,
            pagination: {
                currentPage: p,
                totalPages: Math.ceil(totalCount / l),
                totalItems: totalCount,
                itemsPerPage: l,
            },
            metadata: {
                userId: validatedUserId,
                retrievedAt: new Date().toISOString(),
                cacheHint: {
                    recommended: false,
                    reason: 'User-specific data changes frequently',
                },
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'fetch comments by user');
    }
};

const addCommentToPost = async (req, res) => {
    try {
        const userId = getUserIdFromToken(req);
        const { postId } = req.params;
        const validatedPostId = validateId(postId, 'Post ID');
        const { content, parent_comment_id } = req.body;

        const validatedContent = validateContent(content);
        let validatedParentCommentId = null;
        if (parent_comment_id) {
            validatedParentCommentId = validateId(parent_comment_id, 'Parent comment ID');
        }

        const commentId = await CommentDB.addCommentToPostDB(
            userId,
            validatedPostId,
            validatedContent,
            validatedParentCommentId
        );

        if (!commentId) {
            throw new AppError('Failed to create comment', StatusCodes.INTERNAL_SERVER_ERROR, 'CREATE_FAILED');
        }

        res.status(StatusCodes.CREATED).json({
            success: true,
            commentId,
            message: 'Comment created successfully',
            metadata: {
                createdBy: userId,
                createdAt: new Date().toISOString(),
                isReply: !!validatedParentCommentId,
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'create comment');
    }
};

const updateComment = async (req, res) => {
    try {
        const userId = getUserIdFromToken(req);
        const { commentId } = req.params;
        const validatedCommentId = validateId(commentId, 'Comment ID');
        const { content } = req.body;

        const validatedContent = validateContent(content);

        const result = await CommentDB.updateCommentDB(validatedCommentId, validatedContent);

        if (!result) {
            throw new AppError('Failed to update comment', StatusCodes.INTERNAL_SERVER_ERROR, 'UPDATE_FAILED');
        }

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Comment updated successfully',
            metadata: {
                updatedBy: userId,
                updatedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'update comment');
    }
};

const deleteComment = async (req, res) => {
    try {
        const userId = getUserIdFromToken(req);
        const { commentId } = req.params;
        const validatedCommentId = validateId(commentId, 'Comment ID');

        const result = await CommentDB.deleteCommentDB(validatedCommentId);

        if (!result) {
            throw new AppError('Failed to delete comment', StatusCodes.INTERNAL_SERVER_ERROR, 'DELETE_FAILED');
        }

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Comment deleted successfully',
            metadata: {
                deletedBy: userId,
                deletedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'delete comment');
    }
};

// Global Error Handler
app.use((err, req, res, next) => {
    errorHandler(err, req, res, 'unknown operation');
});

export default {
    getCommentsByPostId,
    getAllCommentsByUser,
    addCommentToPost,
    updateComment,
    deleteComment,
};