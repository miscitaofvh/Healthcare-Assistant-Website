const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Import routes
const authRoutes = require("./routes/authRoutes");
const newsRoutes = require("./routes/newsRoutes");
const forumRoutes = require("./routes/forumRoutes");
const verifyRoutes = require("./routes/verifyRoutes");
const chatRoutes = require("./routes/chatRoutes");
const accountRoutes = require("./routes/accountRoutes");

// Import middleware
const { errorHandler } = require("./middleware/errorHandler.js");

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
app.use("/api/chat", chatRoutes);

// Error handling middleware (should be last)
// app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// https.createServer(options, app).listen(PORT, () => {
//     console.log(`🚀 HTTPS Server running on port ${PORT}`);
// });

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));