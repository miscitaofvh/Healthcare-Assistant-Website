import express from 'express';
import pino from 'pino';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import ThreadDB from '../../models/Forum/thread.js';
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

// Validation Functions
const validatePagination = (page, limit, maxLimit = 100) => {
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    if (isNaN(parsedPage) || isNaN(parsedLimit) || parsedPage < 1 || parsedLimit < 1 || parsedLimit > maxLimit) {
        throw new ValidationError(`Invalid pagination: Page must be ≥1 and limit between 1-${maxLimit}`, {
            page,
            limit,
            maxLimit,
        });
    }
    return { page: parsedPage, limit: parsedLimit };
};

const validateSorting = (sortBy, sortOrder) => {
    const allowedFields = {
        thread_name: 'ft.thread_name',
        created: 'ft.created_at',
        updated: 'ft.last_updated',
        posts: 'post_count',
        last_post_date: 'last_post_date',
    };
    const orderByField = allowedFields[sortBy] || allowedFields.thread_name;
    const orderDirection = sortOrder && sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    return { orderByField, orderDirection };
};

const validateSortingPost = (sortBy) => {
    const allowedFields = {
        newest: 'p.created_at DESC',
        oldest: 'p.created_at ASC',
        most_comments: 'p.comment_count DESC',
        most_likes: 'p.like_count DESC',
    };
    return allowedFields[sortBy] || allowedFields.newest;
};

const getSortDescription = (sort) => {
    const descriptions = {
        newest: 'Most recently created threads first',
        oldest: 'Oldest threads first',
        most_posts: 'Threads with most posts first',
        last_post_date: 'Threads with most recent posts first',
    };
    return descriptions[sort] || 'Default sorting';
};

// Controller Functions
const getAllThreads = async (req, res) => {
    try {
        const { page = 1, limit = 10, sortBy = 'thread_name', sortOrder = 'ASC' } = req.query;
        const { page: p, limit: l } = validatePagination(page, limit);
        const { orderByField, orderDirection } = validateSorting(sortBy, sortOrder);

        const { threads, pagination } = await ThreadDB.getAllThreadsDB(p, l, orderByField, orderDirection);

        if (!threads || threads.length === 0) {
            throw new NotFoundError('No threads found');
        }

        res.status(StatusCodes.OK).json({
            success: true,
            threads,
            pagination,
            metadata: {
                message: 'Threads retrieved successfully',
                retrievedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'fetch all threads');
    }
};

const getSummaryThreads = async (req, res) => {
    try {
        let { limit } = req.query;
        if (limit !== undefined && (isNaN(limit) || parseInt(limit) < 1)) {
            throw new ValidationError('Invalid limit parameter', { limit });
        }
        limit = limit ? parseInt(limit) : null;

        const threads = await ThreadDB.getSummaryThreadsDB(limit);

        if (!threads || threads.length === 0) {
            throw new NotFoundError('No threads found');
        }

        res.status(StatusCodes.OK).json({
            success: true,
            count: threads.length,
            threads,
            metadata: {
                message: 'Thread summaries retrieved successfully',
                source: 'database',
                generatedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'fetch thread summaries');
    }
};

const getThreadById = async (req, res) => {
    try {
        const { threadId } = req.params;

        const thread = await ThreadDB.getThreadByIdDB(threadId);

        if (!thread) {
            throw new NotFoundError('Thread not found', { threadId });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            thread,
            metadata: {
                retrievedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'fetch thread by ID');
    }
};

const getPostsByThread = async (req, res) => {
    try {
        const { threadId } = req.params;
        const { page = 1, limit = 10, sortBy = 'newest' } = req.query;
        const { page: p, limit: l } = validatePagination(page, limit);
        const sort = validateSortingPost(sortBy);
        let author_id = null;

        if (req.cookies.auth_token) {
            try {
                const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
                author_id = decoded.user_id;
            } catch (jwtError) {
                throw new UnauthorizedError('Invalid or expired token', { token: req.cookies.auth_token });
            }
        }

        const { thread, posts, pagination } = await ThreadDB.getPostsByThreadDB(threadId, p, l, sort, author_id);

        if (!thread) {
            throw new NotFoundError('Thread not found', { threadId });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            thread,
            posts,
            pagination,
            sort: {
                by: sort,
                description: getSortDescription(sortBy),
            },
            metadata: {
                threadId,
                retrievedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'fetch posts by thread');
    }
};

const getThreadByName = async (req, res) => {
    try {
        const { threadName } = req.params;

        const thread = await ThreadDB.getThreadByNameDB(threadName);

        if (!thread) {
            throw new NotFoundError('Thread not found', { threadName });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            thread,
            metadata: {
                retrievedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'fetch thread by name');
    }
};

const getThreadsByUser = async (req, res) => {
    try {
        const { username } = req.params;
        const { page = 1, limit = 10, sortBy = 'thread_name', sortOrder = 'ASC' } = req.query;
        const { page: p, limit: l } = validatePagination(page, limit);
        const { orderByField, orderDirection } = validateSorting(sortBy, sortOrder);

        const { threads, pagination } = await ThreadDB.getThreadsByUserDB(username, p, l, orderByField, orderDirection);

        if (!threads || threads.length === 0) {
            throw new NotFoundError('No threads found for this user', { username });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            threads,
            pagination,
            metadata: {
                username,
                count: threads.length,
                retrievedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'fetch threads by user');
    }
};

const createThread = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            throw new UnauthorizedError('No authentication token provided');
        }

        const { category_id, thread_name, description } = req.body;

        if (!thread_name) {
            throw new ValidationError('Thread name is required');
        }

        if (!category_id) {
            throw new ValidationError('Category ID is required');
        }

        const { threadId } = await ThreadDB.createThreadDB(userId, category_id, thread_name, description);

        if (!threadId) {
            throw new AppError('Failed to create thread', StatusCodes.INTERNAL_SERVER_ERROR, 'CREATE_FAILED');
        }

        res.status(StatusCodes.CREATED).json({
            success: true,
            message: 'Thread created successfully',
            data: { threadId },
            metadata: {
                createdBy: userId,
                createdAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'create thread');
    }
};

const updateThread = async (req, res) => {
    try {
        const { threadId } = req.params;
        const { thread_name, description } = req.body;

        if (!thread_name && !description) {
            throw new ValidationError('No fields to update provided');
        }

        const result = await ThreadDB.updateThreadDB(threadId, thread_name, description);

        if (!result) {
            throw new NotFoundError('Thread not found', { threadId });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            message: result,
            metadata: {
                updatedAt: new Date().toISOString(),
                updatedFields: Object.keys({ thread_name, description }).filter((key) => req.body[key] !== undefined),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'update thread');
    }
};

const deleteThread = async (req, res) => {
    try {
        const { threadId } = req.params;

        const result = await ThreadDB.deleteThreadDB(threadId);

        if (!result) {
            throw new NotFoundError('Thread not found', { threadId });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            message: result,
            metadata: {
                deletedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'delete thread');
    }
};

// Global Error Handler
app.use((err, req, res, next) => {
    errorHandler(err, req, res, 'unknown operation');
});

export default {
    getAllThreads,
    getSummaryThreads,
    getThreadById,
    getPostsByThread,
    getThreadByName,
    getThreadsByUser,
    createThread,
    updateThread,
    deleteThread,
};