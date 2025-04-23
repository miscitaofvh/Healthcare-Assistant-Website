import express from "express";
import {
  // Category
  getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory,
  // Thread
  getAllThreads, getThreadById, createThread, updateThread, deleteThread,
  // Post
  getAllPosts, getPostById, createPost, updatePost, deletePost,
  // Comment
  getCommentsByPostId, addCommentToPost, deleteCommentFromPost,
  // Tag
  getAllTags, getTagById, createTag, updateTagById, deleteTag,
  getTagsOfPost, assignTagToPost, removeTagFromPost,
  // Like
  likePost, unlikePost, getLikesOfPost,
  // Report
  reportPost, getReports, updateReportStatus,
  // Forum Overview
  getForumActivityByUser
} from "../controllers/forumController.js";

import {
  validateCategory, validateThread, validateForumPost,
  validateComment, validateTag, validateReport
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
router.put("/posts/:postId", validateForumPost, asyncHandler(updatePost));
router.delete("/posts/:postId", asyncHandler(deletePost));


// Comment Routes
router.get("/posts/:postId/comments", asyncHandler(getCommentsByPostId));
router.post("/posts/:postId/comments", validateComment, asyncHandler(addCommentToPost));
router.delete("/posts/:postId/comments/:commentId", asyncHandler(deleteCommentFromPost));

// Tag Routes
router.get("/tags", asyncHandler(getAllTags));
router.get("/tags/:tagId", asyncHandler(getTagById));
router.post("/tags", validateTag, asyncHandler(createTag));
router.put("/tags/:tagId", validateTag, asyncHandler(updateTagById));
router.delete("/tags/:tagId", asyncHandler(deleteTag));

router.get("/posts/:postId/tags", asyncHandler(getTagsOfPost));
router.post("/posts/:postId/tags/:tagId", asyncHandler(assignTagToPost));      // map
router.delete("/posts/:postId/tags/:tagId", asyncHandler(removeTagFromPost));  // unmap

// Like Routes
router.post("/posts/:postId/likes", asyncHandler(likePost));
router.delete("/posts/:postId/likes", asyncHandler(unlikePost));
router.get("/posts/:postId/likes", asyncHandler(getLikesOfPost));  // optional

// Report Routes
router.post("/posts/:postId/reports", validateReport, asyncHandler(reportPost));
router.get("/reports", asyncHandler(getReports));  // admin/moderator view
router.put("/reports/:reportId", asyncHandler(updateReportStatus)); // update status

// Forum Overview Routes
router.get("/user/:userId/activity", asyncHandler(getForumActivityByUser));

export default router;