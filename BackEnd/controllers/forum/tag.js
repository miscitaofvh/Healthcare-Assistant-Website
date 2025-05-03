import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import {
    getAllTagsDB,
    getSummaryTagsDB,
    getSummaryTagByIdDB,
    getSummaryLittleTagsDB,
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
        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const sortBy = req.query.sortBy || 'usage_count';
        const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';

        if (page < 1 || limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                message: "Invalid pagination parameters",
                details: {
                    validPage: "Must be ≥ 1",
                    validLimit: "Must be between 1 and 100"
                }
            });
        }

        const validSortColumns = ['tag_name', 'usage_count', 'last_used_at', 'created_at', 'post_count'];
        if (!validSortColumns.includes(sortBy)) {
            return res.status(400).json({
                success: false,
                message: "Invalid sort parameter",
                validSortColumns
            });
        }

        const { tags, totalTags } = await getAllTagsDB(page, limit, search, sortBy, sortOrder);

        const totalPages = Math.ceil(totalTags / limit);

        res.status(200).json({
            success: true,
            data: {
                tags,
                pagination: {
                    totalItems: totalTags,
                    totalPages,
                    currentPage: page,
                    itemsPerPage: limit,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1
                },
                filters: {
                    search,
                    sortBy,
                    sortOrder
                }
            }
        });
    } catch (error) {
        console.error("Error getting all tags:", error);

        const statusCode = error.statusCode || 500;
        const errorResponse = {
            success: false,
            message: "Error fetching tags",
            error: error.message
        };

        if (process.env.NODE_ENV === 'development') {
            errorResponse.stack = error.stack;
        }

        res.status(statusCode).json(errorResponse);
    }
};

export const getSummaryTags = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const sortBy = req.query.sortBy || 'tag_name';
        const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';

        if (page < 1 || limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                message: "Invalid pagination parameters",
                details: {
                    validPage: "Must be ≥ 1",
                    validLimit: "Must be between 1 and 100",
                    received: { page, limit }
                }
            });
        }

        const validSortColumns = ['tag_id', 'tag_name', 'description'];
        if (!validSortColumns.includes(sortBy)) {
            return res.status(400).json({
                success: false,
                message: "Invalid sort parameter",
                validSortColumns,
                received: sortBy
            });
        }

        const { tags, totalTags } = await getSummaryTagsDB(page, limit, search, sortBy, sortOrder);

        const totalPages = Math.ceil(totalTags / limit);

        res.status(200).json({
            success: true,
            data: {
                tags,
                pagination: {
                    totalItems: totalTags,
                    totalPages,
                    currentPage: page,
                    itemsPerPage: limit,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1
                },
                filters: {
                    search,
                    sortBy,
                    sortOrder
                }
            }
        });
    } catch (error) {
        console.error("Error getting summary tags:", error);

        const statusCode = error.statusCode || 500;
        const errorResponse = {
            success: false,
            message: error.message || "Error fetching summary tags",
            error: error.message
        };

        if (process.env.NODE_ENV === 'development') {
            errorResponse.stack = error.stack;
            if (error.originalError) {
                errorResponse.originalError = error.originalError.message;
            }
        }

        res.status(statusCode).json(errorResponse);
    }
};

export const getSummaryLittleTags = async (req, res) => {
    try {
        const { tags, totalTags } = await getSummaryLittleTagsDB();


        res.status(200).json({
            success: true,
            data: {
                tags,
                pagination: {
                    totalItems: totalTags
                }
            }
        });
    } catch (error) {
        console.error("Error getting summary tags:", error);

        const statusCode = error.statusCode || 500;
        const errorResponse = {
            success: false,
            message: error.message || "Error fetching summary tags",
            error: error.message
        };

        if (process.env.NODE_ENV === 'development') {
            errorResponse.stack = error.stack;
            if (error.originalError) {
                errorResponse.originalError = error.originalError.message;
            }
        }

        res.status(statusCode).json(errorResponse);
    }
};

