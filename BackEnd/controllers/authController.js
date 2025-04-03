import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createUser, loginUser, getUserById, existUser } from "../models/User.js";
dotenv.config();

export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Tạo user mới
        const userId = await createUser({ username, email, password });

        // Tạo JWT token
        const token = jwt.sign(
            { email },
            process.env.EMAIL_SECRET,
            { expiresIn: '24h' }
        );

        // Dung cho https
        // res.cookie("token", token, { 
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === "production", // Chỉ gửi cookie qua HTTPS nếu ở môi trường production
        //     sameSite: "strict",
        //     maxAge: 24 * 60 * 60 * 1000
        // });

        res.cookie("pendingEmail", token, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 30 * 60 * 1000
        });

        res.status(201).json({
            success: true,
            message: "Đăng ký thành công",
            data: {
                id: userId,
                username,
                email,
                token
            }
        });
    } catch (error) {
        console.error("Lỗi đăng ký:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Đăng ký thất bại"
        });
    }
};

export const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        // Authenticate user
        const user = await loginUser(identifier, password);

        // Token expiration setup
        const expiresIn = process.env.JWT_EXPIRATION || '24h';
        const expiresInSeconds = typeof expiresIn === 'string' && expiresIn.endsWith('h')
            ? parseInt(expiresIn) * 3600
            : 86400; // Default 24h in seconds

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.user_id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn }
        );

        // Set token as HTTP-only cookie
        // res.cookie('token', token, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === 'production',
        //     sameSite: 'Strict',
        //     maxAge: expiresInSeconds * 1000 // Convert seconds to milliseconds
        // });

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: expiresInSeconds * 1000 // Convert seconds to milliseconds
        });

        res.json({
            success: true,
            message: "Đăng nhập thành công",
            data: {
                ...user,
                token,
                expiresIn: expiresInSeconds // Remaining time in seconds
            }
        });
    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        res.status(401).json({
            success: false,
            message: error.message || "Đăng nhập thất bại"
        });
    }
};

export const getAuthenticatedUser = async (req, res) => {
    try {
        const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
        const user = await getUserById(decoded.userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};


export const exist = async (req, res) => {
    try {
        const { identifier } = req.body;
        const isExist = await existUser(identifier);
        res.json({ success: true, exist: isExist });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};


