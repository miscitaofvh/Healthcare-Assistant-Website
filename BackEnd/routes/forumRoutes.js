import express from "express";
import categoryController from "../controllers/forum/category.js";
import threadController from "../controllers/forum/thread.js";
import postController from "../controllers/forum/post.js";
import commentController from "../controllers/forum/comment.js";
import tagController from "../controllers/forum/tag.js";
import likeController from "../controllers/forum/like.js";
import reportController from "../controllers/forum/report.js";
import activityController from "../controllers/forum/activity.js";
import uploadImage from "../controllers/forum/uploadImage.js";
import forumValidatorsUser from "../middleware/validation/user.js";
import forumValidatorsCategory from "../middleware/validation/Forum/category.js";
import forumValidatorsThread from "../middleware/validation/Forum/thread.js";
import forumValidatorsPost from "../middleware/validation/Forum/post.js";
import forumValidatorsComment from "../middleware/validation/Forum/comment.js";
import forumValidatorsTag from "../middleware/validation/Forum/tag.js";
import forumValidatorsReport from "../middleware/validation/Forum/report.js";
import { validateActivity } from "../middleware/validation/Forum/activity.js";
import { paginate } from "../middleware/paginate.js";
import { auth } from "../security/authMiddleware.js";
import multer from "multer";
import { categoryLimiter, threadLimiter, commentLimiter, likeLimiter, reportLimiter, postLimiter, tagLimiter } from "../security/rateLimit.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ====================================================================================
// Upload Image Routes
// ====================================================================================
router.post(
  "/upload-image",
  auth.required,
  upload.single("forumImage"),
  uploadImage.uploadImage
);

// ====================================================================================
// Category Routes
// ====================================================================================
router.get("/categories", paginate(), asyncHandler(categoryController.getAllCategories));

router.get("/categories/summary/", asyncHandler(categoryController.getSummaryCategories));

router.get(
  "/categories/:categoryId",
  forumValidatorsCategory.validateCategoryExists,
  asyncHandler(categoryController.getCategoryById)
);

router.get(
  "/categories/name/:categoryName",
  forumValidatorsCategory.validateCategoryExistsByName,
  asyncHandler(categoryController.getCategoryByName)
);

router.get(
  "/categories/:categoryId/threads",
  forumValidatorsCategory.validateCategoryExists,
  paginate(),
  asyncHandler(categoryController.getThreadsByCategory)
);

router.get(
  "/categories/:categoryId/threads/summary",
  forumValidatorsCategory.validateCategoryExists,
  paginate({ limit: 5 }),
  asyncHandler(categoryController.getThreadsSummaryByCategory)
);

router.get(
  "/categories/:categoryId/posts",
  forumValidatorsCategory.validateCategoryExists,
  paginate(),
  asyncHandler(categoryController.getPostsByCategory)
);

router.get(
  "/users/:username/categories",
  forumValidatorsUser.validateUserExists,
  paginate(),
  asyncHandler(categoryController.getCategoriesByUser)
);

router.post(
  "/categories",
  auth.required,
  categoryLimiter,
  forumValidatorsCategory.validateCategoryCreate,
  asyncHandler(categoryController.createCategory)
);

router.put(
  "/categories/:categoryId",
  auth.required,
  forumValidatorsCategory.validateCategoryExists,
  forumValidatorsCategory.validateCategoryUpdate,
  auth.requireOwnerOrAdmin("category"),
  asyncHandler(categoryController.updateCategory)
);

router.delete(
  "/categories/:categoryId",
  auth.requireOwnerOrAdmin("category"),
  forumValidatorsCategory.validateCategoryExists,
  forumValidatorsCategory.validateCategoryDelete,
  asyncHandler(categoryController.deleteCategory)
);

// ====================================================================================
// Thread Routes
// ====================================================================================
router.get("/threads", paginate(), asyncHandler(threadController.getAllThreads));

router.get(
  "/threads/summary",
  paginate({ limit: 5 }),
  asyncHandler(threadController.getSummaryThreads)
);

router.get(
  "/threads/name/:threadName",
  forumValidatorsThread.validateThreadExists,
  asyncHandler(threadController.getThreadByName)
);

router.get(
  "/threads/:threadId",
  forumValidatorsThread.validateThreadExists,
  asyncHandler(threadController.getThreadById)
);

router.get(
  "/threads/:threadId/posts",
  forumValidatorsThread.validateThreadExists,
  paginate(),
  asyncHandler(threadController.getPostsByThread)
);

