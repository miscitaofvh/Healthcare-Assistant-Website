import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import {
    getCommentsByPostIdDB,
    getCommentRepliesDB,
    getAllCommentsByUserDB,
    addCommentToPostDB,
    addReplyToCommentDB,
    updateCommentDB,
    deleteCommentDB,
    reportCommentDB,
    getReportsForCommentDB,
    updateReportStatusForCommentDB
} from "../../models/Forum/comment.js";

dotenv.config();
/**
 * Handles comment-related errors consistently across all routes
 * @param {Error} error - The error object
 * @param {Response} res - Express response object
 * @param {string} action - The action being performed (e.g., 'create', 'update', 'delete')
 */
export const handleCommentError = (error, res, action = 'process') => {
    console.error(`Error while trying to ${action} comment:`, error);

    // JWT Authentication Errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: "Authentication failed",
            error: "Invalid or expired token"
        });
    }

    // Input Validation Errors
    if (error.message.includes("required") || 
        error.message.includes("Invalid") || 
        error.message.includes("must be")) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    // Not Found Errors
    if (error.message.includes("not found")) {
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }

    // Authorization Errors
    if (error.message.includes("Unauthorized") || 
        error.message.includes("own comments") ||
        error.message.includes("permission")) {
        return res.status(403).json({
            success: false,
            message: error.message
        });
    }

    // Database Constraint Errors
    if (error.code === 'ER_NO_REFERENCED_ROW' || 
        error.code === 'ER_DUP_ENTRY' ||
        error.code === 'ER_DATA_TOO_LONG') {
        return res.status(409).json({
            success: false,
            message: "Database constraint error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }

    // Default Server Error
    res.status(500).json({
        success: false,
        message: `Failed to ${action} comment`,
        error: process.env.NODE_ENV === 'development' ? {
            name: error.name,
            message: error.message,
            stack: error.stack
        } : undefined
    });
};

export const getCommentsByPostId = async (req, res) => {
    try {
        const { postId } = req.params;
        const { page = 1, limit = 20 } = req.pagination;

        if (!postId || typeof postId !== 'string' || postId.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Post ID is required and must be a non-empty string"
            });
        }

        const { comments, totalCount } = await getCommentsByPostIdDB(
            postId.trim(), 
            parseInt(page), 
            parseInt(limit)
        );

        res.status(200).json({
            success: true,
            data: comments,
            pagination: {
                currentPage: page,
                itemsPerPage: limit,
                totalItems: totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        });

    } catch (error) {
        console.error("Error in getCommentsByPostId:", error);
        handleCommentError(error, res);
    }
};

export const getCommentReplies = async (req, res) => {
    try {
        const { commentId } = req.params;

        const replies = await getCommentRepliesDB(commentId.trim());
        
        res.status(200).json({
            success: true,
            data: replies
        });
    } catch (error) {
        console.error("Error in getCommentReplies:", error);
        handleCommentError(error, res);
    }
};

export const getAllCommentsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.pagination;

        const { comments, totalCount } = await getAllCommentsByUserDB(
            userId.trim(),
            parseInt(page),
            parseInt(limit)
        );

        res.status(200).json({
            success: true,
            data: comments,
            pagination: {
                currentPage: page,
                itemsPerPage: limit,
                totalItems: totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        console.error("Error in getAllCommentsByUser:", error);
        handleCommentError(error, res);
    }
};

export const addCommentToPost = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const { postId } = req.params;
        const { content, parent_comment_id = null } = req.body;

        const result = await addCommentToPostDB({
            userId: userId,
            postId,
            content,
            parent_comment_id
        });

        res.status(201).json({
            success: true,
            message: "Comment created successfully",
            data: {
                commentId: result.commentId,
                parentCommentId: result.parent_comment_id
            }
        });

    } catch (error) {
        console.error("Error in addCommentToPost:", error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token"
            });
        }

        if (error.message.includes("not found")) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error while creating comment",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const addReplyToComment = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { commentId } = req.params;
        const { content } = req.body;

        const result = await addReplyToCommentDB({
            userId: userId,
            parentCommentId: commentId,
            content
        });

        res.status(201).json({
            success: true,
            message: "Reply added successfully",
            data: {
                commentId: result.commentId,
                parentCommentId: result.parentCommentId,
                depth: result.depth
            }
        });

    } catch (error) {
        console.error("Error in addReplyToComment:", error);
        
        if (error.message.includes("not found")) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error while adding reply",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const updateComment = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { commentId } = req.params;
        const { content } = req.body;

        const result = await updateCommentDB({
            commentId,
            userId,
            content
        });

        res.status(200).json({
            success: true,
            message: "Comment updated successfully",
            data: result
        });

    } catch (error) {
        console.error("Error in updateComment:", error);
        
        if (error.message.includes("not found") || error.message.includes("Unauthorized")) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error while updating comment",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { commentId } = req.params;

        const result = await deleteCommentDB({
            commentId,
            userId,
            isAdmin: decoded.role === 'admin'
        });

        res.status(200).json({
            success: true,
            message: "Comment deleted successfully"
        });

    } catch (error) {
        console.error("Error in deleteComment:", error);
        
        if (error.message.includes("not found") || error.message.includes("Unauthorized")) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error while deleting comment",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const reportComment = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { commentId } = req.params;
        const { reason } = req.body;

        const result = await reportCommentDB(userId, commentId, reason);

        res.status(200).json({
            success: true,
            message: result
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error reporting the comment"
        });
    }
};

export const getReportsForComment = async (req, res) => {
    try {
        const { commentId } = req.params;

        if (!commentId || typeof commentId !== 'string' || commentId.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Comment ID is required and must be a non-empty string"
            });
        }

        if (!/^\d+$/.test(commentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Comment ID format"
            });
        }

        const reports = await getReportsForCommentDB(commentId.trim());

        res.status(200).json({
            success: true,
            data: reports,
            count: reports.length
        });

    } catch (error) {
        console.error("Error in getReportsForComment:", error);
        
        if (error.message.includes("not found")) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error while fetching reports",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const updateReportStatusForComment = async (req, res) => {
    try {
        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const admin_id = decoded.user_id;

        if (!admin_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { commentId, reportId } = req.params; // commentId = comment_id, reportId = report_id
        const { status } = req.body; // status (e.g., "resolved", "pending", "dismissed")

        const result = await updateReportStatusForCommentDB(admin_id, reportId, status, commentId);

        res.status(200).json({
            success: true,
            message: result
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error updating report status for comment"
        });
    }
};