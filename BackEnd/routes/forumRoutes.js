import express from "express";
import {
        getAllCategories, getSummaryCategories, getCategoryByName, getCategoryById, getThreadsByCategory,
        getThreadsSummaryByCategory, getPostsByCategory, getCategoriesByUser, createCategory, updateCategory, deleteCategory
} from "../controllers/forum/category.js"
import {
        getAllThreads, getSummaryThreads, getThreadById, getThreadName, getPostsByThread,
        getThreadsByUser, createThread, updateThread, deleteThread
} from "../controllers/forum/thread.js";
import { getAllPosts, getSummaryPosts, getPostById, getPostsByUser, createPost, updatePost, deletePost } from "../controllers/forum/post.js";
import {
        getCommentsByPostId, getCommentReplies, getAllCommentsByUser, addCommentToPost, addReplyToComment,
        updateComment, deleteComment,
        reportComment, getReportsForComment, updateReportStatusForComment
} from "../controllers/forum/comment.js";
import {
        getAllTags, getSummaryTags, getSummaryLittleTags, getSummaryTagById, getTagById, getTagByName, getPostsByTag, getTagsByUser, getPopularTags,
        getTagOfPostById, getTagsForPost, addTagsToPost, createTag, updateTagById, deleteTagById,
        removeTagFromPost
} from "../controllers/forum/tag.js";
import { likePost, unlikePost, getLikesOfPost, likeComment, unlikeComment } from "../controllers/forum/like.js";
import {
        getAllReports, getReportById, getReportsByUser, getReportsByPost, createReport,
        updateReport, deleteReport, getReportsByStatus, deleteReportById
} from "../controllers/forum/report.js";
import {
        getAllActivities, getForumActivityByUser, getActivitiesByUserAndType, getActivitiesByType,
        createActivity, deleteActivityById, getActivitiesByTarget, getActivityStatsByid
} from "../controllers/forum/activity.js";

import { uploadImage } from "../controllers/forum/uploadImage.js";
import { validateCategory } from "../middleware/validation/Forum/category.js";
import { validateThread } from "../middleware/validation/Forum/thread.js";
import { validateForumPost, validateForumPostUpdate, validateForumPostDelete } from "../middleware/validation/Forum/post.js";
import { validateForumPostLike, validateForumPostLikeUnmap, validateForumPostCommentLike, validateForumPostCommentLikeUnmap } from "../middleware/validation/Forum/like.js";
import { validatecommentPost, validatereplyComment, validateupdateComment, 
        validateComment, validateForumPostCommentDelete, validateForumPostCommentReport } from "../middleware/validation/Forum/comment.js";
import { validateTag, validatePostTag, validateForumPostTag, validateForumPostTagUnmap } from "../middleware/validation/Forum/tag.js";
import { validateReportPost, validateReportComment, validateForumPostReportDelete, validateReportUpdate } from "../middleware/validation/Forum/report.js";
import { validateActivity } from "../middleware/validation/Forum/activity.js";


import { paginate } from "../middleware/paginate.js";
import { auth } from "../security/authMiddleware.js";
import multer from 'multer';
import { commentLimiter, likeLimiter, reportLimiter } from "../security/rateLimit.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const asyncHandler = (fn) => (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
};

// Upload image
router.post('/upload-image', upload.single('forumImage'), uploadImage);

// Category Routes
router.get("/categories", asyncHandler(getAllCategories)); // get all information in categories table
router.get("/categories/summary", asyncHandler(getSummaryCategories)); // get all categories with id and name
router.get("/categories/name/:name", asyncHandler(getCategoryByName));
router.get("/categories/:id/threads", asyncHandler(getThreadsByCategory)); // Get all threads in a category
router.get("/categories/:id/threads/summary", asyncHandler(getThreadsSummaryByCategory)); // Get all threads in a category
router.get("/categories/:id/posts", asyncHandler(getPostsByCategory)); // Get all posts in a category
router.get("/categories/:id", asyncHandler(getCategoryById));
router.get("/users/:username/categories", asyncHandler(getCategoriesByUser)); // Get all categories a user has interacted with
router.post("/categories", validateCategory, asyncHandler(createCategory));
router.put("/categories/:id", validateCategory, asyncHandler(updateCategory));
router.delete("/categories/:id", asyncHandler(deleteCategory));

// Thread Routes
router.get("/threads", asyncHandler(getAllThreads));
router.get("/threads/summary", asyncHandler(getSummaryThreads));
router.get("/threads/:id", asyncHandler(getThreadById));
router.get("/threads/:id/name", asyncHandler(getThreadName));
router.get("/threads/:id/posts", asyncHandler(getPostsByThread));
router.get("/users/:id/threads", asyncHandler(getThreadsByUser));
router.post("/threads", validateThread, asyncHandler(createThread));
router.put("/threads/:id", validateThread, asyncHandler(updateThread));
router.delete("/threads/:id", asyncHandler(deleteThread));

