import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import ThreadDB from "../../models/Forum/thread.js";

dotenv.config();

const handleError = (error, req, res, action = 'process') => {
    console.error(`[${req.requestId || 'no-request-id'}] Error in ${action}:`, error);

    const errorMap = {
        // Authentication errors
        "No authentication token provided": StatusCodes.UNAUTHORIZED,
        "Invalid or expired token": StatusCodes.UNAUTHORIZED,
        "Invalid token payload": StatusCodes.UNAUTHORIZED,

        // Validation errors
        "Invalid thread ID": StatusCodes.BAD_REQUEST,
        "Invalid category ID": StatusCodes.BAD_REQUEST,
        "Invalid pagination": StatusCodes.BAD_REQUEST,
        "Invalid sort parameter": StatusCodes.BAD_REQUEST,
        "Thread name is required": StatusCodes.BAD_REQUEST,
        "Description is required": StatusCodes.BAD_REQUEST,

        // Conflict errors
        "Thread name already exists": StatusCodes.CONFLICT,
        "Cannot delete thread with existing posts": StatusCodes.CONFLICT,

        // Not found errors
        "Thread not found": StatusCodes.NOT_FOUND,
        "Category not found": StatusCodes.NOT_FOUND,
        "No threads found": StatusCodes.NOT_FOUND,
        "No posts found for this thread": StatusCodes.NOT_FOUND
    };

    const statusCode = errorMap[error.message] || StatusCodes.INTERNAL_SERVER_ERROR;
    const response = {
        success: false,
        message: error.message || `Failed to ${action} thread`,
        timestamp: new Date().toISOString()
    };

    if (process.env.NODE_ENV === 'development') {
        response.debug = {
            message: error.message,
            stack: error.stack?.split("\n")[0]
        };
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
        thread_name: 'thread_name',
        created: 'created_at',
        updated: 'last_updated',
        posts: 'post_count',
        last_post_date: 'last_post_date'
    };

    const orderByField = allowedFields[sortBy] || allowedFields.thread_name;
    const orderDirection = sortOrder && sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    return { orderByField, orderDirection };
};

// Controller methods
const getAllThreads = async (req, res) => {
    try {
        const { page = 1, limit = 10, sortBy = 'thread_name', sortOrder = 'DESC' } = req.query;
        const { page: p, limit: l } = validatePagination(page, limit);
        const { orderByField, orderDirection } = validateSorting(sortBy, sortOrder);

        const { threads, pagination } = await ThreadDB.getAllThreadsDB(p, l, orderByField, orderDirection);

        res.status(StatusCodes.OK).json({
            success: true,
            threads: threads,
            pagination: pagination,
            metadata: {
                message: threads.length ? "Threads retrieved successfully." : "No threads found.",
                retrievedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch all threads');
    }
};

const getThreadsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { page = 1, limit = 10, sortBy = 'thread_name', sortOrder = 'DESC' } = req.query;
        const { page: p, limit: l } = validatePagination(page, limit);
        const { orderByField, orderDirection } = validateSorting(sortBy, sortOrder);

        const { threads, pagination } = await ThreadDB.getThreadsByCategoryDB(categoryId, p, l, orderByField, orderDirection);

        res.status(StatusCodes.OK).json({
            success: true,
            threads: threads,
            pagination: pagination,
            metadata: {
                categoryId,
                retrievedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch threads by category');
    }
};

const getThreadById = async (req, res) => {
    try {
        const { threadId } = req.params;
        const thread = await ThreadDB.getThreadByIdDB(threadId);

        res.status(StatusCodes.OK).json({
            success: true,
            thread: thread,
            metadata: {
                retrievedAt: new Date().toISOString(),
                cache: {
                    recommended: true,
                    duration: "1h"
                }
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch thread by ID');
    }
};

const getPostsByThread = async (req, res) => {
    try {
        const { threadId } = req.params;
        const { page = 1, limit = 20, sortBy = 'thread_name', sortOrder = 'DESC' } = req.query;
        const { page: p, limit: l } = validatePagination(page, limit);
        const { orderByField, orderDirection } = validateSorting(sortBy, sortOrder);

        let author_id = null;
        try {
            if ((req.cookies.auth_token)) {
                const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
                author_id = decoded.user_id;
            }
        } catch (error) {
        }
        const { thread, posts, pagination } = await ThreadDB.getPostsByThreadDB(threadId, p, l, orderByField, orderDirection, author_id);

        res.status(StatusCodes.OK).json({
            success: true,
            thread: thread,
            posts: posts,
            pagination: pagination,
            metadata: {
                threadId,
                retrievedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch posts by thread');
    }
};

const getThreadsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10, sortBy = 'thread_name', sortOrder = 'DESC' } = req.query;
        const { page: p, limit: l } = validatePagination(page, limit);
        const { orderByField, orderDirection } = validateSorting(sortBy, sortOrder);

        const { threads, pagination } = await ThreadDB.getThreadsByUserDB(userId, p, l, orderByField, orderDirection);

        res.status(StatusCodes.OK).json({
            success: true,
            threads: threads,
            pagination: pagination,
            metadata: {
                userId,
                retrievedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch threads by user');
    }
};

const createThread = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { category_id, thread_name, description } = req.body;

        const threadId = await ThreadDB.createThreadDB(userId, category_id, thread_name, description);

        res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Thread created successfully",
            data: { threadId },
            metadata: {
                createdBy: userId,
                createdAt: new Date().toISOString()
            }
        });
    } catch (error) {
        handleError(error, req, res, 'create thread');
    }
};

const updateThread = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { threadId } = req.params;
        const { thread_name	, description } = req.body;

        const result = await ThreadDB.updateThreadDB(userId, threadId, thread_name	, description);

        res.status(StatusCodes.OK).json({
            success: true,
            message: result,
            metadata: {
                updatedAt: new Date().toISOString(),
                updatedFields: Object.keys({ thread_name, description })
            }
        });
    } catch (error) {
        handleError(error, req, res, 'update thread');
    }
};

const deleteThread = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { threadId } = req.params;

        const result = await ThreadDB.deleteThreadDB(userId, threadId);

        res.status(StatusCodes.OK).json({
            success: true,
            message: result,
            metadata: {
                deletedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        handleError(error, req, res, 'delete thread');
    }
};

export default {
    getAllThreads,
    getThreadsByCategory,
    getThreadById,
    getPostsByThread,
    getThreadsByUser,
    createThread,
    updateThread,
    deleteThread
};