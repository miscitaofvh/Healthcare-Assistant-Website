import express from "express";
import { 
  getPosts, 
  getPostById, 
  createPost, 
  updatePost, 
  deletePost, 
  getComments, 
  createComment, 
  deleteComment 
} from "../controllers/forumController.js";

const router = express.Router();

// Forum Posts
router.get("/posts", getPosts); // Get all posts
router.get("/posts/:id", getPostById); // Get a single post by ID
router.post("/posts", createPost); // Create a new post
router.put("/posts/:id", updatePost); // Update a post
router.delete("/posts/:id", deletePost); // Delete a post

// Comments for Posts
router.get("/posts/:id/comments", getComments); // Get comments for a post
router.post("/posts/:id/comments", createComment); // Add a comment to a post
router.delete("/posts/:id/comments/:commentId", deleteComment); // Delete a comment

export default router;