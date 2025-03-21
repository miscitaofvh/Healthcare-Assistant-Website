import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Access denied. No valid token provided." });
        }

        const token = authHeader.split(" ")[1]; // Extract the token part
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded; // Attach user data to request object
        next(); // Proceed to the next middleware
    } catch (error) {
        return res.status(403).json({ error: "Invalid or expired token." });
    }
};

export default authMiddleware;
