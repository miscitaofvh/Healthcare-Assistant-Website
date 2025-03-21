import { body, validationResult } from "express-validator";

const validateRegister = [
    body("username").notEmpty().withMessage("Username is required"),
    body("email").isEmail().withMessage("Invalid email format"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("full_name").notEmpty().withMessage("Full name is required"),
    body("dob").isISO8601().withMessage("Invalid date of birth format"),
    body("gender").isIn(["male", "female", "other"]).withMessage("Invalid gender value"),
    body("phone_number").isMobilePhone().withMessage("Invalid phone number"),
    body("address").notEmpty().withMessage("Address is required"),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

const validateLogin = [
    body("email").isEmail().withMessage("Invalid email format"),
    body("password").notEmpty().withMessage("Password is required"),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export { validateRegister, validateLogin };
