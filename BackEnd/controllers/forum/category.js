import express from 'express';
import pino from 'pino';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import CategoryDB from '../../models/Forum/category.js';
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
        category_name: 'fc.category_name',
        created: 'fc.created_at',
        updated: 'fc.last_updated',
        threads: 'thread_count',
        posts: 'post_count',
    };
    const orderByField = allowedFields[sortBy] || allowedFields.category_name;
    const orderDirection = sortOrder && sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    return { orderByField, orderDirection };
};

const validateSortingThread = (sortBy, sortOrder) => {
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
    const orderByField = allowedFields[sortBy] || allowedFields.newest;
    return orderByField;
};

const getSortDescription = (sort) => {
    const descriptions = {
        newest: 'Most recently created posts first',
        oldest: 'Oldest posts first',
        most_comments: 'Posts with most comments first',
        most_likes: 'Posts with most likes first',
    };
    return descriptions[sort] || 'Default sorting';
};

// Controller Functions
const getAllCategories = async (req, res) => {
    try {
        const { page = 1, limit = 10, sortBy = 'category_name', sortOrder = 'ASC' } = req.query;
        const { page: p, limit: l } = validatePagination(page, limit);
        const { orderByField, orderDirection } = validateSorting(sortBy, sortOrder);

        const { categories, pagination } = await CategoryDB.getAllCategoriesDB(p, l, orderByField, orderDirection);

        if (!categories || categories.length === 0) {
            throw new NotFoundError('No categories found');
        }

        res.status(StatusCodes.OK).json({
            success: true,
            categories,
            pagination,
            metadata: {
                message: 'Categories retrieved successfully',
                retrievedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'fetch all categories');
    }
};

const getThreadsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { page = 1, limit = 10, sortBy = 'thread_name', sortOrder = 'ASC' } = req.query;
        const { page: p, limit: l } = validatePagination(page, limit);
        const { orderByField, orderDirection } = validateSortingThread(sortBy, sortOrder);
        let author_id = null;

        if (req.cookies.auth_token) {
            try {
                const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
                author_id = decoded.user_id;
            } catch (jwtError) {
                throw new UnauthorizedError('Invalid or expired token', { token: req.cookies.auth_token });
            }
        }

        const { category, threads, pagination } = await CategoryDB.getThreadsByCategoryDB(
            categoryId,
            p,
            l,
            orderByField,
            orderDirection,
            author_id
        );

        if (!category) {
            throw new NotFoundError('Category not found', { categoryId });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            category,
            threads,
            pagination,
            metadata: {
                categoryId,
                retrievedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'fetch threads by category');
    }
};

const getSummaryCategories = async (req, res) => {
    try {
        let { limit } = req.query;
        if (limit !== undefined && (isNaN(limit) || parseInt(limit) < 1)) {
            throw new ValidationError('Invalid limit parameter', { limit });
        }
        limit = limit ? parseInt(limit) : null;

        const categories = await CategoryDB.getSummaryCategoriesDB(limit);

        if (!categories || categories.length === 0) {
            throw new NotFoundError('No categories found');
        }

        res.status(StatusCodes.OK).json({
            success: true,
            count: categories.length,
            categories,
            message: 'Category summaries retrieved successfully',
            metadata: {
                source: 'database',
                generatedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'fetch category summaries');
    }
};

const getCategoryByName = async (req, res) => {
    try {
        const { categoryName } = req.params;

        const category = await CategoryDB.getCategoryByNameDB(categoryName);

        if (!category) {
            throw new NotFoundError('Category not found', { categoryName });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            category,
            metadata: {
                retrievedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'fetch category by name');
    }
};

const getCategoryById = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const category = await CategoryDB.getCategoryByIdDB(categoryId);

        if (!category) {
            throw new NotFoundError('Category not found', { categoryId });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            category,
            metadata: {
                retrievedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'fetch category by ID');
    }
};

const getThreadsSummaryByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        let { limit } = req.query;

        if (limit !== undefined && (isNaN(limit) || parseInt(limit) < 1)) {
            throw new ValidationError('Invalid limit parameter', { limit });
        }
        limit = limit ? parseInt(limit) : null;

        const { category, threads, totalCount } = await CategoryDB.getThreadsSummaryByCategoryDB(categoryId, limit);

        if (!category) {
            throw new NotFoundError('Category not found', { categoryId });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            category,
            threads,
            pagination: {
                totalItems: totalCount,
            },
            metadata: {
                categoryId,
                retrievedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'fetch thread summaries by category');
    }
};

const getPostsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { page = 1, limit = 10, sortBy = 'newest' } = req.query;

        const { page: p, limit: l } = validatePagination(page, limit);
        const sort = validateSortingPost(sortBy);

        const { category, posts, totalCount } = await CategoryDB.getPostsByCategoryDB(categoryId, p, l, sort);

        if (!category) {
            throw new NotFoundError('Category not found', { categoryId });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            category,
            posts,
            pagination: {
                currentPage: p,
                totalPages: Math.ceil(totalCount / l),
                totalItems: totalCount,
                itemsPerPage: "Today's date and time is 02:33 PM +07 on Wednesday, May 14, 2025. * l",
            },
            sort: {
                by: sort,
                description: getSortDescription(sortBy),
            },
            metadata: {
                categoryId,
                retrievedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'fetch posts by category');
    }
};

const getCategoriesByUser = async (req, res) => {
    try {
        const { username } = req.params;
        const includeStats = req.query.includeStats === 'true';

        const categories = await CategoryDB.getCategoriesByUserDB(username, includeStats);

        if (!categories || categories.length === 0) {
            throw new NotFoundError('No categories found for this user', { username });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            categories,
            metadata: {
                username,
                count: categories.length,
                retrievedAt: new Date().toISOString(),
                includeStats,
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'fetch categories by user');
    }
};

const createCategory = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            throw new UnauthorizedError('No authentication token provided');
        }

        const { category_name, description } = req.body;

        if (!category_name) {
            throw new ValidationError('Category name is required');
        }

        const { categoryId } = await CategoryDB.createCategoryDB(userId, category_name, description);

        if (!categoryId) {
            throw new AppError('Failed to create category', StatusCodes.INTERNAL_SERVER_ERROR, 'CREATE_FAILED');
        }

        res.status(StatusCodes.CREATED).json({
            success: true,
            message: 'Category created successfully',
            data: { categoryId },
            metadata: {
                createdAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'create category');
    }
};

const updateCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { category_name, description } = req.body;

        if (!category_name && !description) {
            throw new ValidationError('No fields to update provided');
        }

        const result = await CategoryDB.updateCategoryDB(categoryId, category_name, description);

        if (!result) {
            throw new NotFoundError('Category not found', { categoryId });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            message: result,
            metadata: {
                updatedAt: new Date().toISOString(),
                updatedFields: Object.keys({ category_name, description }).filter((key) => req.body[key] !== undefined),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'update category');
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const result = await CategoryDB.deleteCategoryDB(categoryId);

        if (!result) {
            throw new NotFoundError('Category not found', { categoryId });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            message: result,
            metadata: {
                deletedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'delete category');
    }
};

// Global Error Handler
app.use((err, req, res, next) => {
    errorHandler(err, req, res, 'unknown operation');
});

export default {
    getAllCategories,
    getSummaryCategories,
    getCategoryByName,
    getCategoryById,
    getThreadsByCategory,
    getThreadsSummaryByCategory,
    getPostsByCategory,
    getCategoriesByUser,
    createCategory,
    updateCategory,
    deleteCategory,
};