// Post Routes
router.get("/posts", asyncHandler(getAllPosts));
router.get("/posts/summary", asyncHandler(getSummaryPosts));
router.get("/posts/:id", asyncHandler(getPostById));
router.get("/users/:username/posts", asyncHandler(getPostsByUser));
router.post("/posts", validateForumPost, asyncHandler(createPost));
router.put("/posts/:postId", validateForumPostUpdate, asyncHandler(updatePost));
router.delete("/posts/:postId", validateForumPostDelete, asyncHandler(deletePost));

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
        validatecommentPost,
        asyncHandler(addCommentToPost)
);

router.post("/comments/:commentId/replies",
        auth.required,
        commentLimiter,
        validatereplyComment,
        asyncHandler(addReplyToComment)
);

router.put("/comments/:commentId",
        auth.required,
        validateupdateComment,
        auth.requireOwnerOrAdmin("comment"),
        asyncHandler(updateComment)
);

router.delete("/comments/:commentId",
        auth.required,
        validateComment,
        auth.requireOwnerOrAdmin("comment"),
        asyncHandler(deleteComment)
);

router.post("/comments/:commentId/likes",
        auth.required,
        validateComment,
        likeLimiter, 
        asyncHandler(likeComment)
);

router.delete("/comments/:commentId/likes",
        auth.required,
        validateComment,
        asyncHandler(unlikeComment)
);

router.post("/comments/:commentId/reports",
        auth.required,
        reportLimiter,
        validateReportComment,
        asyncHandler(reportComment)
);

router.put("/reports/:reportId",
        auth.required,
        validateReportUpdate,
        auth.requireOwnerOrAdmin("report"),
        asyncHandler(updateReport)
);

// ===================================================================================================================================
// Tag Routes
router.get("/tags", asyncHandler(getAllTags));
router.get("/tags/summary", asyncHandler(getSummaryTags));
router.get("/tags/summary/little", asyncHandler(getSummaryLittleTags));
router.get("/tags/summary/:id", asyncHandler(getSummaryTagById));
router.get("/tags/popular", asyncHandler(getPopularTags));
router.get("/tags/:id", asyncHandler(getTagById));
router.get("/tags/search", asyncHandler(getTagByName));
router.get("/tags/:id/posts", asyncHandler(getPostsByTag));
router.get("/users/:id/tags", asyncHandler(getTagsByUser));
router.post("/tags", validateTag, asyncHandler(createTag));
router.put("/tags/:id", validateTag, asyncHandler(updateTagById));
router.delete("/tags/:id", asyncHandler(deleteTagById));


router.get("/posts/:id/tags", asyncHandler(getTagsForPost));
router.get("/posts/:id/tags/:id", validateForumPostTag, asyncHandler(getTagOfPostById));
router.post("/posts/:id/tags", validatePostTag, asyncHandler(addTagsToPost));
router.delete("/posts/:id/tags/:id", validateForumPostTagUnmap, asyncHandler(removeTagFromPost));  // unmap

// Like Routes
router.post("/posts/:postId/likes", validateForumPostLike, asyncHandler(likePost));
router.delete("/posts/:postId/likes", validateForumPostLikeUnmap, asyncHandler(unlikePost));
router.get("/posts/:id/likes", asyncHandler(getLikesOfPost));  // optional

// Report Routes
router.get("/reports", asyncHandler(getAllReports));  // admin/moderator view
router.get("/reports/:id", asyncHandler(getReportById));
router.get("/posts/:id/reports", asyncHandler(getReportsByPost));
router.post("/posts/:postId/reports", validateReportPost, asyncHandler(createReport));
router.put("/reports/:id", asyncHandler(updateReport)); // update status
router.delete("/posts/:id/reports", validateForumPostReportDelete, asyncHandler(deleteReport)); // delete report from post

router.get("/users/:id/reports", asyncHandler(getReportsByUser));
router.get("/reports/status/:status", asyncHandler(getReportsByStatus));
router.delete("/reports/:id", asyncHandler(deleteReportById));

// Forum Activities Routes
router.get("/activities", asyncHandler(getAllActivities)); // Get all activities (admin/moderator dashboard)
router.get("/activities/user/:id", asyncHandler(getForumActivityByUser)); // Get all activities by a specific user
router.get("/activities/user/:id/type/:type", asyncHandler(getActivitiesByUserAndType)); // Get all activities by a specific user filtered by type (post, comment, like, report...)
router.get("/activities/type/:type", asyncHandler(getActivitiesByType)); // Get all activities filtered by type (post, comment, like, report...)
router.post("/activities", validateActivity, asyncHandler(createActivity)); // Create a new activity manually (optional, mainly for system auto-log)
router.delete("/activities/:activityId", asyncHandler(deleteActivityById)); // Delete an activity by activity ID (admin tools)
router.get("/activities/target/:targetType/:targetId", asyncHandler(getActivitiesByTarget)); // Get activities by target (example: all likes on a post, all comments to a post, etc.)
router.get("/activities/user/:id/count", asyncHandler(getActivityStatsByid)); // Get count statistics: how many posts, comments, likes the user has done

// Admin / moderator 

router.get("/comments/:commentId/reports",
        auth.requireModerator,
        asyncHandler(getReportsForComment));

export default router;