import { param, body, validationResult, query } from "express-validator";
import { isTagandCategoryValid } from "../../../utils/format/article.js";


// Activity
export const validateActivity = [
    body("type")
        .notEmpty()
        .withMessage("Activity type is required")
        .isIn(["post", "comment", "like", "report"])
        .withMessage("Invalid activity type. Must be one of: post, comment, like, report"),

    body("targetType")
        .notEmpty()
        .withMessage("Target type is required")
        .isIn(["post", "comment"])
        .withMessage("Invalid target type. Must be one of: post, comment"),

    body("targetId")
        .notEmpty()
        .withMessage("Target ID is required")
        .isInt({ min: 1 })
        .withMessage("Target ID must be a positive integer"),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array().map(error => ({
                    field: error.param,
                    message: error.msg
                }))
            });
        }
        next();
    }
];

// Activity Query Validation
export const validateActivityQuery = [
    query("type")
        .optional()
        .isIn(["post", "comment", "like", "report"])
        .withMessage("Invalid activity type. Must be one of: post, comment, like, report"),

    query("targetType")
        .optional()
        .isIn(["post", "comment"])
        .withMessage("Invalid target type. Must be one of: post, comment"),

    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100"),

    query("offset")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Offset must be a non-negative integer"),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array().map(error => ({
                    field: error.param,
                    message: error.msg
                }))
            });
        }
        next();
    }
];

// Activity ID Validation
export const validateActivityId = [
    param("activityId")
        .notEmpty()
        .withMessage("Activity ID is required")
        .isInt({ min: 1 })
        .withMessage("Activity ID must be a positive integer"),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array().map(error => ({
                    field: error.param,
                    message: error.msg
                }))
            });
        }
        next();
    }
];