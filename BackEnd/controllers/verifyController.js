const sendEmail = require("../utils/emailSender");

const verify = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }

    const verificationLink = `http://localhost:3000/verify?email=${email}`;

    try {
        await sendEmail(email, "Email Verification", `Click the link to verify your email: ${verificationLink}`);
        res.json({ success: true, message: "Verification email sent!" });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ success: false, message: "Failed to send email" });
    }
};

module.exports = verify;