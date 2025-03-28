import jwt from 'jsonwebtoken';

export const authenticateUser = (req, res, next) => {
    const token = req.cookies.token; // Get JWT from HTTP-only cookie
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user info to request
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: "Token invalid" });
    }
};
