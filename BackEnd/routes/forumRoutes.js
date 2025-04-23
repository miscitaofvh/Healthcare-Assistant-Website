import express from "express";
import { 
  getPosts, 
  getPostById, 
  createPost, 
  updatePost, 
  deletePost, 
  getComments, 
  createComment, 
  deleteComment,
  getTags,
  getTagById,
  updateTag,
  getTagsofForumPost
} from "../controllers/forumController.js";
import { validateForumPost } from "../middleware/validationMiddleware.js";

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};


// Forum Posts
router.get("/posts", asyncHandler(getPosts)); // Get all posts
router.get("/posts/:id", asyncHandler(getPostById)); // Get a single post by ID
router.post("/posts", validateForumPost, asyncHandler(createPost)); // Create a new post
router.put("/posts/:id", asyncHandler(updatePost)); // Update a post
router.delete("/posts/:id", asyncHandler(deletePost)); // Delete a post
// Comments for Posts
router.get("/posts/:id/comments", asyncHandler(getComments)); // Get comments for a post
router.post("/posts/:id/comments", asyncHandler(createComment)); // Add a comment to a post
router.delete("/posts/:id/comments/:commentId", asyncHandler(deleteComment)); // Delete a comment
router.get("/posts/:id/tags", asyncHandler(getTagsofForumPost));

router.get("/tags", asyncHandler(getTags));
router.get("/tags/:id", asyncHandler(getTagById));
router.post("/tags/:id", asyncHandler(updateTag));
export default router;