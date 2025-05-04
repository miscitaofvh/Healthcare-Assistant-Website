import jwt from 'jsonwebtoken';

export const authenticateUser = (req, res, next) => {
    const token = req.cookies.auth_token; 
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: "Token invalid" });
    }
};

// Middleware to decode token if it exists, but doesn't require authentication
export const decodeTokenIfExists = (req, res, next) => {
    const token = req.cookies.auth_token;
    
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch (error) {
            // Ignore token errors, user will be treated as not logged in
            console.log('Invalid token, continuing as unauthenticated user');
        }
    }
    
    // Always continue to next middleware/route handler
    next();
};


