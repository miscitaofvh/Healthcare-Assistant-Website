import express from "express";
import { getAllCategories, getSummaryCategories, getCategoryName, getCategoryById, getThreadsByCategory,
        getPostsByCategory, getCategoriesByUser, createCategory, updateCategory, deleteCategory 
      } from "../controllers/forum/category.js"
import { getAllThreads, getSummaryThreads, getThreadById, getThreadName, getPostsByThread, 
        getThreadsByUser, createThread, updateThread, deleteThread } from "../controllers/forum/thread.js";
import { getAllPosts, getSummaryPosts, getPostById, getPostsByUser, createPost, updatePost, deletePost } from "../controllers/forum/post.js";
import { getCommentsByPostId, getAllCommentsByUser, addCommentToPost, deleteCommentFromPost, updateCommentInPost,
        likeComment, unlikeComment, reportComment, getReportsForComment, updateReportStatusForComment
      } from "../controllers/forum/comment.js";
import { getAllTags, getTagById, getTagByName, getPostsByTag, getTagsByUser, getPopularTags,
        getTagOfPostById, getTagsOfPost, addTagsToPost, createTag, updateTagById, deleteTagById,
        removeTagFromPost } from "../controllers/forum/tag.js";
import {  likePost, unlikePost, getLikesOfPost } from "../controllers/forum/like.js";
import { getAllReports, getReportById, getReportsByUser, getReportsByPost, createReport, 
        updateReportStatus, deleteReport, getReportsByStatus, deleteReportById } from "../controllers/forum/report.js";
// import { getForumActivityByUser, getForumPostActivityByUser, getForumPostActivityByid,
//         updateForumPostActivityByid, getForumPostActivityUnmapByid, deleteForumPostActivityByid } from "../controllers/forum/activity.js";

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
  validateForumPostCommentLikeUnmap , validateForumPostCommentReport,
  // Tag
  validateTag, validatePostTag, validateForumPostTag, validateForumPostTagUnmap, 
  // Report
  validateReport, validateForumPostReportDelete
  // Forum Overview
  // validateForumActivity, validateForumPostActivity,
  // validateForumPostActivityUnmap, validateForumPostActivityDelete,
  // validateForumPostActivityUpdate
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
router.get("/users/:userId/categories", asyncHandler(getCategoriesByUser)); // Get all categories a user has interacted with
router.post("/categories", validateCategory, asyncHandler(createCategory));
router.put("/categories/:id", validateCategory, asyncHandler(updateCategory));
router.delete("/categories/:id", asyncHandler(deleteCategory));

// Thread Routes
router.get("/threads", asyncHandler(getAllThreads));
router.get("/threads/summary", asyncHandler(getSummaryThreads));
router.get("/threads/:id", asyncHandler(getThreadById));
router.get("/threads/:id/name", asyncHandler(getThreadName));
router.get("/threads/:id/posts", asyncHandler(getPostsByThread)); 
router.get("/users/:userId/threads", asyncHandler(getThreadsByUser)); 
router.post("/threads", validateThread, asyncHandler(createThread));
router.put("/threads/:id", validateThread, asyncHandler(updateThread));
router.delete("/threads/:id", asyncHandler(deleteThread));

// Post Routes
router.get("/posts", asyncHandler(getAllPosts));
router.get("/posts/summary", asyncHandler(getSummaryPosts));
router.get("/posts/:id", asyncHandler(getPostById));
router.get("/users/:userId/posts", asyncHandler(getPostsByUser));
router.post("/posts", validateForumPost, asyncHandler(createPost));
router.put("/posts/:id", validateForumPostUpdate, asyncHandler(updatePost));
router.delete("/posts/:id", validateForumPostComment, asyncHandler(deletePost));

// Comment Routes
router.get("/posts/:id/comments", asyncHandler(getCommentsByPostId));
router.get("/users/:userId/posts/comments", asyncHandler(getAllCommentsByUser));
router.post("/posts/:id/comments", validateForumPostComment, asyncHandler(addCommentToPost));
router.put("/posts/:id/comments/:id", validateForumPostComment, asyncHandler(updateCommentInPost)); // optional
router.delete("/posts/:id/comments/:id", validateForumPostCommentDelete, asyncHandler(deleteCommentFromPost));
router.post("/posts/:id/comments/:id/likes", validateForumPostCommentLike, asyncHandler(likeComment));
router.delete("/posts/:id/comments/:id/likes", validateForumPostCommentLikeUnmap, asyncHandler(unlikeComment));
router.post("/posts/:id/comments/:id/reports", validateForumPostCommentReport, asyncHandler(reportComment));
router.get("/posts/:id/comments/:id/reports", asyncHandler(getReportsForComment));
router.put("/posts/:id/comments/:id/reports/:reportId", asyncHandler(updateReportStatusForComment));

// Tag Routes
router.get("/tags", asyncHandler(getAllTags));
router.get("/tags/:tagId", asyncHandler(getTagById));
router.get("/tags/search", asyncHandler(getTagByName));
router.get("/tags/:tagId/posts", asyncHandler(getPostsByTag));
router.get("/tags/popular", asyncHandler(getPopularTags));
router.get("/users/:userId/tags", asyncHandler(getTagsByUser));
router.post("/tags", validateTag, asyncHandler(createTag));
router.put("/tags/:tagId", validateTag, asyncHandler(updateTagById));
router.delete("/tags/:tagId", asyncHandler(deleteTagById));


router.get("/posts/:id/tags", asyncHandler(getTagsOfPost));
router.get("/posts/:id/tags/:tagId", validateForumPostTag, asyncHandler(getTagOfPostById));    
router.post("/posts/:id/tags", validatePostTag, asyncHandler(addTagsToPost));
router.delete("/posts/:id/tags/:tagId", validateForumPostTagUnmap, asyncHandler(removeTagFromPost));  // unmap

// Like Routes
router.post("/posts/:id/likes", validateForumPostLike, asyncHandler(likePost));
router.delete("/posts/:id/likes", validateForumPostLikeUnmap, asyncHandler(unlikePost));
router.get("/posts/:id/likes", asyncHandler(getLikesOfPost));  // optional

// Report Routes
router.get("/reports", asyncHandler(getAllReports));  // admin/moderator view
router.get("/reports/:reportId", asyncHandler(getReportById));
router.get("/posts/:id/reports", asyncHandler(getReportsByPost));
router.post("/posts/:id/reports", validateReport, asyncHandler(createReport));
router.put("/reports/:reportId", asyncHandler(updateReportStatus)); // update status
router.delete("/posts/:id/reports", validateForumPostReportDelete, asyncHandler(deleteReport)); // delete report from post

router.get("/users/:userId/reports", asyncHandler(getReportsByUser));
router.get("/reports/status/:status", asyncHandler(getReportsByStatus));
router.delete("/reports/:reportId", asyncHandler(deleteReportById));

// Forum Overview Routes
// router.get("/user/:userId/activity", asyncHandler(getForumActivityByUser));
// router.get("/user/:userId/activity/posts", asyncHandler(getForumPostActivityByUser)); // get posts by user id
// router.get("/user/:userId/activity/posts/:id", asyncHandler(getForumPostActivityByid)); // get post by post id
// router.put("/user/:userId/activity/posts/:id", asyncHandler(updateForumPostActivityByid)); // update post by post id
// router.get("/user/:userId/activity/comments", asyncHandler(getForumCommentActivityByUser));

export default router;