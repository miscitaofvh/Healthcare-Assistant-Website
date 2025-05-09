import { param, body, validationResult, query } from "express-validator";
import { isTagandCategoryValid } from "../../../utils/format/article.js";

export const validateCategory = [
    body("category_name")
        .notEmpty()
        .withMessage("Tên danh mục là bắt buộc")
        .isLength({ min: 3, max: 50 })
        .withMessage("Tên danh mục phải từ 3-50 ký tự")
        .trim(),
    body("description")
        .optional()
        .isLength({ min: 10, max: 200 })
        .withMessage("Mô tả phải từ 10-200 ký tự")
        .trim(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Dữ liệu không hợp lệ",
                errors: errors.array()
            });
        }
        next();
    }
];