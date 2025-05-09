import { param, body, validationResult, query } from "express-validator";
import { isTagandCategoryValid } from "../../../utils/format/article.js";


// Report 
export const validateReportPost = [
    param("postId")
        .notEmpty()
        .withMessage("Post ID là bắt buộc")
        .isInt({ min: 1 })
        .withMessage("Post ID phải là số nguyên dương"),
    body("reason")
        .notEmpty()
        .withMessage("Lý do là bắt buộc")
        .isLength({ min: 10, max: 200 })
        .withMessage("Lý do phải từ 10-200 ký tự")
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

export const validateForumPostReportDelete = [
    body("postId")
        .notEmpty()
        .withMessage("ID bài viết là bắt buộc")
        .isMongoId()
        .withMessage("ID bài viết không hợp lệ"),
    body("reportId")
        .notEmpty()
        .withMessage("ID báo cáo là bắt buộc")
        .isMongoId()
        .withMessage("ID báo cáo không hợp lệ"),
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

export const validateReportComment = [
    body("commentId")
        .notEmpty()
        .withMessage("ID bình luận là bắt buộc")
        .isInt()
        .withMessage("ID bình luận không hợp lệ"),
    body("reason")
        .notEmpty()
        .withMessage("Lý do là bắt buộc")
        .isLength({ min: 10, max: 200 })
        .withMessage("Lý do phải từ 10-200 ký tự")
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