import express from "express";
import * as articleCtrl from "../controllers/articleController.js";
import { validateArticle } from "../middleware/validation/article.js";

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const router = express.Router();

router.get("/categories",     asyncHandler(articleCtrl.getCategories));
router.get("/categories/:id", asyncHandler(articleCtrl.getCategoryById));

router.get("/tags",           asyncHandler(articleCtrl.getTags));
router.get("/tags/:id",       asyncHandler(articleCtrl.getTagById));
router.post("/tags/article/:id", asyncHandler(articleCtrl.getTagsByArticle));

router.get("/articles",       asyncHandler(articleCtrl.getArticles));
router.get("/articles/:id",   asyncHandler(articleCtrl.getArticleById));

router.post("/articles",
    validateArticle,
    asyncHandler(articleCtrl.createArticle)
);
router.put("/articles/:id",
    validateArticle,
    asyncHandler(articleCtrl.updateArticle)
);
router.delete("/articles/:id",
    asyncHandler(articleCtrl.deleteArticle)
);

router.get("/articles/:id/comments", asyncHandler(articleCtrl.getCommentsByArticle));
router.post("/articles/:id/comments", asyncHandler(articleCtrl.createComment));
router.delete("/articles/:id/comments/:commentId", asyncHandler(articleCtrl.deleteComment));

export default router;