import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import TagDB from "../../models/Forum/tag.js";

dotenv.config();

const handleError = (error, req, res, action = 'process') => {
    console.error(`[${req.requestId || 'no-request-id'}] Error in ${action}:`, error);

    const errorMap = {
        // Authentication errors
        "No authentication token provided": StatusCodes.UNAUTHORIZED,
        "Invalid or expired token": StatusCodes.UNAUTHORIZED,
        "Invalid token payload": StatusCodes.UNAUTHORIZED,
        "Unauthorized: User ID not found": StatusCodes.UNAUTHORIZED,

        // Validation errors
        "Valid tag ID is required": StatusCodes.BAD_REQUEST,
        "Valid tag name is required": StatusCodes.BAD_REQUEST,
        "Valid numeric post ID is required": StatusCodes.BAD_REQUEST,
        "Invalid pagination parameters": StatusCodes.BAD_REQUEST,
        "Invalid sort parameter": StatusCodes.BAD_REQUEST,
        "Post ID and tag IDs are required": StatusCodes.BAD_REQUEST,
        "Limit must be between 1 and 100": StatusCodes.BAD_REQUEST,

        // Conflict errors
        "Tag name already exists": StatusCodes.CONFLICT,

        // Not found errors
        "Tag not found": StatusCodes.NOT_FOUND,
        "No tags found": StatusCodes.NOT_FOUND,
        "No posts found for this tag": StatusCodes.NOT_FOUND,
        "No tags found for this user": StatusCodes.NOT_FOUND
    };

    const statusCode = errorMap[error.message] || StatusCodes.INTERNAL_SERVER_ERROR;
    const response = {
        success: false,
        message: error.message || `Failed to ${action} tag`,
        timestamp: new Date().toISOString()
    };

    if (process.env.NODE_ENV === 'development') {
        response.debug = {
            message: error.message,
            stack: error.stack?.split("\n")[0]
        };
    }

    if (error.message.includes("Invalid")) {
        response.errorCode = "VALIDATION_ERROR";
    }

    return res.status(statusCode).json(response);
};

// Helper functions
const validatePagination = (page, limit, maxLimit = 100) => {
    if (page < 1 || limit < 1 || limit > maxLimit) {
        throw new Error(`Invalid pagination parameters: Page must be ≥1 and limit between 1-${maxLimit}`);
    }
    return { page: parseInt(page), limit: parseInt(limit) };
};

const validateSorting = (sortBy, sortOrder, allowedFields) => {
    const orderByField = allowedFields[sortBy] || allowedFields[Object.keys(allowedFields)[0]];
    const orderDirection = sortOrder && sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    return { orderByField, orderDirection };
};

const getUserIdFromToken = (req) => {
    if (!req.cookies?.auth_token) {
        throw new Error("No authentication token provided");
    }

    const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
    if (!decoded.user_id) {
        throw new Error("Invalid token payload");
    }
    return decoded.user_id;
};

