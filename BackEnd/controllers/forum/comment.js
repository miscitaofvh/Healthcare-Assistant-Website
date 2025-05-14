import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";

import CommentDB from "../../models/Forum/comment.js";

dotenv.config();

const handleError = (error, req, res, action = 'process') => {
    console.error(`[${req.requestId || 'no-request-id'}] Error in ${action}:`, error);

    const errorMap = {
        // Authentication errors
        "No authentication token provided": StatusCodes.UNAUTHORIZED,
        "Invalid or expired token": StatusCodes.UNAUTHORIZED,
        "Invalid token payload": StatusCodes.UNAUTHORIZED,
        "Authentication required": StatusCodes.UNAUTHORIZED,

        // Validation errors
        "Invalid Post ID": StatusCodes.BAD_REQUEST,
        "Invalid Comment ID": StatusCodes.BAD_REQUEST,
        "Invalid User ID": StatusCodes.BAD_REQUEST,
        "Invalid Parent comment ID": StatusCodes.BAD_REQUEST,
        "Content is required and must be a non-empty string": StatusCodes.BAD_REQUEST,
        "Content must be less than 2000 characters": StatusCodes.BAD_REQUEST,
        "Invalid pagination": StatusCodes.BAD_REQUEST,

        // Authorization errors
        "Forbidden: You don't have permission": StatusCodes.FORBIDDEN,
        "Cannot update this comment": StatusCodes.FORBIDDEN,
        "Cannot delete this comment": StatusCodes.FORBIDDEN,

        // Not found errors
        "Post not found": StatusCodes.NOT_FOUND,
        "Comment not found": StatusCodes.NOT_FOUND,
        "Parent comment not found": StatusCodes.NOT_FOUND,
        "No comments found for this post": StatusCodes.NOT_FOUND,
        "No replies found for this comment": StatusCodes.NOT_FOUND,
        "No comments found for this user": StatusCodes.NOT_FOUND
    };

    const statusCode = errorMap[error.message] || StatusCodes.INTERNAL_SERVER_ERROR;
    const response = {
        success: false,
        message: error.message || `Failed to ${action} comment`,
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

const validatePagination = (page, limit, maxLimit = 50) => {
    if (page < 1 || limit < 1 || limit > maxLimit) {
        throw new Error(`Invalid pagination: Page must be ≥1 and limit between 1-${maxLimit}`);
    }
    return { page: parseInt(page), limit: parseInt(limit) };
};

// Controller methods
const getCommentsByPostId = async (req, res) => {
    try {
        const { postId } = req.params;
        const validatedPostId = validateId(postId, "Post ID");
        const { page, limit } = validatePagination(req.query.page || 1, req.query.limit || 20);

        const { comments, totalCount } = await CommentDB.getCommentsByPostIdDB(validatedPostId, page, limit);

        res.status(StatusCodes.OK).json({
            success: true,
            data: comments,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalItems: totalCount,
                itemsPerPage: limit
            },
            metadata: {
                postId: validatedPostId,
                retrievedAt: new Date().toISOString(),
                cacheHint: {
                    recommended: true,
                    duration: "5m"
                }
            }
        });

    } catch (error) {
        handleError(error, req, res, 'fetch comments by post');
    }
};

const getAllCommentsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const validatedUserId = validateId(userId, "User ID");
        const { page, limit } = validatePagination(req.query.page || 1, req.query.limit || 20);

        const { comments, totalCount } = await CommentDB.getAllCommentsByUserDB(validatedUserId, page, limit);

        res.status(StatusCodes.OK).json({
            success: true,
            data: comments,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalItems: totalCount,
                itemsPerPage: limit
            },
            metadata: {
                userId: validatedUserId,
                retrievedAt: new Date().toISOString(),
                cacheHint: {
                    recommended: false,
                    reason: "User-specific data changes frequently"
                }
            }
        });

    } catch (error) {
        handleError(error, req, res, 'fetch comments by user');
    }
};

const addCommentToPost = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { postId } = req.params;
        const { content, parent_comment_id = null } = req.body;

        const commentId = await CommentDB.addCommentToPostDB(
            userId,
            postId,
            content,
            parent_comment_id
        );

        res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Comment created successfully",
            data: { commentId },
            metadata: {
                createdBy: userId,
                createdAt: new Date().toISOString(),
                isReply: parent_comment_id !== null
            }
        });

    } catch (error) {
        handleError(error, req, res, 'create comment');
    }
};

const updateComment = async (req, res) => {
    try {
        const { commentId } = req.params;

        const { content } = req.body;

        const result = await CommentDB.updateCommentDB(
            commentId,
            content
        );

        res.status(StatusCodes.OK).json({
            success: true,
            message: "Comment updated successfully",
            data: result,
            metadata: {
                updatedAt: new Date().toISOString(),
            }
        });

    } catch (error) {
        handleError(error, req, res, 'update comment');
    }
};

const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;

        await CommentDB.deleteCommentDB(
            commentId,
        );

        res.status(StatusCodes.OK).json({
            success: true,
            message: "Comment deleted successfully",
            metadata: {
                deletedAt: new Date().toISOString(),
            }
        });

    } catch (error) {
        handleError(error, req, res, 'delete comment');
    }
};

export default {
    getCommentsByPostId,
    getAllCommentsByUser,
    addCommentToPost,
    updateComment,
    deleteComment
}