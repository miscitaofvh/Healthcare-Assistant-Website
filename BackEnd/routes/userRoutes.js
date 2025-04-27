import express from "express";
import { authenticateUser } from '../middleware/authMiddleware.js';
import { getUserProfile, updateUserProfile, uploadUserAvatar } from "../controllers/userController.js";
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes in this file require authentication
router.use(authenticateUser);

// Get user profile
router.get('/profile', getUserProfile);

// Update user profile
router.put('/profile', updateUserProfile);

// Upload avatar to ImageKit
router.post('/upload-avatar', upload.single('profilePicture'), uploadUserAvatar);

export default router;
