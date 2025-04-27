import { getUserFullProfileById, updateUserProfile as updateUserProfileModel } from "../models/User.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import ImageKit from "imagekit";

dotenv.config();

// Initialize ImageKit with your credentials
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

export const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        
        const user = await getUserFullProfileById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({ 
            success: true, 
            user 
        });
    } catch (error) {
        console.error("Error getting user profile:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error retrieving user profile",
            error: error.message 
        });
    }
};

export const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const profileData = req.body;
        
        // Make sure we only allow updating specific fields
        const allowedFields = ['full_name', 'dob', 'gender', 'phone_number', 'address', 'profile_picture_url'];
        const sanitizedData = {};
        
        // Only include allowed fields in the update
        Object.keys(profileData).forEach(key => {
            if (allowedFields.includes(key)) {
                sanitizedData[key] = profileData[key];
            }
        });
        
        // Validate required fields
        if (Object.keys(sanitizedData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided for update"
            });
        }

        // Specific validations for certain fields
        if (sanitizedData.gender && !['Male', 'Female'].includes(sanitizedData.gender)) {
            return res.status(400).json({
                success: false,
                message: "Gender must be 'Male' or 'Female'"
            });
        }

        // Handle empty strings for nullable fields
        ['dob', 'gender', 'phone_number', 'address', 'profile_picture_url'].forEach(field => {
            if (sanitizedData[field] === '') {
                sanitizedData[field] = null;
            }
        });

        const result = await updateUserProfileModel(userId, sanitizedData);
        
        res.json({
            success: true,
            message: "Profile updated successfully",
            data: result
        });
    } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({
            success: false,
            message: "Error updating user profile",
            error: error.message
        });
    }
};

export const uploadUserAvatar = async (req, res) => {
    try {
        // Check if file is provided
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image file provided"
            });
        }

        const userId = req.user.user_id;
        const file = req.file;

        // Validate file type
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."
            });
        }

        // Generate a unique filename with the user ID
        const fileName = `avatar-${userId}-${Date.now()}`;
        
        // Upload to ImageKit
        const uploadResponse = await imagekit.upload({
            file: file.buffer.toString('base64'), // Convert buffer to base64
            fileName: fileName,
            folder: '/user-avatars',
            useUniqueFileName: true,
            tags: [`user-${userId}`, 'avatar']
        });

        // Return the image URL
        res.json({
            success: true,
            message: "Avatar uploaded successfully",
            imageUrl: uploadResponse.url
        });
    } catch (error) {
        console.error("Error uploading avatar:", error);
        res.status(500).json({
            success: false,
            message: "Error uploading avatar",
            error: error.message
        });
    }
};
