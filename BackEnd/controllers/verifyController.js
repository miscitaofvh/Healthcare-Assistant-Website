import sendEmail from "../utils/emailSender.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import getRedisClient from "../utils/redisClient.js";

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
    const verificationLink = `http://localhost:3000/verify?token=${token}`;

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