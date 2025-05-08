import dotenv from "dotenv";
import ImageKit from "imagekit";
import jwt from "jsonwebtoken";

dotenv.config();

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

export const uploadImage  = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image file provided"
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        } catch (jwtError) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token",
                error: jwtError.message
            });
        }

        const username = decoded.username;
        if (!username) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized access"
            });
        }

        const file = req.file;

        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."
            });
        }

        const folder = req.body.folder?.trim() || "forum-images";
        const subfolder = req.body.subfolder?.trim() || "forum-posts";
        const fileNameBase = req.body.fileName?.trim() || "image";
        const timestamp = Date.now();
    
        const fullFileName = `${fileNameBase}-${timestamp}`;
        
        const uploadResponse = await imagekit.upload({
            file: file.buffer,
            fileName: fullFileName,
            folder: `/${folder}/${subfolder}/${username}`,
            useUniqueFileName: true,
            tags: [`user-${username}`, folder, subfolder],
        });

        res.json({
            success: true,
            message: "Image uploaded successfully",
            imageUrl: uploadResponse.url,
        });

    } catch (error) {
        console.error("Error uploading image:", error);
        res.status(500).json({
            success: false,
            message: "Error uploading image",
            error: error.message,
        });
    }
};