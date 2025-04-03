import express from "express";
import { getCategories, getArticles, getArticleById, createArticle, updateArticle, deleteArticle } from "../controllers/articleController.js";
import { validateArticle } from "../middleware/validationMiddleware.js";

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const router = express.Router();

router.get("/categories", asyncHandler(getCategories));
router.get("/articles", asyncHandler(getArticles));
router.get("/articles/:id", asyncHandler(getArticleById));
router.post("/articles", validateArticle, asyncHandler(createArticle));
router.put("/articles/:id", validateArticle, asyncHandler(updateArticle));
router.delete("/articles/:id", asyncHandler(deleteArticle));

export default router;