export const getSummaryTagById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid tag ID is required",
                details: {
                    expected: "Positive integer",
                    received: id
                }
            });
        }

        const tag = await getSummaryTagByIdDB(Number(id));

        if (!tag) {
            return res.status(404).json({
                success: false,
                message: "Tag not found",
                tagId: id
            });
        }

        res.status(200).json({
            success: true,
            data: tag
        });

    } catch (error) {
        console.error(`Error getting tag with ID ${req.params.id}:`, error);

        const statusCode = error.statusCode ||
            (error.name === 'ValidationError' ? 400 : 500);

        const errorResponse = {
            success: false,
            message: error.message || "Error fetching tag",
            ...(process.env.NODE_ENV === 'development' && {
                stack: error.stack,
                ...(error.details && { details: error.details })
            })
        };

        res.status(statusCode).json(errorResponse);
    }
};

export const getTagById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Valid numeric tag ID is required",
                errorCode: "INVALID_TAG_ID"
            });
        }

        const tag = await getTagByIdDB(id);

        if (!tag) {
            return res.status(404).json({
                success: false,
                message: "Tag not found",
                errorCode: "TAG_NOT_FOUND"
            });
        }

        res.status(200).json({
            success: true,
            data: tag
        });
    } catch (error) {
        console.error(`Error getting tag by ID ${req.params.id}:`, error);

        const statusCode = error.statusCode || 500;
        const response = {
            success: false,
            message: error.clientMessage || "Error fetching tag",
            errorCode: error.errorCode || "TAG_FETCH_ERROR"
        };

        if (process.env.NODE_ENV === 'development') {
            response.error = error.message;
            response.stack = error.stack;
        }

        res.status(statusCode).json(response);
    }
};

export const getTagByName = async (req, res) => {
    try {
        const { name } = req.query;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Valid tag name is required",
                errorCode: "INVALID_TAG_NAME"
            });
        }

        const normalizedTagName = name.trim().toLowerCase();
        const tag = await getTagByNameDB(normalizedTagName);

        if (!tag) {
            return res.status(404).json({
                success: false,
                message: "Tag not found",
                errorCode: "TAG_NOT_FOUND"
            });
        }

        res.status(200).json({
            success: true,
            data: tag
        });
    } catch (error) {
        console.error(`Error getting tag by name "${req.query.name}":`, error);

        const statusCode = error.statusCode || 500;
        const response = {
            success: false,
            message: error.clientMessage || "Error fetching tag by name",
            errorCode: error.errorCode || "TAG_FETCH_ERROR"
        };

        if (process.env.NODE_ENV === 'development') {
            response.error = error.message;
            response.stack = error.stack;
        }

        res.status(statusCode).json(response);
    }
};

