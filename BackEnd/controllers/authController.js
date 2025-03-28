import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { findUserByUsernameOrEmail, createUser, findUserByLoginField, loginUser } from "../models/User.js";
import db from "../config/connection.js";

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
        // Đăng nhập user
        const user = await loginUser(identifier, password);

        // Tạo JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: "Đăng nhập thành công",
            data: {
                ...user,
                token
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
