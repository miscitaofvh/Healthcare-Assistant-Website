import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
const sendEmail = async (to, subject, text) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        html: text,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("📩 Email sent:", info.response);
        return info;
    } catch (error) {
        console.error("❌ Email error:", error);
        throw error;
    }
};

export default sendEmail; 
