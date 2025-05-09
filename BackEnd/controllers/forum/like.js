import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import {
    likePostDB,
    unlikePostDB,
    likeCommentDB,
    unlikeCommentDB
} from "../../models/Forum/like.js";

dotenv.config();

export const likePost = async (req, res) => {
    try {
        const { postId } = req.params;

        if (!req.cookies?.auth_token) {
            return res.status(401).json({
                success: false,
                message: "Authentication token required"
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        } catch (jwtError) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired authentication token"
            });
        }

        const user_id = decoded.user_id;

        if (!postId) {
            return res.status(400).json({
                success: false,
                message: "Post ID is required"
            });
        }

        const result = await likePostDB(postId, user_id);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Error liking post:", error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: "Error liking post"
        });
    }
};

export const unlikePost = async (req, res) => {
    try {
        const { postId } = req.params;

        if (!req.cookies?.auth_token) {
            return res.status(401).json({
                success: false,
                message: "Authentication token required"
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        } catch (jwtError) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired authentication token"
            });
        }

        const user_id = decoded.user_id;

        if (!postId) {
            return res.status(400).json({
                success: false,
                message: "Post ID is required"
            });
        }

        const result = await unlikePostDB(postId, user_id);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Error unliking post:", error);
        res.status(500).json({
            success: false,
            message: "Error unliking post",
            error: error.message
        });
    }
};

export const likeComment = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { commentId } = req.params;

        const result = await likeCommentDB(userId, commentId);
        
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Error in likeComment:", error);
        
        const statusCode = error.message.includes("not found") ? 404 : 
                          error.message.includes("already liked") ? 409 : 500;
        
        return res.status(statusCode).json({
            success: false,
            message: error.message || "Error processing like"
        });
    }
};

export const unlikeComment = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { commentId } = req.params;
        const { postId } = req.body;

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

export const getAllLikesByUser = async (req, res) => {
    try {
        const { user_id } = req.params; // user_id
        const likes = await getAllLikesByUserDB(user_id);
        res.status(200).json(likes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching likes by user" });
    }
}

export const getAllLikesByPost = async (req, res) => {
    try {
        const { post_id } = req.params; // post_id
        const likes = await getAllLikesByPostDB(post_id);
        res.status(200).json(likes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching likes by post" });
    }
}

export const getLikesOfPost = async (req, res) => {
    try {
        const { id } = req.params; // post_id
        const likes = await getLikesOfPostDB(id);
        res.status(200).json(likes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching likes" });
    }
}