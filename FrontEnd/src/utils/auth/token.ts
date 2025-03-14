import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";
const EXPIRATION = "1h"; // Token expires in 1 hour

export const generateToken = (payload: object): string => {
    return jwt.sign(payload, SECRET_KEY, { expiresIn: EXPIRATION });
};

export const verifyToken = (token: string): object | null => {
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        if (typeof decoded === 'object' && decoded !== null) {
            return decoded;
        }
        return null;
    } catch (error) {
        console.error("Invalid Token", error);
        return null;
    }
};