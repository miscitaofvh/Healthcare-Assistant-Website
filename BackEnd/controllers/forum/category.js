import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";

import {
    getAllCategoriesDB,
    getSummaryCategoriesDB,
    getCategoryByNameDB,
    getCategoryByIdDB,
    getThreadsByCategoryDB,
    getPostsByCategoryDB,
    getCategoriesByUserDB,
    createCategoryDB,
    updateCategoryDB,
    deleteCategoryDB
} from "../../models/Forum/category.js";

dotenv.config();

export const getAllCategories = async (req, res) => {
    try {
        const categories = await getAllCategoriesDB();

        if (!categories || categories.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                message: "No categories found",
                timestamp: new Date().toISOString()
            });
        }

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories,
            message: "Categories retrieved successfully",
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error in getAllCategories:", error);

        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message
            : "Failed to retrieve categories";

        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
};


export const getSummaryCategories = async (req, res) => {
    try {
        const categories = await getSummaryCategoriesDB();

        res.set('Cache-Control', 'public, max-age=3600'); // 1 hour cache

        if (!categories || categories.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                message: "No categories available"
            });
        }

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories,
            message: "Category summaries retrieved successfully",
            metadata: {
                source: "database",
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error("Error in getSummaryCategories:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve category summaries",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            requestId: req.id || undefined
        });
    }
};

