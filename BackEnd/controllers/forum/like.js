import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import LikeDB from "../../models/Forum/like.js";
import like from "../../models/Forum/like.js";

dotenv.config();

const likePost = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { postId } = req.params;

        const result = await LikeDB.likePostDB(userId, postId);
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

const unlikePost = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { postId } = req.params;

        const result = await LikeDB.unlikePostDB(userId, postId);
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

const likeComment = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { commentId } = req.params;

        const result = await LikeDB.likeCommentDB(userId, commentId);
        
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

const unlikeComment = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { commentId } = req.params;
        const { postId } = req.body;

        const result = await LikeDB.unlikeCommentDB(user_id, commentId, postId);

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

export default {
    likePost,
    unlikePost,
    likeComment,
    unlikeComment
}