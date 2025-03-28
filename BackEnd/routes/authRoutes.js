import express from "express";
import { register, login } from "../controllers/authController.js";
import { validateRegister, validateLogin } from "../middleware/validationMiddleware.js";
import { getAuthenticatedUser } from '../controllers/authController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
// import { authenticateToken } from "../middleware/authMiddleware.js";
// import { logout, refreshToken } from "../controllers/authController.js";
const router = express.Router();

// Public routes
router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.get('/me', authenticateUser, getAuthenticatedUser);

// router.post("/logout", authenticateToken, logout);
// router.post("/refresh-token", refreshToken);

// Error handling middleware
router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: "An error occurred, please try again later.",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
});

export default router;