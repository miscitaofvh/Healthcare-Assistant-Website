import express from 'express';
import pino from 'pino';
import dotenv from 'dotenv';
import ImageKit from 'imagekit';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import crypto from 'crypto';

dotenv.config();

const app = express();

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// Structured Logger Setup
const logger = pino({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
});

// Request ID Middleware
const requestIdMiddleware = (req, res, next) => {
    req.requestId = crypto.randomUUID();
    res.setHeader('X-Request-ID', req.requestId);
    next();
};
app.use(requestIdMiddleware);

// Custom Error Classes
class AppError extends Error {
    constructor(message, statusCode, errorCode, details = {}) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.details = details;
        this.isAppError = true;
    }
}

class ValidationError extends AppError {
    constructor(message, details = {}) {
        super(message, StatusCodes.BAD_REQUEST, 'VALIDATION_ERROR', details);
    }
}

class UnauthorizedError extends AppError {
    constructor(message, details = {}) {
        super(message, StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED', details);
    }
}

// Error Handler
const errorHandler = (error, req, res, action = 'process') => {
    const requestId = req.requestId || crypto.randomUUID();

    // Default values for unexpected errors
    let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = `Failed to ${action}`;
    const details = {};

    // Handle AppError instances
    if (error.isAppError) {
        statusCode = error.statusCode;
        errorCode = error.errorCode;
        message = error.message;
        Object.assign(details, error.details);
    }

    // Log the error
    logger.error({
        requestId,
        action,
        method: req.method,
        url: req.originalUrl,
        error: {
            message: error.message,
            code: errorCode,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
    });

    // Send response
    res.status(statusCode).json({
        success: false,
        errorCode,
        message,
        details,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && {
            debug: { message: error.message, stack: error.stack?.split('\n')[0] },
        }),
    });
};

// Helper Functions
const getUserFromToken = (req) => {
    if (!req.cookies?.auth_token) {
        throw new UnauthorizedError('No authentication token provided');
    }

    try {
        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        if (!decoded.user_id || !decoded.username) {
            throw new UnauthorizedError('Invalid token payload');
        }
        return { userId: decoded.user_id, username: decoded.username };
    } catch (jwtError) {
        throw new UnauthorizedError('Invalid or expired token', { token: req.cookies.auth_token });
    }
};

const validateFile = (file) => {
    if (!file) {
        throw new ValidationError('No image file provided');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new ValidationError('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.', {
            mimeType: file.mimetype,
        });
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        throw new ValidationError('File size exceeds 5MB limit', { fileSize: file.size });
    }

    return file;
};

const validateFolderName = (name, type) => {
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return type === 'folder' ? 'forum-images' : 'forum-posts';
    }
    const trimmed = name.trim();
    if (!/^[a-zA-Z0-9-_]+$/.test(trimmed)) {
        throw new ValidationError(`Invalid ${type} name. Only alphanumeric characters, hyphens, and underscores are allowed.`, {
            [type]: name,
        });
    }
    return trimmed;
};

const validateFileName = (fileName) => {
    if (!fileName || typeof fileName !== 'string' || fileName.trim() === '') {
        return 'image';
    }
    // Remove file extension if present
    const trimmed = fileName.trim().replace(/\.[^/.]+$/, '');
    if (!/^[a-zA-Z0-9-_]+$/.test(trimmed)) {
        throw new ValidationError('Invalid file name. Only alphanumeric characters, hyphens, and underscores are allowed.', {
            fileName,
        });
    }
    return trimmed;
};

// Controller Functions
const uploadImage = async (req, res) => {
    try {
        const { userId, username } = getUserFromToken(req);
        const file = validateFile(req.file);
        const folder = validateFolderName(req.body.folder, 'folder');
        const subfolder = validateFolderName(req.body.subfolder, 'subfolder');
        const fileNameBase = validateFileName(req.body.fileName);
        const timestamp = Date.now();
        const fullFileName = `${fileNameBase}-${timestamp}`;

        const uploadResponse = await imagekit.upload({
            file: file.buffer,
            fileName: fullFileName,
            folder: `/${folder}/${subfolder}/${username}`,
            useUniqueFileName: true,
            tags: [`user-${username}`, folder, subfolder],
        });

        if (!uploadResponse.url) {
            throw new AppError('Failed to upload image', StatusCodes.INTERNAL_SERVER_ERROR, 'UPLOAD_FAILED');
        }

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Image uploaded successfully',
            imageUrl: uploadResponse.url,
            metadata: {
                userId,
                username,
                fileName: fullFileName,
                folder: `/${folder}/${subfolder}/${username}`,
                uploadedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        errorHandler(error, req, res, 'upload image');
    }
};

// Global Error Handler
app.use((err, req, res, next) => {
    errorHandler(err, req, res, 'unknown operation');
});

export default {
    uploadImage,
};