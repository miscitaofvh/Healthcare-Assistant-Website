import sendEmail from "../utils/emailSender.js";
import createRedisClient from "../utils/redisClient.js";
import jwt from "jsonwebtoken";

const redisClientPromise = createRedisClient();

const verify = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }
    
    const redisClient = await redisClientPromise;
    const cooldownKey = `email_cooldown:${email}`
    const tokenKey = `email_token:${email}`;;
    const lastSentTime = await redisClient.get(cooldownKey);

    if (lastSentTime) {
        return res.status(429).json({ success: false, message: "Please wait before requesting another email." });
    }

    let token = await redisClient.get(tokenKey);
    if (!token) {
        token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });
        await redisClient.setEx(tokenKey, 3600, token); 
    }

    await redisClient.setEx(cooldownKey, 60, Date.now().toString());
    const verificationLink = `http://localhost:3000/verify?token=${token}`;

    console.log("Verification link:", verificationLink);
    try {
        await sendEmail(
            email,
            "⚕️ Confirm Your Email - HealthCare Service",
            `<div>Click <a href="${verificationLink}">here</a> to verify your email</div>`
        );
        res.json({ success: true, message: "Verification email sent!" });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ success: false, message: "Failed to send email" });
    }
};

export default verify;
