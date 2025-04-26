import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import {
    getAllCategoriesDB,
    getSummaryCategoriesDB,
    getCategoryNameDB,
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
        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error fetching categories",
            error: error.message
        });
    }
};

export const getSummaryCategories = async (req, res) => {
    try {
        const categories = await getSummaryCategoriesDB();
        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error fetching categories",
            error: error.message
        });
    }
};

export const getCategoryName = async (req, res) => {
    try {
        const { name } = req.params;
        const categoryId = await getCategoryNameDB(name);
        if (!categoryId) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }
        res.status(200).json({
            success: true,
            data: { categoryId }
        });
    } catch (error) {
        console.error(error);
        if (error.message === "Invalid category name") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: "Error fetching category",
            error: error.message
        });
    }
};

export const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await getCategoryByIdDB(id);
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
        console.error(error);
        if (error.message === "Invalid category ID") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: "Error fetching category",
            error: error.message
        });
    }
};

export const getThreadsByCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const threads = await getThreadsByCategoryDB(id);
        if (!threads || threads.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No threads found for this category"
            });
        }
        res.status(200).json({
            success: true,
            data: threads
        });
    } catch (error) {
        console.error(error);
        if (error.message === "Invalid category ID") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: "Error fetching threads",
            error: error.message
        });
    }
};

export const getPostsByCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const posts = await getPostsByCategoryDB(id);
        if (!posts || posts.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No posts found for this category"
            });
        }
        res.status(200).json({
            success: true,
            data: posts
        });
    } catch (error) {
        console.error(error);
        if (error.message === "Invalid category ID") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: "Error fetching posts",
            error: error.message
        });
    }
};

export const getCategoriesByUser = async (req, res) => {
    try {
        const { id } = req.params;
        const categories = await getCategoriesByUserDB(id);
        if (!categories || categories.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No categories found for this user"
            });
        }
        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error(error);
        if (error.message === "Invalid user ID") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: "Error fetching categories",
            error: error.message
        });
    }
};

export const createCategory = async (req, res) => {
    try {
        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const author_id = decoded.user_id;

        if (!author_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { category_name, description } = req.body;
        const result = await createCategoryDB(author_id, category_name, description);
        res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: { categoryId: result }
        });
    } catch (error) {
        console.error(error);
        if (error.message === "Category name already exists") {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }
        if (error.message === "Category name is required and must be a non-empty string" ||
            error.message === "Category name must be less than 100 characters" ||
            error.message === "Description must be less than 1000 characters") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: "Error creating category",
            error: error.message
        });
    }
};

export const updateCategory = async (req, res) => {
    try {
        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const author_id = decoded.user_id;

        if (!author_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { id } = req.params;
        const { category_name, description } = req.body;
        const result = await updateCategoryDB(author_id, id, category_name, description);
        res.status(200).json({
            success: true,
            message: result
        });
    } catch (error) {
        console.error(error);
        if (error.message === "Category not found or unauthorized") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        if (error.message === "Category name already exists") {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }
        if (error.message === "Invalid category ID" ||
            error.message === "No fields to update provided" ||
            error.message === "Category name must be a non-empty string" ||
            error.message === "Category name must be less than 100 characters" ||
            error.message === "Description must be less than 1000 characters") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: "Error updating category",
            error: error.message
        });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const author_id = decoded.user_id;

        if (!author_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { id } = req.params;
        const result = await deleteCategoryDB(author_id, id);
        res.status(200).json({
            success: true,
            message: result
        });
    } catch (error) {
        console.error(error);
        if (error.message === "Category not found or unauthorized") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        if (error.message === "Cannot delete category with existing threads") {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }
        if (error.message === "Invalid category ID") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: "Error deleting category",
            error: error.message
        });
    }
};



