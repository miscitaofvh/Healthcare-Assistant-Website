import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import * as ArticleModel from "../models/Article.js";

dotenv.config();

// ----- Categories -----
export const getCategories = async (req, res) => {
  try {
    const categories = await ArticleModel.getCategories();
    res.status(200).json(categories);
  } catch (error) {
    console.error("getCategories error:", error);
    res.status(500).json({ message: "Error fetching categories" });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const { article_id } = req.params;
    const category = await ArticleModel.getCategoryById(article_id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.status(200).json(category);
  } catch (error) {
    console.error("getCategoryById error:", error);
    res.status(500).json({ message: "Error fetching category" });
  }
};

// ----- Tags -----
export const getTags = async (req, res) => {
  try {
    const tags = await ArticleModel.getTags();
    res.status(200).json(tags);
  } catch (error) {
    console.error("getTags error:", error);
    res.status(500).json({ message: "Error fetching tags" });
  }
};

export const getTagById = async (req, res) => {
  try {
    const { article_id } = req.params;
    const tag = await ArticleModel.getTagById(article_id);
    if (!tag) return res.status(404).json({ message: "Tag not found" });
    res.status(200).json(tag);
  } catch (error) {
    console.error("getTagById error:", error);
    res.status(500).json({ message: "Error fetching tag" });
  }
};

export const getTagsByArticle = async (req, res) => {
  try {
    const { article_id } = req.params;
    const tags = await ArticleModel.getTagsByArticle(article_id);
    res.status(200).json(tags);
  } catch (error) {
    console.error("getTagsByArticle error:", error);
    res.status(500).json({ message: "Error fetching tags for article" });
  }
};

// ----- Articles -----
export const getArticles = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const articles = await ArticleModel.getArticles(page);
    res.status(200).json(articles);
  } catch (error) {
    console.error("getArticles error:", error);
    res.status(500).json({ message: "Error fetching articles" });
  }
};

export const getArticleById = async (req, res) => {
  try {
    const { article_id } = req.params;
    const article = await ArticleModel.getArticleById(article_id);
    if (!article) return res.status(404).json({ message: "Article not found" });
    res.status(200).json(article);
  } catch (error) {
    console.error("getArticleById error:", error);
    res.status(500).json({ message: "Error fetching article" });
  }
};

export const createArticle = async (req, res) => {
  try {
    console.log("createArticle body:", req.body);
    const token = req.cookies?.auth_token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const author_id = decoded.user_id;
    const { title, content, category_name, tag_name, image_url } = req.body;
    const articleId = await ArticleModel.createArticle(
      author_id,
      title,
      content,
      category_name,
      tag_name,
      image_url
    );
    res.status(201).json({ article_id: articleId });
  } catch (error) {
    console.error("createArticle error:", error);
    res.status(500).json({ message: "Error creating article" });
  }
};

export const updateArticle = async (req, res) => {
  try {
    const { article_id } = req.params;
    const { title, content, category_name, image_url } = req.body;
    const updated = await ArticleModel.updateArticle(
      article_id,
      title,
      content,
      category_name,
      image_url
    );
    if (!updated) return res.status(404).json({ message: "Article not found" });
    res.status(200).json({ message: "Article updated successfully" });
  } catch (error) {
    console.error("updateArticle error:", error);
    res.status(500).json({ message: "Error updating article" });
  }
};

export const deleteArticle = async (req, res) => {
  try {
    const { article_id } = req.params;
    const deleted = await ArticleModel.deleteArticle(article_id);
    if (!deleted) return res.status(404).json({ message: "Article not found" });
    res.status(200).json({ message: "Article deleted successfully" });
  } catch (error) {
    console.error("deleteArticle error:", error);
    res.status(500).json({ message: "Error deleting article" });
  }
};
// ----- Comments -----
export const createComment = async (req, res) => {
  try {
    const { article_id, user_id, comment_content, parent_id} = req.body;
    await ArticleModel.addComment(article_id, user_id, comment_content, parent_id);
    res.status(201).json({ message: "Comment added" });
  } catch (error) {
    console.error("addComment error:", error);
    res.status(500).json({ message: "Error adding comment" });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { comment_id } = req.params;
    await ArticleModel.deleteComment(comment_id);
    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    console.error("deleteComment error:", error);
    res.status(500).json({ message: "Error deleting comment" });
  }
};

export const getCommentsByArticle = async (req, res) => {
  try {
    const { article_id } = req.params;
    const comments = await ArticleModel.getArticleComments(article_id);
    res.status(200).json(comments);
  } catch (error) {
    console.error("getArticleComments error:", error);
    res.status(500).json({ message: "Error fetching comments" });
  }
};

// ----- Views -----
export const addArticleView = async (req, res) => {
  try {
    const { article_id, user_id } = req.body;
    await ArticleModel.addArticleView(article_id, user_id);
    res.status(201).json({ message: "View recorded" });
  } catch (error) {
    console.error("addArticleView error:", error);
    res.status(500).json({ message: "Error recording view" });
  }
};

export const getArticleViews = async (req, res) => {
  try {
    const { article_id } = req.params;
    const total = await ArticleModel.getArticleViewsDB(article_id);
    res.status(200).json({ total_views: total });
  } catch (error) {
    console.error("getArticleViews error:", error);
    res.status(500).json({ message: "Error fetching views" });
  }
};