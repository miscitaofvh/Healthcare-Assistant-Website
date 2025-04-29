import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import {
    getAllTagsDB,
    getSummaryTagsDB,
    getSummaryTagByIdDB,
    getTagByIdDB,
    getTagByNameDB,
    getPostsByTagDB,
    getPopularTagsDB,
    getTagsForPostDB,
    getTagsByUserDB,
    createTagDB,
    updateTagDB,
    deleteTagDB,
    getAllTagsByPostDB,
    getTagsOfPostDB,
    getTagOfPostByIdDB,
    addTagsToPostDB,
    removeTagFromPostDB
} from "../../models/Forum/tag.js";

dotenv.config();

export const getAllTags = async (req, res) => {
    try {
        const tags = await getAllTagsDB();
        res.status(200).json({
            success: true,
            data: tags
        });
    } catch (error) {
        console.error("Error getting all tags:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching tags",
            error: error.message
        });
    }
};

export const getSummaryTags = async (req, res) => {
    try {
        const tags = await getSummaryTagsDB();
        res.status(200).json({
            success: true,
            data: tags
        });
    } catch (error) {
        console.error("Error getting all tags:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching tags",
            error: error.message
        });
    }
};

export const getSummaryTagById = async (req, res) => {
    try {

        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Tag ID is required"
            });
        }

        const tags = await getSummaryTagByIdDB(id);
        res.status(200).json({
            success: true,
            data: tags
        });
    } catch (error) {
        console.error("Error getting all tags:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching tags",
            error: error.message
        });
    }
};
export const getTagById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Tag ID is required"
            });
        }

        const tag = await getTagByIdDB(id);
        if (!tag) {
            return res.status(404).json({
                success: false,
                message: "Tag not found"
            });
        }

        res.status(200).json({
            success: true,
            data: tag
        });
    } catch (error) {
        console.error("Error getting tag by ID:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching tag",
            error: error.message
        });
    }
};

export const getTagByName = async (req, res) => {
    try {
        const { name } = req.query;
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Tag name is required"
            });
        }

        const tag = await getTagByNameDB(name);
        if (!tag) {
            return res.status(404).json({
                success: false,
                message: "Tag not found"
            });
        }

        res.status(200).json({
            success: true,
            data: tag
        });
    } catch (error) {
        console.error("Error getting tag by name:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching tag",
            error: error.message
        });
    }
};

export const getPostsByTag = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Tag ID is required"
            });
        }

        const posts = await getPostsByTagDB(id);
        res.status(200).json({
            success: true,
            data: posts
        });
    } catch (error) {
        console.error("Error getting posts by tag:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching posts",
            error: error.message
        });
    }
};

export const getPopularTags = async (req, res) => {
    try {
        const { limit } = req.query;
        const tags = await getPopularTagsDB(limit ? parseInt(limit) : undefined);
        res.status(200).json({
            success: true,
            data: tags
        });
    } catch (error) {
        console.error("Error getting popular tags:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching popular tags",
            error: error.message
        });
    }
};

export const getTagsForPost = async (req, res) => {
    try {
        const { postId } = req.params;
        if (!postId) {
            return res.status(400).json({
                success: false,
                message: "Post ID is required"
            });
        }

        const tags = await getTagsForPostDB(postId);
        res.status(200).json({
            success: true,
            data: tags
        });
    } catch (error) {
        console.error("Error getting tags for post:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching tags for post",
            error: error.message
        });
    }
};

export const getTagsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        const tags = await getTagsByUserDB(userId);
        res.status(200).json({
            success: true,
            data: tags
        });
    } catch (error) {
        console.error("Error getting tags by user:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching user's tags",
            error: error.message
        });
    }
};

export const createTag = async (req, res) => {
    try {
        const { tag_name, description } = req.body;
        const author_id = req.user.user_id;

        if (!author_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User ID not found"
            });
        }

        if (!tag_name) {
            return res.status(400).json({
                success: false,
                message: "Tag name is required"
            });
        }

        const result = await createTagDB(tag_name, description, author_id);
        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Error creating tag:", error);
        res.status(500).json({
            success: false,
            message: "Error creating tag",
            error: error.message
        });
    }
};

export const updateTagById = async (req, res) => {
    try {
        const { id } = req.params;
        const { tag_name, description } = req.body;
        const author_id = req.user.user_id;

        if (!author_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User ID not found"
            });
        }

        if (!id || !tag_name) {
            return res.status(400).json({
                success: false,
                message: "Tag ID and name are required"
            });
        }

        const result = await updateTagDB(id, tag_name, description, author_id);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Error updating tag:", error);
        if (error.message.includes("Unauthorized")) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: "Error updating tag",
            error: error.message
        });
    }
};

export const deleteTagById = async (req, res) => {
    try {
        const { id } = req.params;
        const author_id = req.user.user_id;

        if (!author_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User ID not found"
            });
        }

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Tag ID is required"
            });
        }

        const result = await deleteTagDB(id, author_id);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Error deleting tag:", error);
        if (error.message.includes("Unauthorized")) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: "Error deleting tag",
            error: error.message
        });
    }
};

export const getAllTagsByPost = async (req, res) => {
    try {
        const { post_id } = req.params; // post_id
        const tags = await getAllTagsByPostDB(post_id);
        res.status(200).json(tags);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching tags by post" });
    }
}

export const getTagsOfPost = async (req, res) => {
    try {
        const { id } = req.params; // post_id
        const tags = await getTagsOfPostDB(id);
        res.status(200).json(tags);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching tags" });
    }
}

export const getTagOfPostById  = async (req, res) => {
    try {
        const { id } = req.params; 
        const tag = await getTagOfPostByIdDB(id);
        res.status(200).json(tag);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching tags" });
    }
}

export const addTagsToPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { ids } = req.body;
        const author_id = req.user.user_id;

        if (!author_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User ID not found"
            });
        }

        if (!postId || !ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Post ID and tag IDs are required"
            });
        }

        const result = await addTagsToPostDB(postId, ids, author_id);
        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Error adding tags to post:", error);
        if (error.message.includes("Unauthorized")) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: "Error adding tags to post",
            error: error.message
        });
    }
};

export const removeTagFromPost = async (req, res) => {
    try {
        const { postId, id } = req.params;
        const author_id = req.user.user_id;

        if (!author_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User ID not found"
            });
        }

        if (!postId || !id) {
            return res.status(400).json({
                success: false,
                message: "Post ID and tag ID are required"
            });
        }

        const result = await removeTagFromPostDB(postId, id, author_id);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Error removing tag from post:", error);
        if (error.message.includes("Unauthorized")) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: "Error removing tag from post",
            error: error.message
        });
    }
};