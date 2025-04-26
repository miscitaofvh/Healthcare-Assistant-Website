import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import {
    likePostDB,
    unlikePostDB
} from "../../models/Forum/like.js";

dotenv.config();

export const likePost = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.cookies.auth_token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const user_id = decoded.user_id;

        const result = await likePostDB(id, user_id);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || "Error liking post" });
    }
};

export const unlikePost = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.cookies.auth_token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const user_id = decoded.user_id;

        const result = await unlikePostDB(id, user_id);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || "Error unliking post" });
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