import express from 'express';
import pino from 'pino';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import TagDB from '../../models/Forum/tag.js';
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

const validateSorting = (sortBy, sortOrder, allowedFields) => {
    const orderByField = allowedFields[sortBy] || allowedFields[Object.keys(allowedFields)[0]];
    const orderDirection = sortOrder && sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    return { orderByField, orderDirection };
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
const getAllTags = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', sortBy = 'usage_count', sortOrder = 'DESC' } = req.query;
        const { page: p, limit: l } = validatePagination(page, limit);

        const allowedSortFields = {
            tag_name: 't.tag_name',
            usage_count: 'usage_count',
            last_used_at: 't.last_used_at',
            created_at: 't.created_at',
            post_count: 'post_count',
        };

        const { orderByField, orderDirection } = validateSorting(sortBy, sortOrder, allowedSortFields);

        const { tags, pagination } = await TagDB.getAllTagsDB(p, l, search, orderByField, orderDirection);

        if (!tags || tags.length === 0) {
            throw new NotFoundError('No tags found', { search });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            tags,
            pagination,
            metadata: {
                retrievedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'fetch all tags');
    }
};

const getSummaryTags = async (req, res) => {
    try {
        const tags = await TagDB.getSummaryTagsDB();

        if (!tags || tags.length === 0) {
            throw new NotFoundError('No tags found');
        }

        res.status(StatusCodes.OK).json({
            success: true,
            tags,
            metadata: {
                count: tags.length,
                retrievedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'fetch summary tags');
    }
};

const getSummaryLittleTags = async (req, res) => {
    try {
        let { limit } = req.query;
        if (limit !== undefined && (isNaN(limit) || parseInt(limit) < 1)) {
            throw new ValidationError('Limit must be a positive number', { limit });
        }
        limit = limit ? parseInt(limit) : null;

        const { tags } = await TagDB.getSummaryLittleTagsDB(limit);

        if (!tags || tags.length === 0) {
            throw new NotFoundError('No tags found');
        }

        res.status(StatusCodes.OK).json({
            success: true,
            tags,
            metadata: {
                count: tags.length,
                retrievedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'fetch little summary tags');
    }
};

const getSummaryTagById = async (req, res) => {
    try {
        const { tagId } = req.params;
        const parsedTagId = parseInt(tagId);
        if (isNaN(parsedTagId) || parsedTagId < 1) {
            throw new ValidationError('Valid tag ID is required', { tagId });
        }

        const tag = await TagDB.getSummaryTagByIdDB(parsedTagId);

        if (!tag) {
            throw new NotFoundError('Tag not found', { tagId });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            tag,
            metadata: {
                tagId: parsedTagId,
                retrievedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'fetch tag summary by ID');
    }
};

const getTagById = async (req, res) => {
    try {
        const { tagId } = req.params;
        const parsedTagId = parseInt(tagId);
        if (isNaN(parsedTagId) || parsedTagId < 1) {
            throw new ValidationError('Valid tag ID is required', { tagId });
        }

        const tag = await TagDB.getTagByIdDB(parsedTagId);

        if (!tag) {
            throw new NotFoundError('Tag not found', { tagId });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            tag,
            metadata: {
                tagId: parsedTagId,
                retrievedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'fetch tag by ID');
    }
};

const getTagByName = async (req, res) => {
    try {
        const { tagName } = req.query;
        if (!tagName || typeof tagName !== 'string' || tagName.trim() === '') {
            throw new ValidationError('Valid tag name is required', { tagName });
        }

        const tag = await TagDB.getTagByNameDB(tagName.trim());

        if (!tag) {
            throw new NotFoundError('Tag not found', { tagName });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            tag,
            metadata: {
                tagName: tagName.trim(),
                retrievedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'fetch tag by name');
    }
};

const getPostsByTag = async (req, res) => {
    try {
        const { tagId } = req.params;
        const parsedTagId = parseInt(tagId);
        if (isNaN(parsedTagId) || parsedTagId < 1) {
            throw new ValidationError('Valid tag ID is required', { tagId });
        }

        const { page = 1, limit = 10 } = req.query;
        const { page: p, limit: l } = validatePagination(page, limit);

        let author_id = null;
        if (req.cookies?.auth_token) {
            author_id = getUserIdFromToken(req);
        }

        const { posts, tag, pagination } = await TagDB.getPostsByTagDB(parsedTagId, p, l, author_id);

        if (!tag) {
            throw new NotFoundError('Tag not found', { tagId });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            tag,
            posts,
            pagination,
            metadata: {
                tagId: parsedTagId,
                retrievedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'fetch posts by tag');
    }
};

const getPopularTags = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const parsedLimit = parseInt(limit);
        if (isNaN(parsedLimit) || parsedLimit < 1) {
            throw new ValidationError('Limit must be a positive number', { limit });
        }

        const tags = await TagDB.getPopularTagsDB(parsedLimit);

        if (!tags || tags.length === 0) {
            throw new NotFoundError('No tags found');
        }

        res.status(StatusCodes.OK).json({
            success: true,
            tags,
            metadata: {
                count: tags.length,
                limit: parsedLimit,
                retrievedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'fetch popular tags');
    }
};

const getTagsByUser = async (req, res) => {
    try {
        const { username } = req.params;
        if (!username || typeof username !== 'string' || username.trim() === '') {
            throw new ValidationError('Valid username is required', { username });
        }

        const tags = await TagDB.getTagsByUserDB(username.trim());

        if (!tags || tags.length === 0) {
            throw new NotFoundError('No tags found for this user', { username });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            tags,
            metadata: {
                username: username.trim(),
                count: tags.length,
                retrievedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'fetch tags by user');
    }
};

const createTag = async (req, res) => {
    try {
        const { tag_name, description } = req.body;
        if (!tag_name || typeof tag_name !== 'string' || tag_name.trim() === '') {
            throw new ValidationError('Valid tag name is required', { tag_name });
        }

        const author_id = getUserIdFromToken(req);

        const { tagId, message } = await TagDB.createTagDB(tag_name.trim(), description?.trim(), author_id);

        if (!tagId) {
            throw new AppError('Failed to create tag', StatusCodes.INTERNAL_SERVER_ERROR, 'CREATE_FAILED');
        }

        res.status(StatusCodes.CREATED).json({
            success: true,
            tagId,
            message: message || 'Tag created successfully',
            metadata: {
                createdBy: author_id,
                createdAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'create tag');
    }
};

const updateTagById = async (req, res) => {
    try {
        const { tagId } = req.params;
        const parsedTagId = parseInt(tagId);
        if (isNaN(parsedTagId) || parsedTagId < 1) {
            throw new ValidationError('Valid tag ID is required', { tagId });
        }

        const { tag_name, description } = req.body;
        if (!tag_name && !description) {
            throw new ValidationError('At least one field (tag_name or description) must be provided for update');
        }

        const result = await TagDB.updateTagDB(parsedTagId, tag_name?.trim(), description?.trim());

        if (!result) {
            throw new NotFoundError('Tag not found', { tagId });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Tag updated successfully',
            metadata: {
                updatedAt: new Date().toISOString(),
                updatedFields: Object.keys({ tag_name, description }).filter((key) => req.body[key] !== undefined),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'update tag');
    }
};

const deleteTagById = async (req, res) => {
    try {
        const { tagId } = req.params;
        const parsedTagId = parseInt(tagId);
        if (isNaN(parsedTagId) || parsedTagId < 1) {
            throw new ValidationError('Valid tag ID is required', { tagId });
        }

        const result = await TagDB.deleteTagDB(parsedTagId);

        if (!result) {
            throw new NotFoundError('Tag not found', { tagId });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Tag deleted successfully',
            metadata: {
                deletedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'delete tag');
    }
};

// Global Error Handler
app.use((err, req, res, next) => {
    errorHandler(err, req, res, 'unknown operation');
});

export default {
    getAllTags,
    getSummaryTags,
    getSummaryLittleTags,
    getSummaryTagById,
    getTagById,
    getTagByName,
    getPostsByTag,
    getPopularTags,
    getTagsByUser,
    createTag,
    updateTagById,
    deleteTagById,
};