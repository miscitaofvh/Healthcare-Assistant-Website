import sendEmail from "../utils/emailSender.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import getRedisClient from "../utils/redisClient.js";
import db from "../config/db.js";

dotenv.config();

export const verifyPending = async (req, res) => {
    const redisClient = await getRedisClient();
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }

    const cooldownKey = `email_cooldown:${email}`;
    const tokenKey = `email_token:${email}`;
    const lastSentTime = await redisClient.get(cooldownKey);

    if (lastSentTime) {
        return res.status(429).json({ success: false, message: "Please wait!" });
    }

    let token = await redisClient.get(tokenKey);
    if (!token) {
        token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });
        await redisClient.setEx(tokenKey, 3600, token);
    }

    await redisClient.setEx(cooldownKey, 60, Date.now().toString());
    const verificationLink = `http://localhost:5173/verify?token=${token}`;

    try {
        await sendEmail(
            email,
            "⚕️ Confirm Your Email - HealthCare Service",
            `<div>Click <a href="${verificationLink}">here</a> to verify your email</div>`
        );
        return res.json({ success: true, message: "Verification email sent!" });
    } catch (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ success: false, message: "Failed to send email" });
    }
};

export const getPendingEmail = (req, res) => {
    const token = req.cookies?.pendingEmail;
    if (!token) {
        console.log("No pending email found");
        return res.status(400).json({ success: false, error: "No pending email found" });
    }
    try {
        const decoded = jwt.verify(token, process.env.EMAIL_SECRET);
        return res.status(200).json({ success: true, email: decoded.email });
    } catch (error) {
        return res.status(400).json({ success: false, error: "Invalid token" });
    }
};

export const verifyEmail = async (req, res) => {
    const redisClient = await getRedisClient();
    const { token } = req.query;

    if (!token) {
        console.log("❌ Token is required");
        return res.status(400).json({ success: false, message: "Token is required" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { email } = decoded;

        const cachedToken = await redisClient.get(`email_token:${email}`);
        if (!cachedToken || cachedToken !== token) {
            console.log("❌ Invalid or expired token"); 
            return res.status(400).json({ success: false, message: "Invalid or expired token" });
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            
            const updateSql = 'UPDATE users SET verified_at = NOW() WHERE email = ?';
            await connection.execute(updateSql, [email]);

            await connection.commit();
            connection.release();
        } catch (err) {
            console.log("❌ Verification error in databases:", err);
            if (connection) {
                await connection.rollback();
                connection.release();
            }
            return res.status(500).json({ success: false, message: "Internal server error" });
        }

        await redisClient.del(`email_token:${email}`);
        await redisClient.del(`email_cooldown:${email}`);

        return res.json({ success: true, message: "Email verified successfully!" });
    } catch (error) {
        console.error("Verification error:", error);
        return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }
};