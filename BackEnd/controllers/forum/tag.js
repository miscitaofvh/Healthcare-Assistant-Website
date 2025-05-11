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

        const { tags, pagination } = await TagDB.getAllTagsDB(p, l, search, orderByField, orderDirection);

        res.status(StatusCodes.OK).json({
            success: true,
            tags: tags,
            pagination: pagination,
            metadata: {
                retrievedAt: new Date().toISOString(),
                cacheHint: {
                    recommended: true,
                    duration: "5m"
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

        const { tags, pagination } = await TagDB.getSummaryTagsDB(p, l, search, orderByField, orderDirection);

        res.status(StatusCodes.OK).json({
            success: true,
            tags: tags,
            pagination: pagination,
            metadata: {
                count: tags.length,
                retrievedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch summary tags');
    }
};

const getSummaryLittleTags = async (req, res) => {
    try {
        const { tags } = await TagDB.getSummaryLittleTagsDB();

        res.set('Cache-Control', 'public, max-age=3600'); // 1 hour cache

        res.status(StatusCodes.OK).json({
            success: true,
            tags: tags,
            metadata: {
                retrievedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch little summary tags');
    }
};

const getSummaryTagById = async (req, res) => {
    try {
        const { tagId } = req.params;

        const tag = await TagDB.getSummaryTagByIdDB(Number(tagId));

        res.status(StatusCodes.OK).json({
            success: true,
            tag: tag,
            metadata: {
                tagId: tagId,
                retrievedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch tag summary by ID');
    }
};

const getTagById = async (req, res) => {
    try {
        const { tagId } = req.params;

        const tag = await TagDB.getTagByIdDB(tagId);

        res.status(StatusCodes.OK).json({
            success: true,
            tag: tag,
            metadata: {
                tagId: tagId,
                retrievedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch tag by ID');
    }
};

const getTagByName = async (req, res) => {
    try {
        const { tagName } = req.query;
        const tag = await TagDB.getTagByNameDB(name);

        res.status(StatusCodes.OK).json({
            success: true,
            data: tag,
            metadata: {
                tagName: tagName,
                retrievedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch tag by name');
    }
};

const getPostsByTag = async (req, res) => {
    try {
        const { tagId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const { page: p, limit: l } = validatePagination(page, limit);

        let author_id = null;
        try {
            if ((req.cookies.auth_token)) {
                const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
                author_id = decoded.user_id;
            }
        } catch(error) {
        }

        const { posts, tag, pagination } = await TagDB.getPostsByTagDB(tagId, p, l, author_id);

        res.status(StatusCodes.OK).json({
            success: true,
            tag: tag,
            posts: posts,
            pagination: pagination,
            metadata: {
                tagId: tagId,
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

        const tags = await TagDB.getPopularTagsDB(limit);

        res.status(StatusCodes.OK).json({
            success: true,
            tags: tags,
            meta: {
                count: tags.length,
                limit: limit,
                retrievedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch popular tags');
    }
};

const getTagsForPost = async (req, res) => {
    try {
        const { postId } = req.params;

        const tags = await TagDB.getTagsForPostDB(postId);

        res.status(StatusCodes.OK).json({
            success: true,
            tags: tags,
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
        const { username } = req.params;

        const tags = await TagDB.getTagsByUserDB(username);

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
        const { tagId } = req.params;
        const { tag_name, description } = req.body;

        const author_id = getUserIdFromToken(req);

        const result = await TagDB.updateTagDB(
            Number(tagId),
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
        const { tagId } = req.params;

        const author_id = getUserIdFromToken(req);

        const result = await TagDB.deleteTagDB(Number(tagId), author_id);

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
            tags: tags,
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
        const { postId } = req.params;
        const tags = await TagDB.getTagOfPostByIdDB(postId);

        res.status(StatusCodes.OK).json({
            success: true,
            tags: tags,
            metadata: {
                postId: postId,
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
        const { postId, tagId } = req.params;

        const author_id = getUserIdFromToken(req);

        const result = await TagDB.removeTagFromPostDB(postId, tagId, author_id);

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