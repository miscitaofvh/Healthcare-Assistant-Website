import dotenv from "dotenv";
import jwt from "jsonwebtoken"; 

import { 
    getCategoriesDB, getCategoryByIdDB, getArticlesDB, getArticleByIdDB, 
    createArticleDB, updateArticleDB, deleteArticleDB, 
    likeArticleDB, unlikeArticleDB, getArticleLikesDB, 
    addCommentDB, deleteCommentDB, getArticleCommentsDB,
    addArticleViewDB, getArticleViewsDB,
    getTagsDB, getTagByIdDB, getTagsofArticleDB
} from "../models/Article.js";

dotenv.config();            

export const getCategories = async (req, res) => {
    try {
        const categories = await getCategoriesDB();
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: "Error fetching categories" });
    }

};

export const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await getCategoryByIdDB(id);
        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ message: "Error fetching category" });
    }
};

export const getTags = async (req, res) => {
    try {
        const tags = await getTagsDB();
        res.status(200).json(tags);
    } catch (error) {
        res.status(500).json({ message: "Error fetching tags" });
    }
}

export const getTagById = async (req, res) => {
    try {
        const { id } = req.params;
        const tag = await getTagByIdDB(id);
        res.status(200).json(tag);
    } catch (error) {
        res.status(500).json({ message: "Error fetching tag" });
    }
}

export const getTagsofArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const tags = await getTagsofArticleDB(id);
        res.status(200).json(tags);
    } catch (error) {
        res.status(500).json({ message: "Error fetching tags of article" });
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
        const { title, content, category_name, tag_name, image_url } = req.body;
        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const author_id = decoded.user_id;
        const author_name = decoded.username;
        const article = await createArticleDB(title, content, author_id, author_name, category_name, tag_name, image_url);
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

export const likeArticle = async (req, res) => {
    try {
        const { article_id, user_id } = req.body;
        await likeArticleDB(article_id, user_id);
        res.status(201).json({ message: "Article liked successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error liking article" });
    }
};

export const unlikeArticle = async (req, res) => {
    try {
        const { article_id, user_id } = req.body;
        await unlikeArticleDB(article_id, user_id);
        res.status(200).json({ message: "Article unliked successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error unliking article" });
    }
};

export const getArticleLikes = async (req, res) => {
    try {
        const { article_id } = req.params;
        const likes = await getArticleLikesDB(article_id);
        res.status(200).json(likes);
    } catch (error) {
        res.status(500).json({ message: "Error fetching likes" });
    }
};

export const addComment = async (req, res) => {
    try {
        const { article_id, user_id, comment_content } = req.body;
        await addCommentDB(article_id, user_id, comment_content);
        res.status(201).json({ message: "Comment added successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error adding comment" });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const { comment_id } = req.params;
        await deleteCommentDB(comment_id);
        res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting comment" });
    }
};

export const getArticleComments = async (req, res) => {
    try {
        const { article_id } = req.params;
        const comments = await getArticleCommentsDB(article_id);
        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ message: "Error fetching comments" });
    }
};

export const addArticleView = async (req, res) => {
    try {
        const { article_id, user_id } = req.body;
        await addArticleViewDB(article_id, user_id);
        res.status(201).json({ message: "Article view recorded successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error recording article view" });
    }
};

export const getArticleViews = async (req, res) => {
    try {
        const { article_id } = req.params;
        const views = await getArticleViewsDB(article_id);
        res.status(200).json(views);
    } catch (error) {
        res.status(500).json({ message: "Error fetching views" });
    }
};