import express from "express";
import {
        getAllCategories, getSummaryCategories, getCategoryByName, getCategoryById, getThreadsByCategory,
        getThreadsSummaryByCategory, getPostsByCategory, getCategoriesByUser, createCategory, updateCategory, deleteCategory
} from "../controllers/forum/category.js"
import {
        getAllThreads, getSummaryThreads, getThreadById, getThreadByName, getPostsByThread,
        getThreadsByUser, createThread, updateThread, deleteThread
} from "../controllers/forum/thread.js";
import { getAllPosts, getSummaryPosts, getPostById, getPostsByUser, createPost, updatePost, deletePost } from "../controllers/forum/post.js";
import {
        getCommentsByPostId, getCommentReplies, getAllCommentsByUser, addCommentToPost, addReplyToComment,
        updateComment, deleteComment
} from "../controllers/forum/comment.js";
import {
        getAllTags, getSummaryTags, getSummaryLittleTags, getSummaryTagById, getTagById, getTagByName, getPostsByTag, getTagsByUser, getPopularTags,
        getTagOfPostById, getTagsForPost, addTagsToPost, createTag, updateTagById, deleteTagById,
        removeTagFromPost
} from "../controllers/forum/tag.js";
import { likePost, unlikePost, getLikesOfPost, likeComment, unlikeComment } from "../controllers/forum/like.js";
import {
        reportComment, getAllReports, getReportById, getReportsByUser, getReportsByPost, createReport,
        updateReport, deleteReport, getReportsByStatus, deleteReportById,
        getReportsForComment, updateReportStatusForComment
} from "../controllers/forum/report.js";
import {
        getAllActivities, getForumActivityByUser, getActivitiesByUserAndType, getActivitiesByType,
        createActivity, deleteActivityById, getActivitiesByTarget, getActivityStatsByid
} from "../controllers/forum/activity.js";

import { uploadImage } from "../controllers/forum/uploadImage.js";
import forumValidatorsUser from "../middleware/validation/user.js"
import forumValidatorsCategory from "../middleware/validation/Forum/category.js";
import forumValidatorsThread from "../middleware/validation/Forum/thread.js";
import forumValidatorsPost from "../middleware/validation/Forum/post.js";
import forumValidatorsComment from "../middleware/validation/Forum/comment.js";
import forumValidatorsTag from "../middleware/validation/Forum/tag.js";
import forumValidatorsReport from "../middleware/validation/Forum/report.js";
import { validateActivity } from "../middleware/validation/Forum/activity.js";


import { paginate } from "../middleware/paginate.js";
import { auth } from "../security/authMiddleware.js";
import multer from 'multer';
import { categoryLimiter, threadLimiter, commentLimiter, likeLimiter, reportLimiter, postLimiter, tagLimiter  } from "../security/rateLimit.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const asyncHandler = (fn) => (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
};

// ===================================================================================================================================
// ===================================================================================================================================
// Upload image
router.post('/upload-image', upload.single('forumImage'), uploadImage);

// ===================================================================================================================================
// ===================================================================================================================================
// Category Routes
router.get("/categories",
        paginate(),
        asyncHandler(getAllCategories)
);

router.get("/categories/summary",
        paginate({ limit: 5 }),
        asyncHandler(getSummaryCategories)
);

router.get("/categories/:categoryId",
        forumValidatorsCategory.validateCategoryExists,
        asyncHandler(getCategoryById)
);

router.get("/categories/name/:categoryName",
        forumValidatorsCategory.validateCategoryExistsByName,
        asyncHandler(getCategoryByName)
);

router.get("/categories/:categoryId/threads",
        forumValidatorsCategory.validateCategoryExists,
        paginate(),
        asyncHandler(getThreadsByCategory)
);

router.get("/categories/:categoryId/threads/summary",
        forumValidatorsCategory.validateCategoryExists,
        paginate({ limit: 5 }),
        asyncHandler(getThreadsSummaryByCategory)
);

