const db = require('../config/db');

exports.getPosts = async (req, res) => {
    try {
        const [posts] = await db.query("SELECT p.id, p.title, p.content, u.username AS author FROM forum_posts p JOIN users u ON p.user_id = u.id");
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createPost = async (req, res) => {
    const { title, content, user_id } = req.body;
    try {
        await db.query("INSERT INTO forum_posts (title, content, user_id) VALUES (?, ?, ?)", [title, content, user_id]);
        res.status(201).json({ message: "Forum post added successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
