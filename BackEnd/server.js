import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import getRedisClient from "./utils/redisClient.js";
import authRoutes from "./routes/authRoutes.js";
import articleRoutes from "./routes/articleRoutes.js";
import forumRoutes from "./routes/forumRoutes.js";
import verifyRoutes from "./routes/verifyRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import errorHandler from "./middleware/errorHandler.js"; 

dotenv.config();
const app = express();

app.use(cookieParser());
(async () => {
    try {
        await getRedisClient();
        console.log("✅ Redis is ready");
    } catch (error) {
        console.error("❌ Failed to connect to Redis:", error);
        process.exit(1);
    }
})();

// Middleware
app.use(express.json());

app.use(
    cors({
        origin: "http://localhost:5173", 
        credentials: true,
    })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/article", articleRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/verify", verifyRoutes);
// app.get('/profile', authenticateUser, async (req, res) => {
//     const user = await getUserById(req.user.user_id);
//     res.json({ success: true, user });
// });
// Error handling middleware
app.use(errorHandler);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