router.get("/categories/:categoryId/posts",
        forumValidatorsCategory.validateCategoryExists,
        paginate(),
        asyncHandler(getPostsByCategory)
);

router.get("/users/:username/categories",
        forumValidatorsUser.validateUserExists,
        paginate(),
        asyncHandler(getCategoriesByUser)
);

router.post("/categories",
        auth.required,
        categoryLimiter,
        forumValidatorsCategory.validateCategoryCreate,
        asyncHandler(createCategory)
);

router.put("/categories/:categoryId",
        auth.required,
        forumValidatorsCategory.validateCategoryExists,
        forumValidatorsCategory.validateCategoryUpdate,
        auth.requireOwnerOrAdmin("category"),
        asyncHandler(updateCategory)
);

router.delete("/categories/:categoryId",
        auth.required,
        forumValidatorsCategory.validateCategoryExists,
        forumValidatorsCategory.validateCategoryDelete,
        auth.requireOwnerOrAdmin("category"),
        asyncHandler(deleteCategory)
);

// ===================================================================================================================================
// ===================================================================================================================================
// Thread Routes
router.get("/threads",
        paginate(),
        asyncHandler(getAllThreads)
);

router.get("/threads/summary",
        paginate({ limit: 5 }),
        asyncHandler(getSummaryThreads)
);

router.get("/threads/:threadId",
        forumValidatorsThread.validateThreadExists,
        asyncHandler(getThreadById)
);

router.get("/threads/name/:threadName",
        forumValidatorsThread.validateThreadExists,
        asyncHandler(getThreadByName)
);

router.get("/threads/:threadId/posts",
        forumValidatorsThread.validateThreadExists,
        paginate(),
        asyncHandler(getPostsByThread)
);

router.get("/users/:username/threads",
        forumValidatorsUser.validateUserExists,
        paginate(),
        asyncHandler(getThreadsByUser)
);

router.post("/threads",
        auth.required,
        threadLimiter,
        forumValidatorsThread.validateThreadCreate,
        asyncHandler(createThread)
);

router.put("/threads/:threadId",
        auth.required,
        forumValidatorsThread.validateThreadExists,
        forumValidatorsThread.validateThreadUpdate,
        auth.requireOwnerOrAdmin("thread"),
        asyncHandler(updateThread)
);

router.delete("/threads/:threadId",
        auth.required,
        forumValidatorsThread.validateThreadExists,
        forumValidatorsThread.validateThreadDelete,
        auth.requireOwnerOrAdmin("thread"),
        asyncHandler(deleteThread)
);
// ===================================================================================================================================
// ===================================================================================================================================
// Post Routes
router.get("/posts",
        paginate(),
        asyncHandler(getAllPosts)
);

router.get("/posts/summary",
        paginate({ limit: 5 }),
        asyncHandler(getSummaryPosts)
);

router.get("/posts/:postId",
        forumValidatorsPost.validatePostExists,
        asyncHandler(getPostById)
);

router.get("/users/:username/posts",
        forumValidatorsUser.validateUserExists,
        paginate(),
        asyncHandler(getPostsByUser)
);

router.post("/posts",
        auth.required,
        postLimiter,
        forumValidatorsPost.validateCreatePost,
        asyncHandler(createPost)
);

router.put("/posts/:postId",
        auth.required,
        forumValidatorsPost.validatePostExists,
        forumValidatorsPost.validateUpdatePost,
        auth.requireOwnerOrAdmin("post"),
        asyncHandler(updatePost)
);

router.delete("/posts/:postId",
        auth.required,
        forumValidatorsPost.validatePostExists,
        forumValidatorsPost.validateDeletePost,
        auth.requireOwnerOrAdmin("post"),
        asyncHandler(deletePost)
);
// ===================================================================================================================================
// ===================================================================================================================================
// Comment Routes
router.get("/posts/:postId/comments",
        paginate(),
        asyncHandler(getCommentsByPostId));

