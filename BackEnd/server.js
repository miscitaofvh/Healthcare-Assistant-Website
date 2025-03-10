const express = require("express");
const cors = require("cors");
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const newsRoutes = require('./routes/newsRoutes');
const forumRoutes = require('./routes/forumRoutes');
const chatRoutes = require('./routes/chatRoutes');
const accountRoutes = require('./routes/accountRoutes');
const { errorHandler } = require('./middleware/errorHandler');

dotenv.config();
const app = express();

// Middleware
app.use(express.json());

app.use(cors()); 
app.use(express.json());


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/forum', forumRoutes);
// app.use('/api/chat', chatRoutes);
app.use('/api/account', accountRoutes);

// Error handling middleware
// app.use(errorHandler);


app.post("/api/login", (req, res) => {
    console.log("Received login request:", req.body); 
    const { username, password } = req.body;
    if (username === "miscitaofvh" && password === "ngvanhung.sun") {
        console.log("Received login request:", username); 
        res.json({ message: "Login successful", token: "abcdef" , success: true});
    } else {
        res.status(401).json({ message: "Invalid credentials" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