export const getCategoryByName = async (req, res) => {
    try {
        const { name } = req.params;

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Category name is required and must be a non-empty string"
            });
        }

        const category = await getCategoryByNameDB(name.trim());

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        res.status(200).json({
            success: true,
            data: category
        });

    } catch (error) {
        console.error("Error in getCategoryByName:", error);

        if (error.message.includes("Invalid") || error.message.includes("valid")) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error while fetching category",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID - must be an integer",
                errorCode: "INVALID_ID_FORMAT"
            });
        }

        const category = await getCategoryByIdDB(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
                errorCode: "CATEGORY_NOT_FOUND",
                suggestedActions: [
                    "Check the category ID",
                    "List all categories using /categories endpoint"
                ]
            });
        }

        res.status(200).json({
            success: true,
            data: category,
            metadata: {
                retrievedAt: new Date().toISOString(),
                cache: {
                    recommended: true,
                    duration: "1h"
                }
            }
        });

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error in getCategoryById:`, error);

        const statusCode = error.message.includes("Invalid") ? 400 : 500;

        res.status(statusCode).json({
            success: false,
            message: statusCode === 400 ? error.message : "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            errorCode: statusCode === 400 ? "CLIENT_ERROR" : "SERVER_ERROR",
            requestId: req.requestId || undefined
        });
    }
};

export const getThreadsByCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        if (!id || !Number.isInteger(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID format",
                errorCode: "INVALID_CATEGORY_ID"
            });
        }

        if (page < 1 || limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                message: "Invalid pagination parameters. Page must be ≥1 and limit between 1-100",
                errorCode: "INVALID_PAGINATION"
            });
        }

        const { category, threads, totalCount } = await getThreadsByCategoryDB(id, page, limit);

        if (!threads || threads.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No threads found for this category",
                errorCode: "NO_THREADS_FOUND",
                metadata: {
                    categoryId: id,
                    searchedAt: new Date().toISOString()
                }
            });
        }

        res.status(200).json({
            success: true,
            data: category, threads,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalItems: totalCount,
                itemsPerPage: limit
            },
            metadata: {
                categoryId: id,
                retrievedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error(`[${req.requestId}] Error in getThreadsByCategory:`, error);

        const statusCode = error.message.includes("Invalid") ? 400 : 500;

        res.status(statusCode).json({
            success: false,
            message: statusCode === 400 ? error.message : "Failed to retrieve threads",
            error: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                stack: error.stack
            } : undefined,
            errorCode: statusCode === 400 ? "CLIENT_ERROR" : "SERVER_ERROR",
            timestamp: new Date().toISOString()
        });
    }
};

export const getPostsByCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const sort = req.query.sort || 'newest';

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID format",
                errorCode: "INVALID_CATEGORY_ID",
                validation: {
                    param: "id",
                    message: "Must be a numeric value"
                }
            });
        }

        if (page < 1 || limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                message: "Invalid pagination parameters",
                errorCode: "INVALID_PAGINATION",
                validRange: {
                    page: "≥1",
                    limit: "1-100"
                }
            });
        }

        const validSortOptions = ['newest', 'oldest', 'most_comments', 'most_likes'];
        if (!validSortOptions.includes(sort)) {
            return res.status(400).json({
                success: false,
                message: "Invalid sort parameter",
                errorCode: "INVALID_SORT_PARAM",
                validOptions: validSortOptions
            });
        }

        const { posts, totalCount } = await getPostsByCategoryDB(id, page, limit, sort);

        if (!posts || posts.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No posts found for this category",
                errorCode: "NO_POSTS_FOUND",
                metadata: {
                    categoryId: id,
                    searchedAt: new Date().toISOString(),
                    filter: { page, limit, sort }
                },
                suggestedActions: [
                    "Verify the category exists",
                    "Try different sorting or pagination options"
                ]
            });
        }

        res.status(200).json({
            success: true,
            data: posts,
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
                categoryId: id,
                retrievedAt: new Date().toISOString(),
                cacheHint: {
                    recommended: true,
                    duration: "5m"
                }
            }
        });

    } catch (error) {
        console.error(`[${req.requestId || 'no-request-id'}] PostsByCategoryError:`, error);

        const statusCode = error.message.includes("Invalid") ? 400 : 500;
        const errorResponse = {
            success: false,
            message: statusCode === 400 ? error.message : "Failed to retrieve posts",
            errorCode: statusCode === 400 ? "CLIENT_ERROR" : "SERVER_ERROR",
            timestamp: new Date().toISOString()
        };

        if (process.env.NODE_ENV === 'development') {
            errorResponse.debug = {
                message: error.message,
                stack: error.stack.split("\n")[0]
            };
        }

        res.status(statusCode).json(errorResponse);
    }
};

export const getCategoriesByUser = async (req, res) => {
    try {
        const { username } = req.params;
        const includeStats = req.query.stats === 'true';

        if (!username || typeof username !== 'string' || username.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid username format",
                errorCode: "INVALID_USERNAME",
                validation: {
                    param: "username",
                    requirements: "Non-empty string"
                }
            });
        }

        const categories = await getCategoriesByUserDB(username.trim(), includeStats);

        if (!categories || categories.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No categories found for this user",
                errorCode: "NO_CATEGORIES_FOUND",
                metadata: {
                    username: username,
                    searchedAt: new Date().toISOString(),
                    includeStats: includeStats
                },
                suggestedActions: [
                    "Verify the username is correct",
                    "Check if the user has created any categories"
                ]
            });
        }

        res.status(200).json({
            success: true,
            data: categories,
            metadata: {
                username: username,
                count: categories.length,
                retrievedAt: new Date().toISOString(),
                includeStats: includeStats,
                cacheHint: {
                    recommended: false,
                    reason: "User-specific data changes frequently"
                }
            }
        });

    } catch (error) {
        console.error(`[${req.requestId || 'no-request-id'}] CategoriesByUserError:`, error);

        const statusCode = error.message.includes("Invalid") ? 400 : 500;

        res.status(statusCode).json({
            success: false,
            message: statusCode === 400 ? error.message : "Failed to retrieve user categories",
            errorCode: statusCode === 400 ? "CLIENT_ERROR" : "SERVER_ERROR",
            timestamp: new Date().toISOString(),
            ...(process.env.NODE_ENV === 'development' && {
                debug: {
                    message: error.message
                }
            })
        });
    }
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

export const createCategory = async (req, res) => {
    try {
        const token = req.cookies?.auth_token;
        if (!token) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "No authentication token provided"
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "Invalid or expired token"
            });
        }

        const author_id = decoded.user_id;
        if (!author_id) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "Invalid token payload"
            });
        }

        const { category_name, description } = req.body;

        if (!category_name || typeof category_name !== "string" || !category_name.trim()) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Category name is required and must be a non-empty string"
            });
        }
        if (category_name.length > 100) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Category name must be less than 100 characters"
            });
        }
        if (description && description.length > 1000) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Description must be less than 1000 characters"
            });
        }

        const categoryId = await createCategoryDB(author_id, category_name.trim(), description?.trim());
        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Category created successfully",
            data: { categoryId }
        });

    } catch (error) {
        console.error("[CREATE CATEGORY ERROR]", error);

        const knownErrors = [
            "Category name already exists",
            "Category name is required and must be a non-empty string",
            "Category name must be less than 100 characters",
            "Description must be less than 1000 characters"
        ];

        if (knownErrors.includes(error.message)) {
            const status = error.message === "Category name already exists"
                ? StatusCodes.CONFLICT
                : StatusCodes.BAD_REQUEST;

            return res.status(status).json({
                success: false,
                message: error.message
            });
        }

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};


export const updateCategory = async (req, res) => {
    try {
        const token = req.cookies?.auth_token;
        if (!token) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "No authentication token provided"
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "Invalid or expired token"
            });
        }

        const author_id = decoded.user_id;
        if (!author_id) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "Invalid token payload"
            });
        }

        const { id } = req.params;
        const { category_name, description } = req.body;

        if (!id || isNaN(id)) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Invalid category ID"
            });
        }

        if (!category_name && !description) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "No fields to update provided"
            });
        }

        if (category_name !== undefined) {
            if (typeof category_name !== "string" || !category_name.trim()) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: "Category name must be a non-empty string"
                });
            }
            if (category_name.length > 100) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: "Category name must be less than 100 characters"
                });
            }
        }

        if (description !== undefined && description.length > 1000) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Description must be less than 1000 characters"
            });
        }

        const result = await updateCategoryDB(
            author_id,
            id,
            category_name?.trim(),
            description?.trim()
        );

        return res.status(StatusCodes.OK).json({
            success: true,
            message: result
        });

    } catch (error) {
        console.error("[UPDATE CATEGORY ERROR]", error);

        const knownErrors = {
            "Category not found or unauthorized": StatusCodes.NOT_FOUND,
            "Category name already exists": StatusCodes.CONFLICT,
            "Invalid category ID": StatusCodes.BAD_REQUEST,
            "No fields to update provided": StatusCodes.BAD_REQUEST,
            "Category name must be a non-empty string": StatusCodes.BAD_REQUEST,
            "Category name must be less than 100 characters": StatusCodes.BAD_REQUEST,
            "Description must be less than 1000 characters": StatusCodes.BAD_REQUEST
        };

        const status = knownErrors[error.message] || StatusCodes.INTERNAL_SERVER_ERROR;
        return res.status(status).json({
            success: false,
            message: knownErrors[error.message] ? error.message : "Internal server error",
            error: status === StatusCodes.INTERNAL_SERVER_ERROR ? error.message : undefined
        });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const token = req.cookies?.auth_token;
        if (!token) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "No authentication token provided"
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "Invalid or expired token"
            });
        }

        const author_id = decoded.user_id;
        if (!author_id) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "Invalid token payload"
            });
        }

        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Invalid category ID"
            });
        }

        const result = await deleteCategoryDB(author_id, id);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: result
        });

    } catch (error) {
        console.error("[DELETE CATEGORY ERROR]", error);

        const knownErrors = {
            "Category not found or unauthorized": StatusCodes.NOT_FOUND,
            "Cannot delete category with existing threads": StatusCodes.CONFLICT,
            "Invalid category ID": StatusCodes.BAD_REQUEST
        };

        const status = knownErrors[error.message] || StatusCodes.INTERNAL_SERVER_ERROR;
        return res.status(status).json({
            success: false,
            message: knownErrors[error.message] ? error.message : "Internal server error",
            error: status === StatusCodes.INTERNAL_SERVER_ERROR ? error.message : undefined
        });
    }
};


