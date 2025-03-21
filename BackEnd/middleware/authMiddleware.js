import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
        req.user = decoded; // Attach user data to request object
        next(); // Proceed to the next middleware
    } catch (error) {
        return res.status(403).json({ error: "Invalid or expired token." });
    }
};

export default authMiddleware;