router.get(
  "/users/:username/threads",
  forumValidatorsUser.validateUserExists,
  paginate(),
  asyncHandler(threadController.getThreadsByUser)
);

router.post(
  "/threads",
  auth.required,
  threadLimiter,
  forumValidatorsThread.validateThreadCreate,
  asyncHandler(threadController.createThread)
);

router.put(
  "/threads/:threadId",
  auth.required,
  forumValidatorsThread.validateThreadExists,
  forumValidatorsThread.validateThreadUpdate,
  auth.requireOwnerOrAdmin("thread"),
  asyncHandler(threadController.updateThread)
);

router.delete(
  "/threads/:threadId",
  auth.required,
  forumValidatorsThread.validateThreadExists,
  forumValidatorsThread.validateThreadDelete,
  auth.requireOwnerOrAdmin("thread"),
  asyncHandler(threadController.deleteThread)
);

// ====================================================================================
// Post Routes
// ====================================================================================
router.get("/posts", paginate(), asyncHandler(postController.getAllPosts));

router.get(
  "/posts/summary",
  paginate({ limit: 5 }),
  asyncHandler(postController.getSummaryPosts)
);

router.get(
  "/posts/:postId",
  forumValidatorsPost.validatePostExists,
  asyncHandler(postController.getPostById)
);

router.get(
  "/users/:username/posts",
  forumValidatorsUser.validateUserExists,
  paginate(),
  asyncHandler(postController.getPostsByUser)
);

router.post(
  "/posts",
  auth.required,
  postLimiter,
  forumValidatorsPost.validateCreatePost,
  asyncHandler(postController.createPost)
);

router.put(
  "/posts/:postId",
  auth.required,
  forumValidatorsPost.validatePostExists,
  forumValidatorsPost.validateUpdatePost,
  auth.requireOwnerOrAdmin("post"),
  asyncHandler(postController.updatePost)
);

router.delete(
  "/posts/:postId",
  auth.required,
  forumValidatorsPost.validatePostExists,
  auth.requireOwnerOrAdmin("post"),
  asyncHandler(postController.deletePost)
);

// ====================================================================================
// Comment Routes
// ====================================================================================
router.get(
  "/posts/:postId/comments",
  paginate(),
  asyncHandler(commentController.getCommentsByPostId)
);

router.get(
  "/users/:userId/comments",
  paginate(),
  asyncHandler(commentController.getAllCommentsByUser)
);

router.post(
  "/posts/:postId/comments",
  auth.required,
  // commentLimiter,
  forumValidatorsComment.validateCommentPost,
  asyncHandler(commentController.addCommentToPost)
);

router.put(
  "/comments/:commentId",
  auth.required,
  forumValidatorsComment.validateCommentExists,
  forumValidatorsComment.validateUpdateComment,
  auth.requireOwnerOrAdmin("comment"),
  asyncHandler(commentController.updateComment)
);

router.delete(
  "/comments/:commentId",
  auth.required,
  forumValidatorsComment.validateCommentExists,
  auth.requireOwnerOrAdmin("comment"),
  asyncHandler(commentController.deleteComment)
);

// ====================================================================================
// Like Routes
// ====================================================================================
router.post(
  "/posts/:postId/likes",
  auth.required,
  likeLimiter,
  forumValidatorsPost.validatePostExists,
  asyncHandler(likeController.likePost)
);

router.delete(
  "/posts/:postId/likes",
  auth.required,
  forumValidatorsPost.validatePostExists,
  asyncHandler(likeController.unlikePost)
);

router.post(
  "/comments/:commentId/likes",
  auth.required,
  forumValidatorsComment.validateCommentExists,
  likeLimiter,
  asyncHandler(likeController.likeComment)
);

router.delete(
  "/comments/:commentId/likes",
  auth.required,
  forumValidatorsComment.validateCommentExists,
  asyncHandler(likeController.unlikeComment)
);

// ====================================================================================
// Report Routes
// ====================================================================================
router.post(
  "/comments/:commentId/reports",
  auth.required,
  reportLimiter,
  forumValidatorsComment.validateCommentExists,
  forumValidatorsReport.validateReportComment,
  asyncHandler(reportController.reportComment)
);

router.get(
  "/comments/:commentId/reports",
  auth.required,
  auth.requireModerator,
  asyncHandler(reportController.getReportsForComment)
);