router.get("/comments/:commentId/replies",
        asyncHandler(getCommentReplies));

router.get("/users/:userId/comments",
        paginate(),
        asyncHandler(getAllCommentsByUser));

router.post("/posts/:postId/comments",
        auth.required,
        commentLimiter,
        forumValidatorsComment.validateCommentPost,
        asyncHandler(addCommentToPost)
);

router.post("/comments/:commentId/replies",
        auth.required,
        commentLimiter,
        forumValidatorsComment.validateReplyComment,
        asyncHandler(addReplyToComment)
);

router.put("/comments/:commentId",
        auth.required,
        forumValidatorsComment.validateUpdateComment,
        auth.requireOwnerOrAdmin("comment"),
        asyncHandler(updateComment)
);

router.delete("/comments/:commentId",
        auth.required,
        forumValidatorsComment.validateCommentExists,
        auth.requireOwnerOrAdmin("comment"),
        asyncHandler(deleteComment)
);

// ===================================================================================================================================
// ===================================================================================================================================
// Like Routes
router.post("/posts/:postId/likes",
        auth.required,
        likeLimiter,
        forumValidatorsPost.validatePostExists,
        asyncHandler(likePost)
);

router.delete("/posts/:postId/likes",
        auth.required,
        forumValidatorsPost.validatePostExists,
        asyncHandler(unlikePost)
);

router.get("/posts/:postId/likes",
        forumValidatorsPost.validatePostExists,
        paginate(),
        asyncHandler(getLikesOfPost)
);

router.post("/comments/:commentId/likes",
        auth.required,
        forumValidatorsComment.validateCommentExists,
        likeLimiter,
        asyncHandler(likeComment)
);

router.delete("/comments/:commentId/likes",
        auth.required,
        forumValidatorsComment.validateCommentExists,
        asyncHandler(unlikeComment)
);

// ===================================================================================================================================
// ===================================================================================================================================
// Report Routes

router.get("/reports",
        auth.required,
        auth.requireModerator,
        paginate(),
        asyncHandler(getAllReports)
);

router.get("/reports/:reportId",
        auth.required,
        auth.requireModerator,
        forumValidatorsReport.validateReportExists,
        asyncHandler(getReportById)
);

router.put("/reports/:reportId",
        auth.required,
        auth.requireModerator,
        forumValidatorsReport.validateReportExists,
        forumValidatorsReport.validateReportUpdate,
        asyncHandler(updateReport)
);

router.delete("/reports/:reportId",
        auth.required,
        auth.requireModerator,
        forumValidatorsReport.validateReportExists,
        asyncHandler(deleteReportById)
);

router.get("/reports/status/:status",
        auth.required,
        auth.requireModerator,
        forumValidatorsReport.validateReportStatus,
        paginate(),
        asyncHandler(getReportsByStatus)
);

// user report
router.get("/users/:userId/reports",
        auth.required,
        auth.requireModerator,
        paginate(),
        asyncHandler(getReportsByUser)
);

// report post
router.get("/posts/:postId/reports",
        auth.required,
        auth.requireModerator,
        forumValidatorsPost.validatePostExists,
        paginate(),
        asyncHandler(getReportsByPost)
);

router.post("/posts/:postId/reports",
        auth.required,
        reportLimiter,
        forumValidatorsPost.validatePostExists,
        forumValidatorsReport.validateReportPost,
        asyncHandler(createReport)
);

// report comment
router.get("/comments/:commentId/reports",
        auth.required,
        auth.requireModerator,
        asyncHandler(getReportsForComment));

router.post("/comments/:commentId/reports",
        auth.required,
        reportLimiter,
        forumValidatorsComment.validateCommentExists,
        forumValidatorsReport.validateReportComment,
        asyncHandler(reportComment)
);

router.put("/reports/:reportId",
        auth.required,
        forumValidatorsReport.validateReportUpdate,
        auth.requireOwnerOrAdmin("report"),
        asyncHandler(updateReport)
);

