import express from "express";
import {
        getAllCategories, getSummaryCategories, getCategoryName, getCategoryById, getThreadsByCategory,
        getPostsByCategory, getCategoriesByUser, createCategory, updateCategory, deleteCategory
} from "../controllers/forum/category.js"
import {
        getAllThreads, getSummaryThreads, getThreadById, getThreadName, getPostsByThread,
        getThreadsByUser, createThread, updateThread, deleteThread
} from "../controllers/forum/thread.js";
import { getAllPosts, getSummaryPosts, getPostById, getPostsByUser, createPost, updatePost, deletePost } from "../controllers/forum/post.js";
import {
        getCommentsByPostId, getAllCommentsByUser, addCommentToPost, deleteCommentFromPost, updateCommentInPost,
        likeComment, unlikeComment, reportComment, getReportsForComment, updateReportStatusForComment
} from "../controllers/forum/comment.js";
import {
        getAllTags, getTagById, getTagByName, getPostsByTag, getTagsByUser, getPopularTags,
        getTagOfPostById, getTagsOfPost, addTagsToPost, createTag, updateTagById, deleteTagById,
        removeTagFromPost
} from "../controllers/forum/tag.js";
import { likePost, unlikePost, getLikesOfPost } from "../controllers/forum/like.js";
import {
        getAllReports, getReportById, getReportsByUser, getReportsByPost, createReport,
        updateReportStatus, deleteReport, getReportsByStatus, deleteReportById
} from "../controllers/forum/report.js";
import {
        getAllActivities, getForumActivityByUser, getActivitiesByUserAndType, getActivitiesByType,
        createActivity, deleteActivityById, getActivitiesByTarget, getActivityStatsByid
} from "../controllers/forum/activity.js";

import {
        // Category
        validateCategory,
        // Thread
        validateThread,
        // Post
        validateForumPost, validateForumPostUpdate,
        // Like
        validateForumPostLike, validateForumPostLikeUnmap,
        // Comment
        validateForumPostComment, validateForumPostCommentDelete, validateForumPostCommentLike,
        validateForumPostCommentLikeUnmap, validateForumPostCommentReport,
        // Tag
        validateTag, validatePostTag, validateForumPostTag, validateForumPostTagUnmap,
        // Report
        validateReport, validateForumPostReportDelete,
        // Forum Activity
        validateActivity
} from "../middleware/validation/forum.js";

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
};

// Category Routes
router.get("/categories", asyncHandler(getAllCategories)); // get all information in categories table
router.get("/categories/summary", asyncHandler(getSummaryCategories)); // get all categories with id and name
router.get("/categories/:id/name", asyncHandler(getCategoryName)); // get name of categories by id
router.get("/categories/:id", asyncHandler(getCategoryById));
router.get("/categories/:id/threads", asyncHandler(getThreadsByCategory)); // Get all threads in a category
router.get("/categories/:id/posts", asyncHandler(getPostsByCategory)); // Get all posts in a category
router.get("/users/:id/categories", asyncHandler(getCategoriesByUser)); // Get all categories a user has interacted with
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
router.get("/users/:id/posts", asyncHandler(getPostsByUser));
router.post("/posts", validateForumPost, asyncHandler(createPost));
router.put("/posts/:id", validateForumPostUpdate, asyncHandler(updatePost));
router.delete("/posts/:id", validateForumPostComment, asyncHandler(deletePost));

// Comment Routes
router.get("/posts/:id/comments", asyncHandler(getCommentsByPostId));
router.get("/users/:id/posts/comments", asyncHandler(getAllCommentsByUser));
router.post("/posts/:id/comments", validateForumPostComment, asyncHandler(addCommentToPost));
router.put("/posts/:id/comments/:id", validateForumPostComment, asyncHandler(updateCommentInPost)); // optional
router.delete("/posts/:id/comments/:id", validateForumPostCommentDelete, asyncHandler(deleteCommentFromPost));
router.post("/posts/:id/comments/:id/likes", validateForumPostCommentLike, asyncHandler(likeComment));
router.delete("/posts/:id/comments/:id/likes", validateForumPostCommentLikeUnmap, asyncHandler(unlikeComment));
router.post("/posts/:id/comments/:id/reports", validateForumPostCommentReport, asyncHandler(reportComment));
router.get("/posts/:id/comments/:id/reports", asyncHandler(getReportsForComment));
router.put("/posts/:id/comments/:id/reports/:id", asyncHandler(updateReportStatusForComment));

// Tag Routes
router.get("/tags", asyncHandler(getAllTags));
router.get("/tags/:id", asyncHandler(getTagById));
router.get("/tags/search", asyncHandler(getTagByName));
router.get("/tags/:id/posts", asyncHandler(getPostsByTag));
router.get("/tags/popular", asyncHandler(getPopularTags));
router.get("/users/:id/tags", asyncHandler(getTagsByUser));
router.post("/tags", validateTag, asyncHandler(createTag));
router.put("/tags/:id", validateTag, asyncHandler(updateTagById));
router.delete("/tags/:id", asyncHandler(deleteTagById));


router.get("/posts/:id/tags", asyncHandler(getTagsOfPost));
router.get("/posts/:id/tags/:id", validateForumPostTag, asyncHandler(getTagOfPostById));
router.post("/posts/:id/tags", validatePostTag, asyncHandler(addTagsToPost));
router.delete("/posts/:id/tags/:id", validateForumPostTagUnmap, asyncHandler(removeTagFromPost));  // unmap

// Like Routes
router.post("/posts/:id/likes", validateForumPostLike, asyncHandler(likePost));
router.delete("/posts/:id/likes", validateForumPostLikeUnmap, asyncHandler(unlikePost));
router.get("/posts/:id/likes", asyncHandler(getLikesOfPost));  // optional

// Report Routes
router.get("/reports", asyncHandler(getAllReports));  // admin/moderator view
router.get("/reports/:id", asyncHandler(getReportById));
router.get("/posts/:id/reports", asyncHandler(getReportsByPost));
router.post("/posts/:id/reports", validateReport, asyncHandler(createReport));
router.put("/reports/:id", asyncHandler(updateReportStatus)); // update status
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

export default router;