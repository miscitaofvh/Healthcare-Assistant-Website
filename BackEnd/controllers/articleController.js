
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import { getCategoriesDB, getArticlesDB, getArticleByIdDB, createArticleDB, updateArticleDB, deleteArticleDB } from "../models/Article.js";

dotenv.config();

export const getCategories = async (req, res) => {
    try {
        const categories = await getCategoriesDB();
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: "Error fetching categories" });
    }
};
export const getArticles = async (req, res) => {
    try {
        const articles = await getArticlesDB();
        res.status(200).json(articles);
    } catch (error) {
        res.status(500).json({ message: "Error fetching articles" });
    }
};

export const getArticleById = async (req, res) => { 
    try {
        const { id } = req.params;
        const article = await getArticleByIdDB(id);
        res.status(200).json(article);
    } catch (error) {
        res.status(500).json({ message: "Error fetching article" });
    }
};

export const createArticle = async (req, res) => {
    try {
        const { title, content, author_id, category_id, publication_date, image_url } = req.body;
        const article = await createArticleDB(title, content, author_id, category_id, publication_date, image_url);
        res.status(201).json(article);
    } catch (error) {
        res.status(500).json({ message: "Error creating article" });
    }
};

export const updateArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, author_id, category_id, publication_date, image_url } = req.body;
        const article = await updateArticleDB(id, title, content, author_id, category_id, publication_date, image_url);
        res.status(200).json(article);
    } catch (error) {
        res.status(500).json({ message: "Error updating article" });
    }
};

export const deleteArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const article = await deleteArticleDB(id);
        res.status(200).json(article);
    } catch (error) {
        res.status(500).json({ message: "Error deleting article" });
    }
};