export const getPostsByTag = async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Tag ID is required",
                error: "Missing tag ID parameter"
            });
        }

        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Tag ID format",
                error: "Tag ID must be a number"
            });
        }

        const { posts, tag, totalPosts } = await getPostsByTagDB(id, page, limit);

        if (!tag) {
            return res.status(404).json({
                success: false,
                message: "Tag not found"
            });
        }

        const totalPages = Math.ceil(totalPosts / limit);

        return res.status(200).json({
            success: true,
            tag: tag,
            posts: posts,
            pagination: {
                totalPosts,
                totalPages,
                currentPage: page,
                postsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        });
    } catch (error) {
        console.error("Error getting posts by tag:", error);

        const statusCode = error.statusCode || 500;
        const errorMessage = error.message || "Error fetching posts";

        return res.status(statusCode).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const getPopularTags = async (req, res) => {
    try {
        const { limit = '10' } = req.query;
        const parsedLimit = parseInt(limit, 10);

        if (isNaN(parsedLimit)) {
            return res.status(400).json({
                success: false,
                message: "Limit must be a valid number",
                errorCode: "INVALID_LIMIT_PARAM"
            });
        }

        if (parsedLimit < 1 || parsedLimit > 100) {
            return res.status(400).json({
                success: false,
                message: "Limit must be between 1 and 100",
                errorCode: "LIMIT_OUT_OF_RANGE",
                validRange: { min: 1, max: 100 }
            });
        }

        const tags = await getPopularTagsDB(parsedLimit);

        res.status(200).json({
            success: true,
            data: tags,
            meta: {
                count: tags.length,
                limit: parsedLimit
            }
        });
    } catch (error) {
        console.error("Error in getPopularTags:", error);

        const statusCode = error.statusCode || 500;
        const response = {
            success: false,
            message: error.clientMessage || "Failed to retrieve popular tags",
            errorCode: error.errorCode || "TAG_RETRIEVAL_ERROR"
        };

        if (process.env.NODE_ENV === 'development') {
            response.error = error.message;
            response.stack = error.stack;
        }

        res.status(statusCode).json(response);
    }
};

export const getTagsForPost = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Valid numeric post ID is required",
                errorCode: "INVALID_POST_ID"
            });
        }

        const tags = await getTagsForPostDB(id);

        res.status(200).json({
            success: true,
            data: tags,
            meta: {
                count: tags.length,
                postId: id
            }
        });
    } catch (error) {
        console.error(`Error getting tags for post ${req.params.id}:`, error);

        const statusCode = error.statusCode || 500;
        const response = {
            success: false,
            message: error.clientMessage || "Failed to retrieve tags for post",
            errorCode: error.errorCode || "POST_TAGS_RETRIEVAL_ERROR"
        };

        if (process.env.NODE_ENV === 'development') {
            response.error = error.message;
            response.stack = error.stack;
        }

        res.status(statusCode).json(response);
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
        
        const author_id = decoded.user_id;

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

        if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid tag ID is required",
                details: {
                    expected: "Positive integer",
                    received: id
                }
            });
        }
        const { tag_name, description } = req.body;

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

        const author_id = decoded.user_id;
        if (!author_id) {
            return res.status(401).json({
                success: false,
                message: "Invalid user credentials"
            });
        }
        const result = await updateTagDB(
            Number(id),
            tag_name.trim(),
            description?.trim(),
            author_id
        );

        return res.status(200).json({
            success: true,
            data: result,
            message: "Tag updated successfully"
        });

    } catch (error) {
        console.error("Error updating tag:", error);

        const statusCode = error.statusCode ||
            (error.name === 'ValidationError' ? 400 :
                error.message.includes('Unauthorized') ? 403 : 500);

        const errorResponse = {
            success: false,
            message: error.message || "Error updating tag",
            ...(process.env.NODE_ENV === 'development' && {
                stack: error.stack,
                ...(error.details && { details: error.details })
            })
        };

        return res.status(statusCode).json(errorResponse);
    }
};

export const deleteTagById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid tag ID is required",
                details: {
                    expected: "Positive integer",
                    received: id
                }
            });
        }

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

        const author_id = decoded.user_id;
        if (!author_id) {
            return res.status(401).json({
                success: false,
                message: "Invalid user credentials"
            });
        }

        const result = await deleteTagDB(
            Number(id),
            author_id
        );

        return res.status(200).json({
            success: true,
            data: result,
            message: "Tag deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting tag:", error);

        const statusCode = error.statusCode ||
            (error.name === 'ValidationError' ? 400 :
                error.message.includes('Unauthorized') ? 403 : 500);

        const errorResponse = {
            success: false,
            message: error.message || "Error deleting tag",
            ...(process.env.NODE_ENV === 'development' && {
                stack: error.stack,
                ...(error.details && { details: error.details })
            })
        };

        return res.status(statusCode).json(errorResponse);
    }
};

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

export const getTagOfPostById = async (req, res) => {
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