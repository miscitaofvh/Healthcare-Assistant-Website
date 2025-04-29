import express from "express";
import * as articleCtrl from "../controllers/articleController.js";
import { validateArticle } from "../middleware/validation/article.js";

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const router = express.Router();

router.get("/categories",     asyncHandler(articleCtrl.getCategories));
router.get("/categories/:article_id", asyncHandler(articleCtrl.getCategoryById));

router.get("/tags",           asyncHandler(articleCtrl.getTags));
router.get("/tags/:article_id",       asyncHandler(articleCtrl.getTagById));
router.post("/tags/article/:article_id", asyncHandler(articleCtrl.getTagsByArticle));

router.get("/articles",       asyncHandler(articleCtrl.getArticles));
router.get("/articles/:article_id",   asyncHandler(articleCtrl.getArticleById));

router.post("/articles",
    validateArticle,
    asyncHandler(articleCtrl.createArticle)
);
router.put("/articles/:article_id",
    validateArticle,
    asyncHandler(articleCtrl.updateArticle)
);
router.delete("/articles/:article_id",
    asyncHandler(articleCtrl.deleteArticle)
);

router.get("/articles/:article_id/comments", asyncHandler(articleCtrl.getCommentsByArticle));
router.post("/articles/:article_id/comments", asyncHandler(articleCtrl.createComment));
router.delete("/articles/:article_id/comments/:commentId", asyncHandler(articleCtrl.deleteComment));

export default router;