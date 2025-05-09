import { param, body, validationResult, query } from "express-validator";
import { isTagandCategoryValid } from "../../../utils/format/article.js";

export const validateForumPostComment = [
    body("postId")
        .notEmpty()
        .withMessage("ID bài viết là bắt buộc")
        .isInt()
        .withMessage("ID bài viết không hợp lệ"),
    body("content")
        .notEmpty()
        .withMessage("Nội dung là bắt buộc")
        .isLength({ min: 1 })
        .withMessage("Nội dung phải có ít nhất 1 ký tự")
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

export const validateForumPostCommentDelete = [
    body("postId")
        .notEmpty()
        .withMessage("ID bài viết là bắt buộc")
        .isMongoId()
        .withMessage("ID bài viết không hợp lệ"),
    body("commentId")
        .notEmpty()
        .withMessage("ID bình luận là bắt buộc")
        .isMongoId()
        .withMessage("ID bình luận không hợp lệ"),
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

export const validateForumPostCommentReport = [
    body("postId")
        .notEmpty()
        .withMessage("ID bài viết là bắt buộc")
        .isMongoId()
        .withMessage("ID bài viết không hợp lệ"),
    body("commentId")
        .notEmpty()
        .withMessage("ID bình luận là bắt buộc")
        .isMongoId()
        .withMessage("ID bình luận không hợp lệ"),
    body("userId")
        .notEmpty()
        .withMessage("ID người dùng là bắt buộc")
        .isMongoId()
        .withMessage("ID người dùng không hợp lệ"),
    body("reason")
        .notEmpty()
        .withMessage("Lý do báo cáo là bắt buộc")
        .isString()
        .withMessage("Lý do báo cáo phải là chuỗi"),
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