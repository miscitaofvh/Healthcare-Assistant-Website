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
        "Invalid username format": StatusCodes.BAD_REQUEST,
        "Invalid pagination": StatusCodes.BAD_REQUEST,
        "Invalid sort parameter": StatusCodes.BAD_REQUEST,
        "Thread name is required": StatusCodes.BAD_REQUEST,
        "Invalid limit parameter": StatusCodes.BAD_REQUEST,
        "Invalid thread name": StatusCodes.BAD_REQUEST,

        // Conflict errors
        "Thread name already exists": StatusCodes.CONFLICT,
        "Cannot delete thread with existing posts": StatusCodes.CONFLICT,

        // Not found errors
        "Thread not found": StatusCodes.NOT_FOUND,
        "Category not found": StatusCodes.NOT_FOUND,
        "No threads found": StatusCodes.NOT_FOUND,
        "No threads found for this user": StatusCodes.NOT_FOUND,
        "No posts found for this thread": StatusCodes.NOT_FOUND,
        "User not found": StatusCodes.NOT_FOUND
    };

    const statusCode = errorMap[error.message] || StatusCodes.INTERNAL_SERVER_ERROR;
    const response = {
        success: false,
        errorCode: error.message.includes("Invalid") ? "VALIDATION_ERROR" : 
                   errorMap[error.message] ? error.message.toUpperCase().replace(/\s+/g, '_') : "INTERNAL_SERVER_ERROR",
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

const validatePagination = (page, limit, maxLimit = 100) => {
    if (page < 1 || limit < 1 || limit > maxLimit) {
        throw new Error(`Invalid pagination: Page must be ≥1 and limit between 1-${maxLimit}`);
    }
    return { page: parseInt(page), limit: parseInt(limit) };
};

const validateSorting = (sortBy, sortOrder) => {
    const allowedFields = {
        thread_name: 'ft.thread_name',
        created: 'ft.created_at',
        updated: 'ft.last_updated',
        posts: 'post_count',
        last_post_date: 'last_post_date'
    };
    const orderByField = allowedFields[sortBy] || allowedFields.thread_name;
    const orderDirection = sortOrder && sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    return { orderByField, orderDirection };
};

function getSortDescription(sort) {
    const descriptions = {
        newest: "Most recently created threads first",
        oldest: "Oldest threads first",
        most_posts: "Threads with most posts first",
        last_post_date: "Threads with most recent posts first"
    };
    return descriptions[sort] || "Default sorting";
}

const validateSortingPost = (sortBy) => {
    const allowedFields = {
        newest: 'p.created_at DESC',
        oldest: 'p.created_at ASC',
        most_comments: 'p.comment_count DESC',
        most_likes: 'p.like_count DESC'
    };
    return allowedFields[sortBy] || allowedFields.newest;
};

const getAllThreads = async (req, res) => {
    try {
        const { page = 1, limit = 10, sortBy = 'thread_name', sortOrder = 'ASC' } = req.query;
        const { page: p, limit: l } = validatePagination(page, limit);
        const { orderByField, orderDirection } = validateSorting(sortBy, sortOrder);

        const { threads, pagination } = await ThreadDB.getAllThreadsDB(p, l, orderByField, orderDirection);

        if (!threads) {
            throw new Error("No threads found");
        }

        res.status(StatusCodes.OK).json({
            success: true,
            threads,
            pagination,
            metadata: {
                message: threads.length ? "Threads retrieved successfully" : "No threads found",
                retrievedAt: new Date().toISOString(),
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch all threads');
    }
};

const getSummaryThreads = async (req, res) => {
    try {
        let { limit } = req.query;
        if (isNaN(limit)) {
            limit = null;
        } else if (limit < 1) {
            throw new Error("Invalid limit parameter");
        }

        const threads = await ThreadDB.getSummaryThreadsDB(limit);

        if (!threads) {
            throw new Error("No threads found");
        }

        res.status(StatusCodes.OK).json({
            success: true,
            count: threads.length,
            threads,
            metadata: {
                message: threads.length ? "Thread summaries retrieved successfully" : "No threads available",
                source: "database",
                generatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch thread summaries');
    }
};

const getThreadById = async (req, res) => {
    try {
        const { threadId } = req.params;

        const thread = await ThreadDB.getThreadByIdDB(threadId);

        if (!thread) {
            throw new Error("Thread not found");
        }

        res.status(StatusCodes.OK).json({
            success: true,
            thread,
            metadata: {
                retrievedAt: new Date().toISOString(),
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch thread by ID');
    }
};

const getPostsByThread = async (req, res) => {
    try {
        const { threadId } = req.params;
        const { page = 1, limit = 10, sortBy = 'newest' } = req.query;
        const { page: p, limit: l } = validatePagination(page, limit);
        const sort = validateSortingPost(sortBy);

        let author_id = null;
        try {
            if (req.cookies.auth_token) {
                const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
                author_id = decoded.user_id;
            }
        } catch (error) {
            // Silently continue if token is invalid
        }

        const { thread, posts, pagination } = await ThreadDB.getPostsByThreadDB(threadId, p, l, sort, author_id);

        if (!thread) {
            throw new Error("Thread not found");
        }

        res.status(StatusCodes.OK).json({
            success: true,
            thread,
            posts,
            pagination,
            sort: {
                by: sort,
                description: getSortDescription(sortBy)
            },
            metadata: {
                threadId,
                retrievedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch posts by thread');
    }
};

const getThreadByName = async (req, res) => {
    try {
        const { threadName } = req.params;

        const thread = await ThreadDB.getThreadByNameDB(threadName);

        if (!thread) {
            throw new Error("Thread not found");
        }

        res.status(StatusCodes.OK).json({
            success: true,
            thread,
            metadata: {
                retrievedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch thread by name');
    }
};

const getThreadsByUser = async (req, res) => {
    try {
        const { username } = req.params;
        const { page = 1, limit = 10, sortBy = 'thread_name', sortOrder = 'ASC' } = req.query;
        const { page: p, limit: l } = validatePagination(page, limit);
        const { orderByField, orderDirection } = validateSorting(sortBy, sortOrder);

        const { threads, pagination } = await ThreadDB.getThreadsByUserDB(username, p, l, orderByField, orderDirection);

        if (!threads) {
            throw new Error("No threads found for this user");
        }

        res.status(StatusCodes.OK).json({
            success: true,
            threads,
            pagination,
            metadata: {
                username,
                count: threads.length,
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

        const { threadId } = await ThreadDB.createThreadDB(userId, category_id, thread_name, description);

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
        const { threadId } = req.params;
        const { thread_name, description } = req.body;

        const result = await ThreadDB.updateThreadDB(threadId, thread_name, description);

        res.status(StatusCodes.OK).json({
            success: true,
            message: result,
            metadata: {
                updatedAt: new Date().toISOString(),
                updatedFields: Object.keys({ thread_name, description }).filter(key => req.body[key] !== undefined)
            }
        });
    } catch (error) {
        handleError(error, req, res, 'update thread');
    }
};

const deleteThread = async (req, res) => {
    try {
        const { threadId } = req.params;

        const result = await ThreadDB.deleteThreadDB(threadId);

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
    getSummaryThreads,
    getThreadById,
    getPostsByThread,
    getThreadByName,
    getThreadsByUser,
    createThread,
    updateThread,
    deleteThread
};