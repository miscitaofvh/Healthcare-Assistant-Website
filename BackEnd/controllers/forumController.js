import dotenv from "dotenv";

import { getPostsDB, getPostByIdDB, createPostDB, updatePostDB, deletePostDB, getCommentsDB, createCommentDB, deleteCommentDB } from "../models/ForumPost.js";

dotenv.config();

export const getPosts = async (req, res) => {
    try {
        const posts = await getPostsDB();
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: "Error fetching posts" });
    }
};

export const getPostById = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await getPostByIdDB(id);
        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ message: "Error fetching post" });
    }
};  

export const createPost = async (req, res) => {
    try {
        const { title, content, user_id } = req.body;
        const post = await createPostDB(title, content, user_id);
        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ message: "Error creating post" });
    }
};

export const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        const post = await updatePostDB(id, title, content);    
        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ message: "Error updating post" });
    }
};

export const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await deletePostDB(id);
        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ message: "Error deleting post" });
    }
};

export const getComments = async (req, res) => {
    try {   
        const { id } = req.params;
        const comments = await getCommentsDB(id);
        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ message: "Error fetching comments" });
    }
};

export const createComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, user_id } = req.body;
        const comment = await createCommentDB(id, content, user_id);
        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ message: "Error creating comment" });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const comment = await deleteCommentDB(id, commentId);
        res.status(200).json(comment);
    } catch (error) {
        res.status(500).json({ message: "Error deleting comment" });
    }
};




