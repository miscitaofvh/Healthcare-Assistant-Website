import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import createRedisClient from "./utils/redisClient.js"; 
import authRoutes from "./routes/authRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import forumRoutes from "./routes/forumRoutes.js";
import verifyRoutes from "./routes/verifyPendingRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import errorHandler from "./middleware/errorHandler.js"; 

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/", verifyRoutes);

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
