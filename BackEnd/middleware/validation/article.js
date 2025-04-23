import { body, validationResult } from "express-validator";
import { isTagandCategoryValid } from "../../utils/format/article.js";

export const validateArticle = [
    body("title")
        .notEmpty()
        .withMessage("Title là bắt buộc")
        .isLength({ min: 3, max: 100 })
        .withMessage("Title phải từ 3-100 ký tự")
        .trim(),
    body("content")
        .notEmpty()
        .withMessage("Content là bắt buộc")
        .isLength({ min: 10 })
        .withMessage("Content phải có ít nhất 10 ký tự")
        .trim(),
    body("tag_name")
        .optional()
        .isArray()
        .withMessage("Tag phải là một mảng")
        .custom((value) => {
            if (value.length > 5) {
                throw new Error("Số lượng tag không được vượt quá 5");
            }
            return true;
        })
        .custom((value) => {
            for (const tag of value) {
                if (!isTagandCategoryValid(tag)) {
                    throw new Error("Tag chỉ được chứa chữ cái, số, khoảng trắng và dấu gạch dưới");
                }
            }
            return true;
        }),
    body("category_name")
        .notEmpty()
        .withMessage("Category là bắt buộc")
        .custom((value) => {
            if (!isTagandCategoryValid(value)) {
                throw new Error("Category chỉ được chứa chữ cái, số, khoảng trắng và dấu gạch dưới");
            }
            return true;
        })
        .isLength({ min: 3, max: 30 })
        .trim(),
    body("image_url")
        .optional()
        .isURL()
        .withMessage("URL ảnh không hợp lệ")
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