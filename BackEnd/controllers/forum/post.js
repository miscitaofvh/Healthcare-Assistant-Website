import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import {
    getAllPostsDB,
    getSummaryPostsDB,
    getPostByIdDB,
    getPostsByUserDB,
    createPostDB,
    updatePostDB,
    deletePostDB,
} from "../../models/Forum/post.js";

dotenv.config();

export const getAllPosts = async (req, res) => {
    try {
        const posts = await getAllPostsDB();
        res.status(200).json({
            success: true,
            data: posts
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error fetching posts",
            error: error.message
        });
    }
};

export const getSummaryPosts = async (req, res) => {
    try {
        const posts = await getSummaryPostsDB();
        res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching posts" });
    }
};

export const getPostById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Post ID is required"
            });
        }

        const post = await getPostByIdDB(id);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        res.status(200).json({
            success: true,
            data: post
        });
    } catch (error) {
        console.error(error);
        if (error.message === "Invalid post ID") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: "Error fetching post",
            error: error.message
        });
    }
};

export const getPostsByUser = async (req, res) => {
    try {
        const { username } = req.params;
        if (!username) {
            return res.status(400).json({
                success: false,
                message: "Username is required"
            });
        }
        const posts = await getPostsByUserDB(username);
        res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching posts by user" });
    }
};

export const createPost = async (req, res) => {
    try {
        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const author_id = decoded.user_id;

        if (!author_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { category_name, thread_name, content, tag_name, image_url } = req.body;

        // Input validation
        if (!category_name || !thread_name || !content) {
            return res.status(400).json({
                success: false,
                message: "Category name, thread name, and content are required"
            });
        }

        if (content.length > 10000) {
            return res.status(400).json({
                success: false,
                message: "Content must be less than 10000 characters"
            });
        }

        const result = await createPostDB(
            author_id,
            category_name,
            thread_name,
            content,
            tag_name,
            image_url
        );

        res.status(201).json({
            success: true,
            message: "Post created successfully",
            data: { postId: result.post_id }
        });
    } catch (error) {
        console.error(error);
        if (error.message === "Category not found") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        if (error.message === "Thread name already exists") {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: "Error creating post",
            error: error.message
        });
    }
};

export const updatePost = async (req, res) => {
    try {
        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const author_id = decoded.user_id;

        if (!author_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { id } = req.params;
        const { content, image_url } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Post ID is required"
            });
        }

        if (!content) {
            return res.status(400).json({
                success: false,
                message: "Content is required"
            });
        }

        if (content.length > 10000) {
            return res.status(400).json({
                success: false,
                message: "Content must be less than 10000 characters"
            });
        }

        const result = await updatePostDB(id, content, image_url);
        res.status(200).json({
            success: true,
            message: result
        });
    } catch (error) {
        console.error(error);
        if (error.message === "Post not found or unauthorized") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: "Error updating post",
            error: error.message
        });
    }
};

export const deletePost = async (req, res) => {
    try {
        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const author_id = decoded.user_id;

        if (!author_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Post ID is required"
            });
        }

        const result = await deletePostDB(id);
        res.status(200).json({
            success: true,
            message: result
        });
    } catch (error) {
        console.error(error);
        if (error.message === "Post not found or unauthorized") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: "Error deleting post",
            error: error.message
        });
    }
};
