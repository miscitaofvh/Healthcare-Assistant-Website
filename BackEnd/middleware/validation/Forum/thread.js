import { param, body, validationResult, query } from "express-validator";
import { isTagandCategoryValid } from "../../../utils/format/article.js";

// Thread
export const validateThread = [
    body("thread_name")
        .notEmpty()
        .withMessage("Tên chủ đề là bắt buộc.")
        .isLength({ min: 3, max: 50 })
        .withMessage("Tên chủ đề phải từ 3 đến 50 ký tự.")
        .trim(),

    body("category_id")
        .notEmpty()
        .withMessage("Category là bắt buộc.")
        .isInt({ min: 1 })
        .withMessage("ID của category phải là số nguyên dương.")
        .toInt(),

    body("description")
        .optional()
        .isLength({ min: 10, max: 200 })
        .withMessage("Mô tả phải từ 10 đến 200 ký tự.")
        .trim(),

    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Dữ liệu không hợp lệ.",
                errorCode: "VALIDATION_FAILED",
                errors: errors.array(),
                metadata: {
                    receivedAt: new Date().toISOString(),
                    fields: req.body
                }
            });
        }

        next();
    }
];