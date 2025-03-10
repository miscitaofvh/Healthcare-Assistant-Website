const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.getUsers = async (req, res) => {
    try {
        const [users] = await db.query("SELECT id, username, email FROM users");
        res.json(users);
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
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (users.length === 0) return res.status(400).json({ message: "User not found" });

        const isValid = await bcrypt.compare(password, users[0].password);
        if (!isValid) return res.status(400).json({ message: "Invalid credentials" });

        res.json({ message: "Login successful", userId: users[0].id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
