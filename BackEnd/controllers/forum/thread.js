import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";

import {
    getAllThreadsDB,
    getSummaryThreadsDB,
    getThreadByIdDB,
    getThreadByNameDB,
    getPostsByThreadDB,
    getAllThreadsByUserDB,
    createThreadDB,
    updateThreadDB,
    deleteThreadDB
} from "../../models/Forum/thread.js";

dotenv.config();

// Helper functions
const validatePagination = (page, limit, maxLimit = 100) => {
    if (page < 1 || limit < 1 || limit > maxLimit) {
        throw new Error(`Invalid pagination: Page must be ≥1 and limit between 1-${maxLimit}`);
    }
    return { page: parseInt(page), limit: parseInt(limit) };
};

const handleError = (error, req, res, action = 'process') => {
    console.error(`[${req.requestId || 'no-request-id'}] Error in ${action}:`, error);

    const errorMap = {
        // Authentication errors
        "No authentication token provided": StatusCodes.UNAUTHORIZED,
        "Invalid or expired token": StatusCodes.UNAUTHORIZED,
        "Invalid token payload": StatusCodes.UNAUTHORIZED,
        
        // Validation errors
        "Invalid thread ID": StatusCodes.BAD_REQUEST,
        "Invalid user ID": StatusCodes.BAD_REQUEST,
        "Invalid post ID": StatusCodes.BAD_REQUEST,
        "Invalid pagination": StatusCodes.BAD_REQUEST,
        "No fields to update provided": StatusCodes.BAD_REQUEST,
        "Thread name is required": StatusCodes.BAD_REQUEST,
        "Invalid category ID": StatusCodes.BAD_REQUEST,
        
        // Conflict errors
        "Thread name already exists": StatusCodes.CONFLICT,
        "Cannot delete thread with existing posts": StatusCodes.CONFLICT,
        
        // Not found errors
        "Thread not found": StatusCodes.NOT_FOUND,
        "Thread not found or unauthorized": StatusCodes.NOT_FOUND,
        "Category does not exist": StatusCodes.NOT_FOUND,
        "No threads found": StatusCodes.NOT_FOUND,
        "No summary threads found": StatusCodes.NOT_FOUND,
        "No posts found for this thread": StatusCodes.NOT_FOUND,
        "No threads found for this user": StatusCodes.NOT_FOUND
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

    if (error.message.includes("Invalid")) {
        response.errorCode = "VALIDATION_ERROR";
    }

    return res.status(statusCode).json(response);
};

const verifyAuthToken = (req) => {
    const token = req.cookies?.auth_token;
    if (!token) {
        throw new Error("No authentication token provided");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.user_id) {
        throw new Error("Invalid token payload");
    }

    return decoded.user_id;
};

// Controller methods
export const getAllThreads = async (req, res) => {
    try {
        const threads = await getAllThreadsDB();

        res.status(StatusCodes.OK).json({
            success: true,
            count: threads.length,
            threads: threads,
            message: threads.length ? "Threads retrieved successfully" : "No threads found",
            timestamp: new Date().toISOString(),
            cache: {
                recommended: true,
                duration: "1h"
            }
        });

    } catch (error) {
        handleError(error, req, res, 'fetch all threads');
    }
};

export const getSummaryThreads = async (req, res) => {
    try {
        const threads = await getSummaryThreadsDB();

        res.set('Cache-Control', 'public, max-age=3600'); // 1 hour cache

        res.status(StatusCodes.OK).json({
            success: true,
            count: threads.length,
            threads: threads,
            message: threads.length ? "Thread summaries retrieved successfully" : "No threads available",
            metadata: {
                source: "database",
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        handleError(error, req, res, 'fetch thread summaries');
    }
};

export const getThreadById = async (req, res) => {
    try {
        const { threadId } = req.params;

        const thread = await getThreadByIdDB(threadId);

        if (!thread) {
            throw new Error("Thread not found");
        }

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

export const getThreadByName = async (req, res) => {
    try {
        const { threadName } = req.params;
        const threadId = await getThreadByNameDB(threadName);

        if (!threadId) {
            throw new Error("Thread not found");
        }

        res.status(StatusCodes.OK).json({
            success: true,
            data: { threadId },
            message: "Thread ID retrieved successfully",
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        handleError(error, req, res, 'fetch thread by name');
    }
};

export const getPostsByThread = async (req, res) => {
    try {
        const { threadId } = req.params;
        const { page, limit } = validatePagination(req.query.page || 1, req.query.limit || 20);

        const { thread, posts, totalCount } = await getPostsByThreadDB(threadId, page, limit);

        res.status(StatusCodes.OK).json({
            success: true,
            thread: thread,
            posts: posts,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalItems: totalCount,
                itemsPerPage: limit
            },
            message: posts.length ? "Posts retrieved successfully" : "No posts found for this thread",
            metadata: {
                threadId,
                retrievedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        handleError(error, req, res, 'fetch posts by thread');
    }
};

export const getThreadsByUser = async (req, res) => {
    try {
        const { username } = req.params;
        const { page, limit } = validatePagination(req.query.page || 1, req.query.limit || 20);

        const { threads, totalCount } = await getAllThreadsByUserDB(username, page, limit);

        res.status(StatusCodes.OK).json({
            success: true,
            threads: threads,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalItems: totalCount,
                itemsPerPage: limit
            },
            message: threads.length ? "Threads retrieved successfully" : "No threads found for this user",
            metadata: {
                userId,
                retrievedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        handleError(error, req, res, 'fetch threads by user');
    }
};

export const createThread = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { category_id, thread_name, description } = req.body;

        const threadId = await createThreadDB(userId, category_id, thread_name, description);

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

export const updateThread = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { threadId } = req.params;
        const { thread_name, description } = req.body;

        const result = await updateThreadDB(userId, threadId, thread_name, description);

        res.status(StatusCodes.OK).json({
            success: true,
            message: result,
            metadata: {
                updatedAt: new Date().toISOString(),
                updatedFields: Object.keys({thread_name, description}).filter(key => req.body[key] !== undefined)
            }
        });

    } catch (error) {
        handleError(error, req, res, 'update thread');
    }
};

export const deleteThread = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { threadId } = req.params;

        const result = await deleteThreadDB(userId, threadId);

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