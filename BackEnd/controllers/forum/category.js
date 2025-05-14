import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import CategoryDB from "../../models/Forum/category.js";

dotenv.config();

const handleError = (error, req, res, action = 'process') => {
    console.error(`[${req.requestId || 'no-request-id'}] Error in ${action}:`, error);

    const errorMap = {
        // Authentication errors
        "No authentication token provided": StatusCodes.UNAUTHORIZED,
        "Invalid or expired token": StatusCodes.UNAUTHORIZED,
        "Invalid token payload": StatusCodes.UNAUTHORIZED,

        // Validation errors
        "Invalid category ID": StatusCodes.BAD_REQUEST,
        "Invalid username format": StatusCodes.BAD_REQUEST,
        "Invalid pagination": StatusCodes.BAD_REQUEST,
        "Invalid sort parameter": StatusCodes.BAD_REQUEST,
        "No fields to update provided": StatusCodes.BAD_REQUEST,
        "Category name is required": StatusCodes.BAD_REQUEST,
        "Invalid limit parameter": StatusCodes.BAD_REQUEST,
        "Invalid category name": StatusCodes.BAD_REQUEST,

        // Conflict errors
        "Category name already exists": StatusCodes.CONFLICT,
        "Cannot delete category with existing threads": StatusCodes.CONFLICT,

        // Not found errors
        "Category not found": StatusCodes.NOT_FOUND,
        "No categories found": StatusCodes.NOT_FOUND,
        "No threads found for this category": StatusCodes.NOT_FOUND,
        "No posts found for this category": StatusCodes-NOT_FOUND,
        "No categories found for this user": StatusCodes.NOT_FOUND,
        "User not found": StatusCodes.NOT_FOUND
    };

    const statusCode = errorMap[error.message] || StatusCodes.INTERNAL_SERVER_ERROR;
    const response = {
        success: false,
        errorCode: error.message.includes("Invalid") ? "VALIDATION_ERROR" : 
                   errorMap[error.message] ? error.message.toUpperCase().replace(/\s+/g, '_') : "INTERNAL_SERVER_ERROR",
        message: error.message || `Failed to ${action} category`,
        timestamp: new Date().toISOString()
    };

    if (process.env.NODE_ENV === 'development') {
        response.debug = {
            message: error.message,
            stack: error.stack?.split("\n")[0]
        };
    }

    return res.status(statusCode).json(response);
};

// Helper functions
const validatePagination = (page, limit, maxLimit = 100) => {
    if (page < 1 || limit < 1 || limit > maxLimit) {
        throw new Error(`Invalid pagination: Page must be ≥1 and limit between 1-${maxLimit}`);
    }
    return { page: parseInt(page), limit: parseInt(limit) };
};

const validateSorting = (sortBy, sortOrder) => {
    const allowedFields = {
        category_name: 'fc.category_name',
        created: 'fc.created_at',
        updated: 'fc.last_updated',
        threads: 'thread_count',
        posts: 'post_count'
    };

    const orderByField = allowedFields[sortBy] || allowedFields.category_name;
    const orderDirection = sortOrder && sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    return { orderByField, orderDirection };
};

const validateSortingThread = (sortBy, sortOrder) => {
    const allowedFields = {
        thread_name: 'ft.thread_name',
        created: 'ft.created_at',
        updated: 'ft.last_updated',
        posts: 'post_count',
        last_post_date: 'last_post_date'
    };
    const orderByField = allowedFields[sortBy] || allowedFields.thread_name;
    const orderDirection = sortOrder && sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    return { orderByField, orderDirection };
};

function getSortDescription(sort) {
    const descriptions = {
        newest: "Most recently created posts first",
        oldest: "Oldest posts first",
        most_comments: "Posts with most comments first",
        most_likes: "Posts with most likes first"
    };
    return descriptions[sort] || "Default sorting";
}

const validateSortingPost = (sortBy) => {
    const allowedFields = {
        newest: 'p.created_at DESC',
        oldest: 'p.created_at ASC',
        most_comments: 'p.comment_count DESC',
        most_likes: 'p.like_count DESC'
    };
    const orderByField = allowedFields[sortBy] || allowedFields.newest;
    return orderByField;
};

