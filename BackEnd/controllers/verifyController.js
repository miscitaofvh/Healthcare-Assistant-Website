import sendEmail from "../utils/emailSender.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import getRedisClient from "../utils/redisClient.js";
import db from "../config/connection.js";

dotenv.config();

export const verifyPending = async (req, res) => {
    console.log("📨 Received verify pending request:", req.body);
    const redisClient = await getRedisClient();
    const { email, type } = req.body;

    if (!type || !["register", "reset_password"].includes(type)) {
        return res.status(400).json({ success: false, message: "Invalid request type" });
    }

    const cooldownKey = `email_cooldown:${email}`;
    const tokenKey = `email_token:${email}:${type}`; // Include type in token key
    const lastSentTime = await redisClient.get(cooldownKey);

    if (lastSentTime) {
        return res.status(429).json({ success: false, message: "Please wait before requesting another email!" });
    }

    let token = await redisClient.get(tokenKey);
    if (!token) {
        token = jwt.sign({ email, type }, process.env.JWT_SECRET, { expiresIn: "1h" });
        await redisClient.setEx(tokenKey, 3600, token);
    }

    await redisClient.setEx(cooldownKey, 60, Date.now().toString());
    
    const verificationLink = `http://localhost:5173/verify?token=${token}&type=${type}`;
    const emailSubject = type === "register" 
        ? "⚕️ Confirm Your Email - HealthCare Service" 
        : "⚕️ Reset Your Password - HealthCare Service";
    const emailContent = type === "register"
        ? `<div>Click <a href="${verificationLink}">here</a> to verify your email</div>`
        : `<div>Click <a href="${verificationLink}">here</a> to reset your password</div>`;

    try {
        await sendEmail(email, emailSubject, emailContent);
        return res.json({ success: true, message: "Email sent successfully!" });
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { email, type } = decoded;

        // Accept both register and reset_password types
        if (!["register", "reset_password"].includes(type)) {
            console.log("❌ Invalid token type");
            res.clearCookie("pendingEmail");
            return res.status(400).json({ success: false, error: "Invalid token type" });
        }

        return res.status(200).json({ success: true, email, type });
    } catch (error) {
        console.error("❌ Invalid or expired token:", error);
        res.clearCookie("pendingEmail");
        return res.status(400).json({ success: false, error: "Invalid or expired token" });
    }
};

export const verifyEmail = async (req, res) => {
    const redisClient = await getRedisClient();
    const { token } = req.query;

    console.log("📨 Received email verification request with token:", token);
    if (!token) {
        console.log("❌ Token is required");
        return res.status(400).json({ success: false, message: "Token is required" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { email, type: tokenType } = decoded;

        // Check token in Redis
        const cachedToken = await redisClient.get(`email_token:${email}:${tokenType}`);
        if (!cachedToken || cachedToken !== token) {
            console.log("❌ Invalid or expired token");
            return res.status(400).json({ success: false, message: "Invalid or expired token" });
        }

        if (tokenType === "register") {
            // Handle registration verification
            const connection = await db.getConnection();
            try {
                await connection.beginTransaction();
                const updateSql = 'UPDATE users SET verified_at = NOW() WHERE email = ?';
                const [result] = await connection.execute(updateSql, [email]);

                if (result.affectedRows === 0) {
                    throw new Error("User not found or already verified");
                }
                await connection.commit();
            } catch (err) {
                console.error("❌ Database error:", err);
                await connection.rollback();
                return res.status(500).json({ success: false, message: "Internal server error" });
            } finally {
                connection.release();
            }
        } else if (tokenType === "reset_password") {
            // Handle password reset - nothing to do here except token validation
            // The actual password reset will be handled in a separate endpoint
        }

        // Clean up Redis
        await redisClient.del(`email_token:${email}:${tokenType}`);
        await redisClient.del(`email_cooldown:${email}`);

        return res.json({ 
            success: true, 
            message: tokenType === "register" 
                ? "Email verified successfully!" 
                : "You can now reset your password"
        });
    } catch (error) {
        console.error("❌ Verification error:", error);
        return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }
};