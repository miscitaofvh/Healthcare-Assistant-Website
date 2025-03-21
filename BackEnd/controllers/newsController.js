import db from '../config/db.js';

export const getNews = async (req, res) => {
    try {
        const [news] = await db.query("SELECT n.id, n.title, n.content, u.username AS author FROM news n JOIN users u ON n.author_id = u.id");
        res.json(news);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createNews = async (req, res) => {
    const { title, content, author_id } = req.body;
    try {
        await db.query("INSERT INTO news (title, content, author_id) VALUES (?, ?, ?)", [title, content, author_id]);
        res.status(201).json({ message: "News added successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