// Controller methods
const getAllTags = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', sortBy = 'usage_count', sortOrder = 'DESC' } = req.query;
        const { page: p, limit: l } = validatePagination(page, limit);

        const allowedSortFields = {
            'tag_name': 't.tag_name',
            'usage_count': 'usage_count',
            'last_used_at': 't.last_used_at',
            'created_at': 't.created_at',
            'post_count': 'post_count'
        };
        
        const { orderByField, orderDirection } = validateSorting(sortBy, sortOrder, allowedSortFields);

        const { tags, totalTags } = await TagDB.getAllTagsDB(p, l, search, orderByField, orderDirection);

        res.status(StatusCodes.OK).json({
            success: true,
            data: {
                tags,
                pagination: {
                    totalItems: totalTags,
                    totalPages: Math.ceil(totalTags / l),
                    currentPage: p,
                    itemsPerPage: l,
                    hasNextPage: p < Math.ceil(totalTags / l),
                    hasPreviousPage: p > 1
                },
                filters: {
                    search,
                    sortBy,
                    sortOrder
                },
                metadata: {
                    retrievedAt: new Date().toISOString(),
                    cacheHint: {
                        recommended: true,
                        duration: "5m"
                    }
                }
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch all tags');
    }
};

const getSummaryTags = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', sortBy = 'tag_name', sortOrder = 'ASC' } = req.query;
        const { page: p, limit: l } = validatePagination(page, limit);

        const allowedSortFields = {
            'tag_id': 't.tag_id',
            'tag_name': 't.tag_name',
            'description': 't.description'
        };
        
        const { orderByField, orderDirection } = validateSorting(sortBy, sortOrder, allowedSortFields);

        const { tags, totalTags } = await TagDB.getSummaryTagsDB(p, l, search, orderByField, orderDirection);

        res.status(StatusCodes.OK).json({
            success: true,
            data: {
                tags,
                pagination: {
                    totalItems: totalTags,
                    totalPages: Math.ceil(totalTags / l),
                    currentPage: p,
                    itemsPerPage: l
                },
                metadata: {
                    count: tags.length,
                    retrievedAt: new Date().toISOString()
                }
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch summary tags');
    }
};

const getSummaryLittleTags = async (req, res) => {
    try {
        const { tags, totalTags } = await TagDB.getSummaryLittleTagsDB();

        res.set('Cache-Control', 'public, max-age=3600'); // 1 hour cache

        res.status(StatusCodes.OK).json({
            success: true,
            data: {
                tags,
                pagination: {
                    totalItems: totalTags
                },
                metadata: {
                    retrievedAt: new Date().toISOString()
                }
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch little summary tags');
    }
};

const getSummaryTagById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || !Number.isInteger(Number(id))) {
            throw new Error("Valid tag ID is required");
        }

        const tag = await TagDB.getSummaryTagByIdDB(Number(id));

        if (!tag) {
            throw new Error("Tag not found");
        }

        res.status(StatusCodes.OK).json({
            success: true,
            data: tag,
            metadata: {
                tagId: id,
                retrievedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch tag summary by ID');
    }
};

const getTagById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || !Number.isInteger(Number(id))) {
            throw new Error("Valid numeric tag ID is required");
        }

        const tag = await TagDB.getTagByIdDB(id);

        if (!tag) {
            throw new Error("Tag not found");
        }

        res.status(StatusCodes.OK).json({
            success: true,
            tag: tag,
            metadata: {
                tagId: id,
                retrievedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch tag by ID');
    }
};

const getTagByName = async (req, res) => {
    try {
        const { name } = req.query;
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            throw new Error("Valid tag name is required");
        }

        const normalizedTagName = name.trim().toLowerCase();
        const tag = await TagDB.getTagByNameDB(normalizedTagName);

        if (!tag) {
            throw new Error("Tag not found");
        }

        res.status(StatusCodes.OK).json({
            success: true,
            data: tag,
            metadata: {
                tagName: normalizedTagName,
                retrievedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch tag by name');
    }
};

const getPostsByTag = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        if (!id || !Number.isInteger(Number(id))) {
            throw new Error("Valid numeric tag ID is required");
        }

        const { page: p, limit: l } = validatePagination(page, limit);

        const { posts, tag, totalPosts } = await TagDB.getPostsByTagDB(id, p, l);

        if (!tag) {
            throw new Error("Tag not found");
        }

        res.status(StatusCodes.OK).json({
            success: true,
            tag: tag,
            posts: posts,
            pagination: {
                totalItems: totalPosts,
                totalPages: Math.ceil(totalPosts / l),
                currentPage: p,
                itemsPerPage: l,
                hasNextPage: p < Math.ceil(totalPosts / l),
                hasPreviousPage: p > 1
            },
            metadata: {
                tagId: id,
                retrievedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch posts by tag');
    }
};

const getPopularTags = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const parsedLimit = parseInt(limit, 10);

        if (isNaN(parsedLimit)) {
            throw new Error("Limit must be a valid number");
        }

        if (parsedLimit < 1 || parsedLimit > 100) {
            throw new Error("Limit must be between 1 and 100");
        }

        const tags = await TagDB.getPopularTagsDB(parsedLimit);

        res.status(StatusCodes.OK).json({
            success: true,
            data: tags,
            meta: {
                count: tags.length,
                limit: parsedLimit,
                retrievedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch popular tags');
    }
};

const getTagsForPost = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || !Number.isInteger(Number(id))) {
            throw new Error("Valid numeric post ID is required");
        }

        const tags = await TagDB.getTagsForPostDB(id);

        res.status(StatusCodes.OK).json({
            success: true,
            data: tags,
            meta: {
                count: tags.length,
                postId: id,
                retrievedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch tags for post');
    }
};

const getTagsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            throw new Error("User ID is required");
        }

        const tags = await TagDB.getTagsByUserDB(userId);

        res.status(StatusCodes.OK).json({
            success: true,
            data: tags,
            metadata: {
                userId,
                count: tags.length,
                retrievedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch tags by user');
    }
};

const createTag = async (req, res) => {
    try {
        const { tag_name, description } = req.body;
        if (!tag_name) {
            throw new Error("Tag name is required");
        }

        const author_id = getUserIdFromToken(req);

        const result = await TagDB.createTagDB(tag_name, description, author_id);

        res.status(StatusCodes.CREATED).json({
            success: true,
            data: result,
            metadata: {
                createdBy: author_id,
                createdAt: new Date().toISOString()
            }
        });
    } catch (error) {
        handleError(error, req, res, 'create tag');
    }
};

const updateTagById = async (req, res) => {
    try {
        const { id } = req.params;
        const { tag_name, description } = req.body;

        if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
            throw new Error("Valid tag ID is required");
        }

        const author_id = getUserIdFromToken(req);

        const result = await TagDB.updateTagDB(
            Number(id),
            tag_name?.trim(),
            description?.trim(),
            author_id
        );

        res.status(StatusCodes.OK).json({
            success: true,
            data: result,
            message: "Tag updated successfully",
            metadata: {
                updatedAt: new Date().toISOString(),
                updatedBy: author_id
            }
        });
    } catch (error) {
        handleError(error, req, res, 'update tag');
    }
};

const deleteTagById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
            throw new Error("Valid tag ID is required");
        }

        const author_id = getUserIdFromToken(req);

        const result = await TagDB.deleteTagDB(Number(id), author_id);

        res.status(StatusCodes.OK).json({
            success: true,
            data: result,
            message: "Tag deleted successfully",
            metadata: {
                deletedAt: new Date().toISOString(),
                deletedBy: author_id
            }
        });
    } catch (error) {
        handleError(error, req, res, 'delete tag');
    }
};

const getTagsOfPost = async (req, res) => {
    try {
        const { id } = req.params;
        const tags = await TagDB.getTagsOfPostDB(id);

        res.status(StatusCodes.OK).json({
            success: true,
            data: tags,
            metadata: {
                postId: id,
                count: tags.length,
                retrievedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch tags of post');
    }
};

const getTagOfPostById = async (req, res) => {
    try {
        const { id } = req.params;
        const tag = await TagDB.getTagOfPostByIdDB(id);

        res.status(StatusCodes.OK).json({
            success: true,
            data: tag,
            metadata: {
                tagId: id,
                retrievedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch tag of post by ID');
    }
};

const addTagsToPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { ids } = req.body;

        if (!postId || !ids || !Array.isArray(ids) || ids.length === 0) {
            throw new Error("Post ID and tag IDs are required");
        }

        const author_id = getUserIdFromToken(req);

        const result = await TagDB.addTagsToPostDB(postId, ids, author_id);

        res.status(StatusCodes.CREATED).json({
            success: true,
            data: result,
            metadata: {
                postId,
                addedTagsCount: ids.length,
                addedAt: new Date().toISOString(),
                addedBy: author_id
            }
        });
    } catch (error) {
        handleError(error, req, res, 'add tags to post');
    }
};

const removeTagFromPost = async (req, res) => {
    try {
        const { postId, id } = req.params;

        if (!postId || !id) {
            throw new Error("Post ID and tag ID are required");
        }

        const author_id = getUserIdFromToken(req);

        const result = await TagDB.removeTagFromPostDB(postId, id, author_id);

        res.status(StatusCodes.OK).json({
            success: true,
            data: result,
            message: "Tag removed from post successfully",
            metadata: {
                postId,
                tagId: id,
                removedAt: new Date().toISOString(),
                removedBy: author_id
            }
        });
    } catch (error) {
        handleError(error, req, res, 'remove tag from post');
    }
};

export default {
    getAllTags,
    getSummaryTags,
    getSummaryLittleTags,
    getSummaryTagById,
    getTagById,
    getTagByName,
    getPostsByTag,
    getPopularTags,
    getTagsForPost,
    getTagsByUser,
    createTag,
    updateTagById,
    deleteTagById,
    getTagsOfPost,
    getTagOfPostById,
    addTagsToPost,
    removeTagFromPost
};