import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import {
    getPostsDB,
    getPostByIdDB,
    createPostDB,
    updatePostDB,
    deletePostDB,
    getCommentsDB,
    createCommentDB,
    deleteCommentDB,
    getThreadByIdDB,
    createThreadDB,
    getThreadNameDB,
    getCategoryNameDB,
    createCategoryDB,
    likePostDB,
    unlikePostDB,
    reportPostDB
} from "../models/ForumPost.js";

dotenv.config();

// Get all posts
export const getPosts = async (req, res) => {
    try {
        const posts = await getPostsDB();
        res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching posts" });
    }
};

// Get post by ID
export const getPostById = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await getPostByIdDB(id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        res.status(200).json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching post" });
    }
};

// Create a new post
export const createPost = async (req, res) => {
    try {
        const { category_name, thread_name, content, tag_name, image_url } = req.body;
        
        if (!req.cookies.auth_token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        console.log(decoded);
        const user_id = decoded.user_id;
        const username = decoded.username;
        
        const forum_post = await createPostDB( user_id, username, category_name, thread_name, content, tag_name, image_url);
        const postId = forum_post.insertId; 
        res.status(201).json({ message: "Post created successfully", postId });
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ message: error.message || "Error creating post" });
    }
};


// Update a post
export const updatePost = async (req, res) => {
    try {

        const { id } = req.params;
        const { content, image_url } = req.body;

        if (!req.cookies.auth_token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const user_id = decoded.user_id;

        const post = await getPostByIdDB(id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (post.user_id !== user_id) {
            return res.status(403).json({ message: "Not authorized to update this post" });
        }

        const result = await updatePostDB(id, content, image_url);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating post" });
    }
};

// Delete a post
export const deletePost = async (req, res) => {
    try {

        const { id } = req.params;

        if (!req.cookies.auth_token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const user_id = decoded.user_id;

        // Verify post ownership
        const post = await getPostByIdDB(id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (post.user_id !== user_id) {
            return res.status(403).json({ message: "Not authorized to delete this post" });
        }

        const result = await deletePostDB(id);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting post" });
    }
};

// Get comments for a post
export const getComments = async (req, res) => {
    try {
        const { id } = req.params; // post_id
        const comments = await getCommentsDB(id);
        res.status(200).json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching comments" });
    }
};

// Create a comment for a post
export const createComment = async (req, res) => {
    try {
        const { id } = req.params; // post_id
        const { content, user_id } = req.body;
        const result = await createCommentDB(id, content, user_id);
        res.status(201).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating comment" });
    }
};

// Delete a comment
export const deleteComment = async (req, res) => {
    try {
        const { id, commentId } = req.params; // id = post_id, commentId = comment_id
        const result = await deleteCommentDB(commentId, id);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting comment" });
    }
};

// Like a post
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

// Unlike a post
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

// Report a post
export const reportPost = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!req.cookies.auth_token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!reason) {
            return res.status(400).json({ message: "Reason is required" });
        }

        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const user_id = decoded.user_id;

        const result = await reportPostDB(id, user_id, reason);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || "Error reporting post" });
    }
};