const getAllCategories = async (req, res) => {
    try {
        const { page = 1, limit = 10, sortBy = 'category_name', sortOrder = 'ASC' } = req.query;
        const { page: p, limit: l } = validatePagination(page, limit);
        const { orderByField, orderDirection } = validateSorting(sortBy, sortOrder);

        const { categories, pagination } = await CategoryDB.getAllCategoriesDB(p, l, orderByField, orderDirection);

        if (!categories) {
            throw new Error("No categories found");
        }

        res.status(StatusCodes.OK).json({
            success: true,
            categories: categories,
            pagination: pagination,
            metadata: {
                message: categories.length ? "Categories retrieved successfully." : "No categories found.",
                retrievedAt: new Date().toISOString(),
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch all categories');
    }
};

const getThreadsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { page = 1, limit = 10, sortBy = 'thread_name', sortOrder = 'ASC' } = req.query;
        const { page: p, limit: l } = validatePagination(page, limit);
        const { orderByField, orderDirection } = validateSortingThread(sortBy, sortOrder);
        let author_id = null;
        try {
            if (req.cookies.auth_token) {
                const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
                author_id = decoded.user_id;
            }
        } catch (error) {
            // Silently continue if token is invalid
        }
        const { category, threads, pagination } = await CategoryDB.getThreadsByCategoryDB(categoryId, p, l, orderByField, orderDirection, author_id);

        if (!category) {
            throw new Error("Category not found");
        }

        res.status(StatusCodes.OK).json({
            success: true,
            category: category,
            threads: threads,
            pagination: pagination,
            metadata: {
                categoryId,
                retrievedAt: new Date().toISOString(),
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch threads by category');
    }
};

const getSummaryCategories = async (req, res) => {
    try {
        let { limit } = req.query;
        if (isNaN(limit)) {
            limit = null;
        } else if (limit < 1) {
            throw new Error("Invalid limit parameter");
        }
        const categories = await CategoryDB.getSummaryCategoriesDB(limit);
        
        if (!categories) {
            throw new Error("No categories found");
        }

        res.status(StatusCodes.OK).json({
            success: true,
            count: categories.length,
            categories: categories,
            message: categories.length ? "Category summaries retrieved successfully" : "No categories available",
            metadata: {
                source: "database",
                generatedAt: new Date().toISOString(),
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch category summaries');
    }
};

const getCategoryByName = async (req, res) => {
    try {
        const { categoryName } = req.params;

        const category = await CategoryDB.getCategoryByNameDB(categoryName);

        if (!category) {
            throw new Error("Category not found");
        }

        res.status(StatusCodes.OK).json({
            success: true,
            category: category,
            metadata: {
                retrievedAt: new Date().toISOString(),
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch category by name');
    }
};

const getCategoryById = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const category = await CategoryDB.getCategoryByIdDB(categoryId);

        if (!category) {
            throw new Error("Category not found");
        }

        res.status(StatusCodes.OK).json({
            success: true,
            category: category,
            metadata: {
                retrievedAt: new Date().toISOString(),
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch category by ID');
    }
};

const getThreadsSummaryByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        let { limit } = req.query;
        if (isNaN(limit)) {
            limit = null;
        } else if (limit < 1) {
            throw new Error("Invalid limit parameter");
        }
        const { category, threads, totalCount } = await CategoryDB.getThreadsSummaryByCategoryDB(categoryId, limit);

        if (!category) {
            throw new Error("Category not found");
        }

        res.status(StatusCodes.OK).json({
            success: true,
            category: category,
            threads: threads,
            pagination: {
                totalItems: totalCount
            },
            metadata: {
                categoryId,
                retrievedAt: new Date().toISOString(),
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch thread summaries by category');
    }
};

const getPostsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const { page = 1, limit = 10, sortBy = 'newest' } = req.query;

        const { page: p, limit: l } = validatePagination(page, limit);
        const sort = validateSortingPost(sortBy);

        const { category, posts, totalCount } = await CategoryDB.getPostsByCategoryDB(categoryId, p, l, sort);

        if (!category) {
            throw new Error("Category not found");
        }

        res.status(StatusCodes.OK).json({
            success: true,
            category: category,
            posts: posts,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalItems: totalCount,
                itemsPerPage: limit
            },
            sort: {
                by: sort,
                description: getSortDescription(sortBy)
            },
            metadata: {
                categoryId,
                retrievedAt: new Date().toISOString(),
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch posts by category');
    }
};

const getCategoriesByUser = async (req, res) => {
    try {
        const { username } = req.params;

        const includeStats = req.query.includeStats === 'true';

        const categories = await CategoryDB.getCategoriesByUserDB(username, includeStats);

        if (!categories) {
            throw new Error("No categories found for this user");
        }

        res.status(StatusCodes.OK).json({
            success: true,
            categories: categories,
            metadata: {
                username: username,
                count: categories.length,
                retrievedAt: new Date().toISOString(),
                includeStats,
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch categories by user');
    }
};

const createCategory = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { category_name, description } = req.body;

        const { categoryId } = await CategoryDB.createCategoryDB(userId, category_name, description);

        if (!categoryId) {
            throw new Error("Failed to create category");
        }

        res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Category created successfully",
            data: { categoryId },
            metadata: {
                createdAt: new Date().toISOString()
            }
        });
    } catch (error) {
        handleError(error, req, res, 'create category');
    }
};

const updateCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const { category_name, description } = req.body;

        const result = await CategoryDB.updateCategoryDB(categoryId, category_name, description);

        res.status(StatusCodes.OK).json({
            success: true,
            message: result,
            metadata: {
                updatedAt: new Date().toISOString(),
                updatedFields: Object.keys({ category_name, description }).filter(key => req.body[key] !== undefined)
            }
        });
    } catch (error) {
        handleError(error, req, res, 'update category');
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const result = await CategoryDB.deleteCategoryDB(categoryId);

        res.status(StatusCodes.OK).json({
            success: true,
            message: result,
            metadata: {
                deletedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        handleError(error, req, res, 'delete category');
    }
};

export default {
    getAllCategories,
    getSummaryCategories,
    getCategoryByName,
    getCategoryById,
    getThreadsByCategory,
    getThreadsSummaryByCategory,
    getPostsByCategory,
    getCategoriesByUser,
    createCategory,
    updateCategory,
    deleteCategory
};