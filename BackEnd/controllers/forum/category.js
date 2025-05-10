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

        // Conflict errors
        "Category name already exists": StatusCodes.CONFLICT,
        "Cannot delete category with existing threads": StatusCodes.CONFLICT,

        // Not found errors
        "Category not found or unauthorized": StatusCodes.NOT_FOUND,
        "No categories found": StatusCodes.NOT_FOUND,
        "No threads found for this category": StatusCodes.NOT_FOUND,
        "No posts found for this category": StatusCodes.NOT_FOUND,
        "No categories found for this user": StatusCodes.NOT_FOUND
    };

    const statusCode = errorMap[error.message] || StatusCodes.INTERNAL_SERVER_ERROR;
    const response = {
        success: false,
        message: error.message || `Failed to ${action} category`,
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

// Controller methods
const getAllCategories = async (req, res) => {
    try {
        const { page = 1, limit = 10, sortBy = 'category_name', sortOrder = 'ASC' } = req.query;
        const { page: p, limit: l } = validatePagination(page, limit);
        const { orderByField, orderDirection } = validateSorting(sortBy, sortOrder);

        const { categories, pagination } = await CategoryDB.getAllCategoriesDB(p, l, orderByField, orderDirection);

        if (!categories) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "No data returned from database",
                timestamp: new Date().toISOString()
            });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            categories: categories,
            pagination: pagination,
            metadata: {
                message: categories.length ? "Categories retrieved successfully." : "No categories found.",
                retrievedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        handleError(error, req, res, 'fetch all categories');
    }
};

const getThreadsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { page = 1, limit = 10, sortBy = 'category_name', sortOrder = 'ASC' } = req.query;
        const { page: p, limit: l } = validatePagination(page, limit);
        const { orderByField, orderDirection } = validateSorting(sortBy, sortOrder);

        let author_id = null;
        try {
            if ((req.cookies.auth_token)) {
                const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
                author_id = decoded.user_id;
            }
        } catch(error) {
        }
        const { category, threads, pagination } = await CategoryDB.getThreadsByCategoryDB(categoryId, p, l, orderByField, orderDirection, author_id);

        res.status(StatusCodes.OK).json({
            success: true,
            category: category,
            threads: threads,
            pagination: pagination,
            metadata: {
                categoryId,
                retrievedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        handleError(error, req, res, 'fetch threads by category');
    }
};

const getSummaryCategories = async (req, res) => {
    try {
        const categories = await CategoryDB.getSummaryCategoriesDB();

        res.set('Cache-Control', 'public, max-age=3600'); // 1 hour cache

        res.status(StatusCodes.OK).json({
            success: true,
            count: categories.length,
            categories: categories,
            message: categories.length ? "Category summaries retrieved successfully" : "No categories available",
            metadata: {
                source: "database",
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        handleError(error, req, res, 'fetch category summaries');
    }
};

const getCategoryByName = async (req, res) => {
    try {
        const categoryName = req.params;

        const category = await CategoryDB.getCategoryByNameDB(categoryName);

        res.status(StatusCodes.OK).json({
            success: true,
            category: category,
            metadata: {
                retrievedAt: new Date().toISOString()
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

        res.status(StatusCodes.OK).json({
            success: true,
            category: category,
            metadata: {
                retrievedAt: new Date().toISOString(),
                cache: {
                    recommended: true,
                    duration: "1h"
                }
            }
        });

    } catch (error) {
        handleError(error, req, res, 'fetch category by ID');
    }
};

const getThreadsSummaryByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const { category, threads, totalCount } = await CategoryDB.getThreadsSummaryByCategoryDB(categoryId);

        res.status(StatusCodes.OK).json({
            success: true,
            category: category,
            threads: threads,
            pagination: {
                totalItems: totalCount
            },
            metadata: {
                categoryId,
                retrievedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        handleError(error, req, res, 'fetch thread summaries by category');
    }
};

const getPostsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const { page, limit } = validatePagination(req.query.page || 1, req.query.limit || 20);

        const sort = req.query.sort || 'newest';
        const validSortOptions = ['newest', 'oldest', 'most_comments', 'most_likes'];
        if (!validSortOptions.includes(sort)) {
            throw new Error("Invalid sort parameter");
        }

        const { posts, totalCount } = await CategoryDB.getPostsByCategoryDB(categoryId, page, limit, sort);

        res.status(StatusCodes.OK).json({
            success: true,
            posts: posts,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalItems: totalCount,
                itemsPerPage: limit
            },
            sort: {
                by: sort,
                description: getSortDescription(sort)
            },
            metadata: {
                categoryId,
                retrievedAt: new Date().toISOString(),
                cacheHint: {
                    recommended: true,
                    duration: "5m"
                }
            }
        });

    } catch (error) {
        handleError(error, req, res, 'fetch posts by category');
    }
};

const getCategoriesByUser = async (req, res) => {
    try {
        const { username } = req.params;
        const validatedUsername = validateStringInput(username, "Username");
        const includeStats = req.query.stats === 'true';

        const categories = await CategoryDB.getCategoriesByUserDB(validatedUsername, includeStats);

        res.status(StatusCodes.OK).json({
            success: true,
            categories: categories,
            metadata: {
                username: validatedUsername,
                count: categories.length,
                retrievedAt: new Date().toISOString(),
                includeStats,
                cacheHint: {
                    recommended: false,
                    reason: "User-specific data changes frequently"
                }
            }
        });

    } catch (error) {
        handleError(error, req, res, 'fetch categories by user');
    }
};

// Controller: createCategory
const createCategory = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { category_name, description } = req.body;

        const { categoryId, username } = await CategoryDB.createCategoryDB(userId, category_name, description);

        res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Category created successfully",
            data: { categoryId },
            metadata: {
                createdBy: username,
                createdAt: new Date().toISOString()
            }
        });

    } catch (error) {
        handleError(error, req, res, 'create category');
    }
};


const updateCategory = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const { categoryId } = req.params;

        const { category_name, description } = req.body;

        const result = await CategoryDB.updateCategoryDB(userId, categoryId, category_name, description);

        res.status(StatusCodes.OK).json({
            success: true,
            message: result,
            metadata: {
                updatedAt: new Date().toISOString(),
                updatedFields: Object.keys({ category_name, description })
            }
        });

    } catch (error) {
        handleError(error, req, res, 'update category');
    }
};

const deleteCategory = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const { categoryId } = req.params;

        const result = await CategoryDB.deleteCategoryDB(userId, categoryId);

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

// Utility function
function getSortDescription(sort) {
    const descriptions = {
        newest: "Most recently created posts first",
        oldest: "Oldest posts first",
        most_comments: "Posts with most comments first",
        most_likes: "Posts with most likes first"
    };
    return descriptions[sort] || "Default sorting";
}

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
}