// ===================================================================================================================================
// ===================================================================================================================================
// Tag Routes
router.get("/tags",
        paginate(),
        asyncHandler(getAllTags)
);

router.get("/tags/summary",
        paginate({ limit: 5 }),
        asyncHandler(getSummaryTags)
);

router.get("/tags/summary/little",
        paginate({ limit: 3 }),
        asyncHandler(getSummaryLittleTags)
);

router.get("/tags/summary/:tagId",
        forumValidatorsTag.validateTagExists,
        asyncHandler(getSummaryTagById)
);

router.get("/tags/popular",
        paginate({ limit: 10 }),
        asyncHandler(getPopularTags)
);

router.get("/tags/:tagId",
        forumValidatorsTag.validateTagExists,
        asyncHandler(getTagById)
);

router.get("/tags/search",
        forumValidatorsTag.validateTagQuery,
        asyncHandler(getTagByName)
);

router.get("/tags/:tagId/posts",
        forumValidatorsTag.validateTagExists,
        paginate(),
        asyncHandler(getPostsByTag)
);

router.get("/users/:userId/tags",
        forumValidatorsUser.validateUserExists,
        paginate(),
        asyncHandler(getTagsByUser)
);

router.post("/tags",
        auth.required,
        tagLimiter,
        forumValidatorsTag.validateTagCreate,
        asyncHandler(createTag)
);

router.put("/tags/:tagId",
        auth.required,
        forumValidatorsTag.validateTagExists,
        forumValidatorsTag.validateTagUpdate,
        auth.requireOwnerOrAdmin("tag"),
        asyncHandler(updateTagById)
);

router.delete("/tags/:tagId",
        auth.required,
        forumValidatorsTag.validateTagExists,
        auth.requireOwnerOrAdmin("tag"),
        asyncHandler(deleteTagById)
);

// Post-Tag Relationship Routes
router.get("/posts/:postId/tags",
        forumValidatorsPost.validatePostExists,
        paginate(),
        asyncHandler(getTagsForPost)
);

router.get("/posts/:postId/tags/:tagId",
        forumValidatorsPost.validatePostExists,
        forumValidatorsTag.validateTagExists,
        forumValidatorsTag.validatePostTagMapping,
        asyncHandler(getTagOfPostById)
);

router.post("/posts/:postId/tags",
        auth.required,
        forumValidatorsPost.validatePostExists,
        forumValidatorsTag.validatePostTags,
        asyncHandler(addTagsToPost)
);

router.delete("/posts/:postId/tags/:tagId",
        auth.required,
        forumValidatorsPost.validatePostExists,
        forumValidatorsTag.validateTagExists,
        forumValidatorsTag.validatePostTagMapping,
        forumValidatorsTag.validatePostTagUnmapping,
        asyncHandler(removeTagFromPost)
);

// ===================================================================================================================================
// ===================================================================================================================================
// Forum Activities Routes
router.get("/activities", asyncHandler(getAllActivities)); // Get all activities (admin/moderator dashboard)
router.get("/activities/user/:id", asyncHandler(getForumActivityByUser)); // Get all activities by a specific user
router.get("/activities/user/:id/type/:type", asyncHandler(getActivitiesByUserAndType)); // Get all activities by a specific user filtered by type (post, comment, like, report...)
router.get("/activities/type/:type", asyncHandler(getActivitiesByType)); // Get all activities filtered by type (post, comment, like, report...)
router.post("/activities", validateActivity, asyncHandler(createActivity)); // Create a new activity manually (optional, mainly for system auto-log)
router.delete("/activities/:activityId", asyncHandler(deleteActivityById)); // Delete an activity by activity ID (admin tools)
router.get("/activities/target/:targetType/:targetId", asyncHandler(getActivitiesByTarget)); // Get activities by target (example: all likes on a post, all comments to a post, etc.)
router.get("/activities/user/:id/count", asyncHandler(getActivityStatsByid)); // Get count statistics: how many posts, comments, likes the user has done




export default router;