router.post(
  "/posts/:postId/reports",
  auth.required,
  //   reportLimiter,
  forumValidatorsPost.validatePostExists,
  forumValidatorsReport.validateReportPost,
  asyncHandler(reportController.reportPost)
);

router.get(
  "/posts/:postId/reports",
  auth.required,
  auth.requireModerator,
  forumValidatorsPost.validatePostExists,
  paginate(),
  asyncHandler(reportController.getReportsForPost)
);

router.put(
  "/comments/:reportId",
  auth.required,
  auth.requireModerator,
  forumValidatorsReport.validateReportExists,
  forumValidatorsReport.validateReportUpdate,
  asyncHandler(reportController.updateCommentReportStatus)
);

router.put(
  "/posts/:reportId",
  auth.required,
  auth.requireModerator,
  forumValidatorsReport.validateReportExists,
  forumValidatorsReport.validateReportUpdate,
  asyncHandler(reportController.updatePostReportStatus)
);

router.delete(
  "/comments/:reportId",
  auth.required,
  auth.requireModerator,
  forumValidatorsReport.validateReportExists,
  asyncHandler(reportController.deleteCommentReport)
);

router.delete(
  "/posts/:reportId",
  auth.required,
  auth.requireModerator,
  forumValidatorsReport.validateReportExists,
  asyncHandler(reportController.deletePostReport)
);

// ====================================================================================
// Tag Routes
// ====================================================================================
router.get(
  "/tags",
  paginate(),
  forumValidatorsTag.validateTagQuery,
  asyncHandler(tagController.getAllTags)
);

router.get(
  "/tags/summary",
  forumValidatorsTag.validateTagQuery,
  asyncHandler(tagController.getSummaryTags)
);

router.get(
  "/tags/summary/little",
  paginate({ limit: 3 }),
  asyncHandler(tagController.getSummaryLittleTags)
);

router.get(
  "/tags/popular",
  paginate({ limit: 10 }),
  asyncHandler(tagController.getPopularTags)
);

router.get(
  "/tags/:tagId",
  forumValidatorsTag.validateTagExists,
  asyncHandler(tagController.getTagById)
);

router.get(
  "/tags/:tagId/summary",
  forumValidatorsTag.validateTagExists,
  asyncHandler(tagController.getSummaryTagById)
);

router.get(
  "/tags/:tagId/posts",
  forumValidatorsTag.validateTagExists,
  paginate(),
  asyncHandler(tagController.getPostsByTag)
);

router.get(
  "/tags/search/tagName",
  forumValidatorsTag.validateTagQuery,
  asyncHandler(tagController.getTagByName)
);

router.get(
  "/users/:username/tags/",
  forumValidatorsUser.validateUserExists,
  paginate(),
  asyncHandler(tagController.getTagsByUser)
);

router.post(
  "/tags",
  auth.required,
  tagLimiter,
  forumValidatorsTag.validateTagCreate,
  asyncHandler(tagController.createTag)
);

router.put(
  "/tags/:tagId",
  auth.required,
  forumValidatorsTag.validateTagExists,
  forumValidatorsTag.validateTagUpdate,
  auth.requireOwnerOrAdmin("tag"),
  asyncHandler(tagController.updateTagById)
);

router.delete(
  "/tags/:tagId",
  auth.required,
  forumValidatorsTag.validateTagExists,
  forumValidatorsTag.validateTagDelete,
  auth.requireOwnerOrAdmin("tag"),
  asyncHandler(tagController.deleteTagById)
);
// ====================================================================================
// Forum Activities Routes (Future Development)
// ====================================================================================
router.get("/activities", asyncHandler(activityController.getAllActivities));

router.get(
  "/activities/user/:id",
  asyncHandler(activityController.getForumActivityByUser)
);

router.get(
  "/activities/user/:id/type/:type",
  asyncHandler(activityController.getActivitiesByUserAndType)
);

router.get(
  "/activities/type/:type",
  asyncHandler(activityController.getActivitiesByType)
);

router.post(
  "/activities",
  validateActivity,
  asyncHandler(activityController.createActivity)
);

router.delete(
  "/activities/:activityId",
  asyncHandler(activityController.deleteActivityById)
);

router.get(
  "/activities/target/:targetType/:targetId",
  asyncHandler(activityController.getActivitiesByTarget)
);

router.get(
  "/activities/user/:id/count",
  asyncHandler(activityController.getActivityStatsByid)
);

export default router;