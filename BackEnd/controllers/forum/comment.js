import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import {
    getCommentsByPostIdDB,
    getAllCommentsByUserDB,
    createCommentDB,
    updateCommentInPostDB,
    deleteCommentDB,
    likeCommentDB, 
    unlikeCommentDB,
    reportCommentDB,
    getReportsForCommentDB,
    updateReportStatusForCommentDB
} from "../../models/Forum/comment.js";

dotenv.config();

export const getCommentsByPostId = async (req, res) => {
    try {
        const { id } = req.params; // post_id
        const comments = await getCommentsByPostIdDB(id);
        res.status(200).json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching comments" });
    }
}

export const getAllCommentsByUser = async (req, res) => {
    try {
        const { user_id } = req.params; // user_id
        const comments = await getAllCommentsByUserDB(user_id);
        res.status(200).json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching comments by user" });
    }
}

export const addCommentToPost = async (req, res) => {
    try {
        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const author_id = decoded.user_id;

        if (!author_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { id } = req.params; // post_id
        const { content } = req.body;
        const result = await createCommentDB(author_id, id, content);
        res.status(201).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error adding comment to post" });
    }
}

export const updateCommentInPost = async (req, res) => {
    try {
        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const author_id = decoded.user_id;

        if (!author_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }
        
        const { id, commentId } = req.params; // id = post_id, commentId = comment_id
        const { content } = req.body;
        const result = await updateCommentInPostDB(author_id, commentId, id, content);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating comment in post" });
    }
}

export const deleteCommentFromPost = async (req, res) => {
    try {
        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const author_id = decoded.user_id;

        if (!author_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { id, commentId } = req.params; // id = post_id, commentId = comment_id
        const result = await deleteCommentDB(author_id, commentId, id);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting comment from post" });
    }
}

export const likeComment = async (req, res) => {
    try {
        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const user_id = decoded.user_id;

        if (!user_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { postId, commentId } = req.params; // postId = post_id, commentId = comment_id
        const result = await likeCommentDB(user_id, commentId, postId);

        res.status(200).json({
            success: true,
            message: result
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error liking the comment"
        });
    }
};

export const unlikeComment = async (req, res) => {
    try {
        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const user_id = decoded.user_id;

        if (!user_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { postId, commentId } = req.params; // postId = post_id, commentId = comment_id
        const result = await unlikeCommentDB(user_id, commentId, postId);

        res.status(200).json({
            success: true,
            message: result
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error unliking the comment"
        });
    }
};

export const reportComment = async (req, res) => {
    try {
        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const user_id = decoded.user_id;

        if (!user_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { postId, commentId } = req.params; // postId = post_id, commentId = comment_id
        const { reason } = req.body; // Reason for reporting

        const result = await reportCommentDB(user_id, commentId, postId, reason);

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
        const { commentId } = req.params; // commentId = comment_id
        const reports = await getReportsForCommentDB(commentId);

        if (!reports) {
            return res.status(404).json({
                success: false,
                message: "No reports found for this comment"
            });
        }

        res.status(200).json({
            success: true,
            reports
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error fetching reports for comment"
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