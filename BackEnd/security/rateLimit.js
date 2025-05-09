import rateLimit from 'express-rate-limit';

export const commentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    message: {
        success: false,
        message: "Bạn đã bình luận quá nhiều, vui lòng thử lại sau 15 phút"
    },
    skip: (req) => {
        // Skip rate limiting for admins/moderators
        return req.user?.role === 'Admin' || req.user?.role === 'Moderator';
    }
});

// Strict limiter for authentication endpoints
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 login attempts per hour
    message: 'Too many login attempts, please try again later'
});

// API-wide limiter
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100 // 100 requests per minute
});

export const categoryLimiter =  rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 15, // 15 categories per day
    message: 'You have exceeded your daily category limit'
});

export const threadLimiter =  rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 15, // 5 threads per day
    message: 'You have exceeded your daily thread limit'
});


export const likeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // 30 likes per user
    keyGenerator: req => req.user.user_id
});

export const reportLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 5, // 5 reports per day
    message: 'You have exceeded your daily report limit'
});

// In security/rateLimit.js
export const postLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 posts per hour
    message: 'Bạn đã tạo quá nhiều bài viết, vui lòng thử lại sau 1 giờ'
});

export const tagLimiter =  rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 15, // 15 tags per day
    message: 'You have exceeded your daily tag limit'
});