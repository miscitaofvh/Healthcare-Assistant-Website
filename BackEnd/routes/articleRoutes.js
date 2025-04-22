import express from "express";
import { getCategories, getCategoryById, 
        getArticles, getArticleById, createArticle, 
        updateArticle, deleteArticle,
        getTags, getTagById, getTagsofArticle } from "../controllers/articleController.js";
import { validateArticle } from "../middleware/validationMiddleware.js";

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const router = express.Router();

router.get("/categories", asyncHandler(getCategories));
router.get("/categories/:id", asyncHandler(getCategoryById));
router.get("/tags", asyncHandler(getTags));
router.get("/tags/:id", asyncHandler(getTagById));
router.post("/tags/article/:id", asyncHandler(getTagsofArticle));
router.get("/articles", asyncHandler(getArticles));
router.get("/articles/:id", asyncHandler(getArticleById));
router.post("/articles", validateArticle, asyncHandler(createArticle));
router.put("/articles/:id", validateArticle, asyncHandler(updateArticle));
router.delete("/articles/:id", asyncHandler(deleteArticle));

export default router;