const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.getUser = async (req, res) => {
    const { id } = req.params;
    try {
        const [present_user] = await db.query("SELECT id, username, email FROM users WHERE id = ?", [id]);
        if (!present_user) return res.status(404).json({ message: "User not found" });
        res.json(present_user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.registerUser = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", [username, email, hashedPassword]);
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [present_user] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (!present_user) return res.status(400).json({ message: "User not found" });

        const isValid = await bcrypt.compare(password, present_user.password);
        if (!isValid) return res.status(400).json({ message: "Invalid credentials" });

        res.json({ message: "Login successful", userId: present_user.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
