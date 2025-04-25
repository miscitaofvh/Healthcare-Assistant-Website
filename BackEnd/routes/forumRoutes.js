import express from "express";
import {
  // Category
  getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory,
  // Thread
  getAllThreads, getThreadById, createThread, updateThread, deleteThread,
  // Post
  getAllPosts, getPostById, createPost, updatePost, deletePost,
  // Comment
  getCommentsByPostId, addCommentToPost, deleteCommentFromPost, updateCommentInPost, 
  // Tag
  getAllTags, getTagById, createTag, updateTagById, deleteTag,
  getTagsOfPost, assignTagToPost, removeTagFromPost,
  // Like
  likePost, unlikePost, getLikesOfPost,
  // Report
  reportPost, getReports, updateReportStatus, deleteReportFromPost, getReportsByPostId,
  // Forum Overview
  getForumActivityByUser, getForumPostActivityByUser, getForumPostActivityByPostId,
  updateForumPostActivityByPostId, getForumPostActivityUnmapByPostId, deleteForumPostActivityByPostId
} from "../controllers/forumController.js";

import {
  // Category
  validateCategory,
  // Thread
  validateThread,
  // Post
  validateForumPost, validateForumPostUpdate, 
  // Like
  validateForumPostLikeUser, validateForumPostLike, validateForumPostLikeUnmap,
  // Comment
  validateComment, validateForumPostComment, validateForumPostCommentDelete,
  // Tag
  validateTag, validateTagAndCategory, validateForumPostTag, validateForumPostTagUnmap, 
  // Report
  validateReport, validateReportStatus, validateForumPostReport, 
  validateForumPostReportUnmap, validateForumPostReportDelete,
  // Forum Overview
  validateForumActivity, validateForumPostActivity,
  validateForumPostActivityUnmap, validateForumPostActivityDelete,
  validateForumPostActivityUpdate
} from "../middleware/validation/forum.js";

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Category Routes
router.get("/categories", asyncHandler(getAllCategories));
router.get("/categories/:categoryId", asyncHandler(getCategoryById));
router.post("/categories", validateCategory, asyncHandler(createCategory));
router.put("/categories/:categoryId", validateCategory, asyncHandler(updateCategory));
router.delete("/categories/:categoryId", asyncHandler(deleteCategory));

// Thread Routes
router.get("/threads", asyncHandler(getAllThreads));
router.get("/threads/:threadId", asyncHandler(getThreadById));
router.post("/threads", validateThread, asyncHandler(createThread));
router.put("/threads/:threadId", validateThread, asyncHandler(updateThread));
router.delete("/threads/:threadId", asyncHandler(deleteThread));

// Post Routes
router.get("/posts", asyncHandler(getAllPosts));
router.get("/posts/:postId", asyncHandler(getPostById));
router.post("/posts", validateForumPost, asyncHandler(createPost));
router.put("/posts/:postId", validateForumPostUpdate, asyncHandler(updatePost));
router.delete("/posts/:postId", validateForumPostComment, asyncHandler(deletePost));

// Comment Routes
router.get("/posts/:postId/comments", asyncHandler(getCommentsByPostId));
router.post("/posts/:postId/comments", validateForumPostComment, asyncHandler(addCommentToPost));
router.put("/posts/:postId/comments/:commentId", validateForumPostComment, asyncHandler(updateCommentInPost)); // optional
router.delete("/posts/:postId/comments/:commentId", validateForumPostCommentDelete, asyncHandler(deleteCommentFromPost));

// Tag Routes
router.get("/tags", asyncHandler(getAllTags));
router.get("/tags/:tagId", asyncHandler(getTagById));
router.post("/tags", validateTag, asyncHandler(createTag));
router.put("/tags/:tagId", validateTag, asyncHandler(updateTagById));
router.delete("/tags/:tagId", asyncHandler(deleteTag));

router.get("/posts/:postId/tags", asyncHandler(getTagsOfPost));
router.post("/posts/:postId/tags/:tagId", validateForumPostTag, asyncHandler(assignTagToPost));      // map
router.delete("/posts/:postId/tags/:tagId", validateForumPostTagUnmap, asyncHandler(removeTagFromPost));  // unmap

// Like Routes
router.post("/posts/:postId/likes", validateForumPostLike, asyncHandler(likePost));
router.delete("/posts/:postId/likes", validateForumPostLikeUnmap, asyncHandler(unlikePost));
router.get("/posts/:postId/likes", asyncHandler(getLikesOfPost));  // optional

// Report Routes
router.post("/posts/:postId/reports", validateReport, asyncHandler(reportPost));
router.get("/reports", asyncHandler(getReports));  // admin/moderator view
router.put("/reports/:reportId", asyncHandler(updateReportStatus)); // update status
router.delete("/posts/:postId/reports", validateForumPostReportDelete, asyncHandler(deleteReportFromPost)); // delete report from post
router.get("/posts/:postId/reports", asyncHandler(getReportsByPostId)); // get reports by post id

// Forum Overview Routes
router.get("/user/:userId/activity", asyncHandler(getForumActivityByUser));
router.get("/user/:userId/activity/posts", asyncHandler(getForumPostActivityByUser)); // get posts by user id
router.get("/user/:userId/activity/posts/:postId", asyncHandler(getForumPostActivityByPostId)); // get post by post id
router.put("/user/:userId/activity/posts/:postId", asyncHandler(updateForumPostActivityByPostId)); // update post by post id


export default router;