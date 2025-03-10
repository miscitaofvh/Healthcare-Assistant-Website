const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db"); // Database connection
require("dotenv").config();

const register = async (req, res) => {
    const { username, email, password, full_name, dob, gender, phone_number, address } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = `INSERT INTO users (username, email, password_hash, full_name, dob, gender, phone_number, address) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        db.query(sql, [username, email, hashedPassword, full_name, dob, gender, phone_number, address], (err, result) => {
            if (err) {
                return res.status(400).json({ success: false, error: err.message });
            }
            res.status(201).json({ success: true, message: "User registered successfully", userId: result.insertId });
        });
    } catch (err) {
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

const login = async (req, res) => {
    console.log("Received login request:", req.body);

    const { email, username, password } = req.body;
    const loginField = email || username;

    if (!loginField || !password) {
        return res.status(400).json({ success: false, error: "Email/Username and password are required" });
    }

    try {
        // Select based on whether an email or username is provided
        const sql = email 
            ? `SELECT * FROM users WHERE email = ? LIMIT 1`
            : `SELECT * FROM users WHERE username = ? LIMIT 1`;

        const queryStartTime = Date.now();

        db.query(sql, [loginField], async (err, results) => {
            console.log(`⏳ Query Execution Time: ${Date.now() - queryStartTime} ms`);

            if (err) {
                console.error("❌ Database error:", err);
                return res.status(500).json({ success: false, error: "Internal server error" });
            }

            if (results.length === 0) {
                console.log("🔍 User not found");
                return res.status(400).json({ success: false, error: "User not found" });
            }

            const user = results[0];
            console.log("✅ User found:", user);

            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                console.log("❌ Invalid credentials: Incorrect password");
                return res.status(400).json({ success: false, error: "Invalid credentials" });
            }

            const token = jwt.sign(
                { id: user.user_id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            console.log("✅ Login successful! Token generated.");

            return res.json({
                success: true,
                token,
                user: { id: user.user_id, username: user.username, email: user.email, role: user.role },
            });
        });
    } catch (err) {
        console.error("❌ Unexpected login error:", err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};


module.exports = { register, login };
