import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import {
    getAllThreadsDB,
    getSummaryThreadsDB,
    getThreadByIdDB,
    getThreadNameDB,
    getPostsByThreadDB,
    getAllThreadsByUserDB,
    createThreadDB,
    updateThreadDB,
    deleteThreadDB
} from "../../models/Forum/thread.js";

dotenv.config();

export const getAllThreads = async (req, res) => {
    try {
        const threads = await getAllThreadsDB();

        if (!threads || threads.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                message: "No threads found",
                timestamp: new Date().toISOString()
            });
        }

        res.status(200).json({
            success: true,
            count: threads.length,
            threads: threads,
            message: "Threads retrieved successfully",
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error in getAllThreads:", error);

        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message
            : "Failed to retrieve threads";

        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
};

export const getSummaryThreads = async (req, res) => {
    try {
        const threads = await getSummaryThreadsDB();

        if (!threads || threads.length === 0) {
            return res.status(200).json({
                success: true,
                threads: [],
                message: "No summary threads found",
                timestamp: new Date().toISOString()
            });
        }

        res.status(200).json({
            success: true,
            count: threads.length,
            threads: threads,
            message: "Summary threads retrieved successfully",
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error in getSummaryThreads:", error);

        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message
            : "Failed to retrieve summary threads";

        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
};

export const getThreadById = async (req, res) => {
    try {
        const { id } = req.params;
        const thread = await getThreadByIdDB(id);

        if (!thread) {
            return res.status(404).json({
                success: false,
                message: "Thread not found",
                timestamp: new Date().toISOString()
            });
        }

        res.status(200).json({
            success: true,
            data: thread,
            message: "Thread retrieved successfully",
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error in getThreadById:", error);

        const statusCode = error.message === "Invalid thread ID" ? 400 : 500;
        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message
            : (statusCode === 400 ? error.message : "Failed to retrieve thread");

        res.status(statusCode).json({
            success: false,
            message: statusCode === 400 ? "Bad request" : "Internal server error",
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
};

export const getThreadName = async (req, res) => {
    try {
        const { name } = req.params;
        const threadId = await getThreadNameDB(name);

        if (!threadId) {
            return res.status(404).json({
                success: false,
                message: "Thread not found",
                timestamp: new Date().toISOString()
            });
        }

        res.status(200).json({
            success: true,
            data: { threadId },
            message: "Thread ID retrieved successfully",
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error in getThreadName:", error);

        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message
            : "Failed to retrieve thread ID";

        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
};

export const getPostsByThread = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid thread ID format",
                errorCode: "INVALID_THREAD_ID",
                metadata: {
                    threadId: id,
                    validatedAt: new Date().toISOString()
                }
            });
        }

        const { thread, posts } = await getPostsByThreadDB(id);

        res.status(200).json({
            success: true,
            thread: thread,
            posts: posts,
            count: posts?.length || 0,
            message: posts.length > 0 ? "Posts retrieved successfully" : "No posts found for this thread",
            metadata: {
                threadId: id,
                retrievedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error(`[${req.requestId}] Error in getPostsByThread:`, error);

        const statusCode = error.message === "Invalid post ID" ? 400 : 500;

        res.status(statusCode).json({
            success: false,
            message: statusCode === 400 ? error.message : "Failed to retrieve posts",
            error: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                stack: error.stack
            } : undefined,
            errorCode: statusCode === 400 ? "CLIENT_ERROR" : "SERVER_ERROR",
            timestamp: new Date().toISOString()
        });
    }
};

export const getThreadsByUser = async (req, res) => {
    try {
        const { user_id } = req.params;
        const threads = await getAllThreadsByUserDB(user_id);

        if (!threads || threads.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                message: "No threads found for this user",
                timestamp: new Date().toISOString()
            });
        }

        res.status(200).json({
            success: true,
            count: threads.length,
            data: threads,
            message: "Threads retrieved successfully",
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error in getThreadsByUser:", error);

        const statusCode = error.message === "Invalid user ID" ? 400 : 500;
        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message
            : (statusCode === 400 ? error.message : "Failed to retrieve threads");

        res.status(statusCode).json({
            success: false,
            message: statusCode === 400 ? "Bad request" : "Internal server error",
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
};

export const createThread = async (req, res) => {
    try {
        const token = req.cookies?.auth_token;
        if (!token) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "No authentication token provided"
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "Invalid or expired token"
            });
        }

        const author_id = decoded.user_id;
        if (!author_id) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "Invalid token payload"
            });
        }

        const { category_id, thread_name, description } = req.body;
        const threadId = await createThreadDB(author_id, category_id, thread_name, description);

        res.status(201).json({
            success: true,
            data: { threadId },
            message: "Thread created successfully",
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error in createThread:", error);

        let statusCode = 500;
        if (["Thread name already exists"].includes(error.message)) statusCode = 409;
        else if (["Category does not exist"].includes(error.message)) statusCode = 404;
        else if (["Thread name is required", "Invalid category ID"].includes(error.message)) statusCode = 400;

        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message
            : (statusCode === 500 ? "Failed to create thread" : error.message);

        res.status(statusCode).json({
            success: false,
            message: statusCode === 400 ? "Bad request"
                : statusCode === 401 ? "Unauthorized"
                    : statusCode === 404 ? "Not found"
                        : statusCode === 409 ? "Conflict"
                            : "Internal server error",
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
};

export const updateThread = async (req, res) => {
    try {
        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const author_id = decoded.user_id;

        if (!author_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
                timestamp: new Date().toISOString()
            });
        }

        const { id } = req.params;
        const { thread_name, description } = req.body;
        const result = await updateThreadDB(author_id, id, thread_name, description);

        res.status(200).json({
            success: true,
            message: result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error in updateThread:", error);

        let statusCode = 500;
        let message = "Internal server error";

        if (error.message === "Thread not found or unauthorized") {
            statusCode = 404;
            message = "Thread not found or unauthorized";
        } else if (error.message === "Thread name already exists") {
            statusCode = 409;
            message = "Thread name already exists";
        } else if (["Invalid thread ID", "No fields to update provided"].includes(error.message)) {
            statusCode = 400;
            message = "Bad request";
        }

        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message
            : message;

        res.status(statusCode).json({
            success: false,
            message: statusCode === 400 ? "Bad request"
                : statusCode === 401 ? "Unauthorized"
                    : statusCode === 404 ? "Not found"
                        : statusCode === 409 ? "Conflict"
                            : "Internal server error",
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
};

export const deleteThread = async (req, res) => {
    try {
        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const author_id = decoded.user_id;

        if (!author_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
                timestamp: new Date().toISOString()
            });
        }

        const { id } = req.params;
        const result = await deleteThreadDB(author_id, id);

        res.status(200).json({
            success: true,
            message: result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error in deleteThread:", error);

        let statusCode = 500;
        let message = "Internal server error";

        if (error.message === "Thread not found or unauthorized") {
            statusCode = 404;
            message = "Thread not found or unauthorized";
        } else if (error.message === "Cannot delete thread with existing posts") {
            statusCode = 409;
            message = "Cannot delete thread with existing posts";
        } else if (error.message === "Invalid thread ID") {
            statusCode = 400;
            message = "Bad request";
        }

        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message
            : message;

        res.status(statusCode).json({
            success: false,
            message,
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
};