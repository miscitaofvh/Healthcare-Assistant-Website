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
    reportPostDB,
    getTagsDB,
    getTagByIdDB,
    getCategoriesDB,
    getThreadsDB,
    updateTagDB,
    getTagsofForumPostDB
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

// Get thread by ID
export const getThreadById = async (req, res) => {
    try {
        const { id } = req.params;
        const thread = await getThreadByIdDB(id);
        if (!thread) {
            return res.status(404).json({ message: "Thread not found" });
        }
        res.status(200).json(thread);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching thread" });
    }
};

// Create a new thread
export const createThread = async (req, res) => {
    try {
        const { thread_name } = req.body;
        const result = await createThreadDB(thread_name);
        res.status(201).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating thread" });
    }
};

// Get thread name by ID
export const getThreadName = async (req, res) => {
    try {
        const { id } = req.params;
        const thread_name = await getThreadNameDB(id);
        if (!thread_name) {
            return res.status(404).json({ message: "Thread name not found" });
        }
        res.status(200).json(thread_name);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching thread name" });
    }
};

// Get category name by ID
export const getCategoryName = async (req, res) => {
    try {
        const { id } = req.params;
        const category_name = await getCategoryNameDB(id);
        if (!category_name) {
            return res.status(404).json({ message: "Category name not found" });
        }
        res.status(200).json(category_name);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching category name" });
    }
};

// Create a new category
export const createCategory = async (req, res) => {
    try {
        const { category_name } = req.body;
        const result = await createCategoryDB(category_name);
        res.status(201).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating category" });
    }
};

// Get all categories
export const getCategories = async (req, res) => {
    try {
        const categories = await getCategoriesDB();
        res.status(200).json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching categories" });
    }
};

// Get all threads
export const getThreads = async (req, res) => {
    try {
        const threads = await getThreadsDB();
        res.status(200).json(threads);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching threads" });
    }
};

// Get all tags
export const getTags = async (req, res) => {
    try {
        const tags = await getTagsDB();
        res.status(200).json(tags);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching tags" });
    }
};

// Get tag by ID
export const getTagById = async (req, res) => {
    try {
        const { id } = req.params;
        const tag = await getTagByIdDB(id);
        if (!tag) {
            return res.status(404).json({ message: "Tag not found" });
        }
        res.status(200).json(tag);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching tag" });
    }
};

export const updateTag = async (req, res) => {
    try {
        const { id } = req.params;
        const { tag_name } = req.body;
        const result = await updateTagDB(id, tag_name);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating tag" });
    }
}

export const getTagsofForumPost = async (req, res) => {
    try {
        const { id } = req.params; // post_id
        const tags = await getTagsofForumPostDB(id);
        res.status(200).json(tags);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching tags" });
    }
}