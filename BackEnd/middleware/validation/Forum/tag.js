import { param, body, validationResult, query } from "express-validator";
import { isTagandCategoryValid } from "../../../utils/format/article.js";


export const validateTag = [
    body("tag_name")
        .notEmpty()
        .isLength({ min: 2, max: 50 })
        .withMessage("Tên tag phải từ 2-50 ký tự")
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

export const validatePostTag = [
    param("postId")
        .notEmpty()
        .withMessage("ID bài viết là bắt buộc")
        .isMongoId()
        .withMessage("ID bài viết không hợp lệ"),
    body("tagIds")
        .isArray({ min: 1 })
        .withMessage("Danh sách tag phải là một mảng và không được rỗng"),
    body("tagIds.*")
        .notEmpty()
        .withMessage("ID tag là bắt buộc")
        .isMongoId()
        .withMessage("ID tag không hợp lệ"),
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

export const validateForumPostTag = [
    body("postId")
        .notEmpty()
        .withMessage("ID bài viết là bắt buộc")
        .isMongoId()
        .withMessage("ID bài viết không hợp lệ"),
    body("tagId")
        .notEmpty()
        .withMessage("ID tag là bắt buộc")
        .isMongoId()
        .withMessage("ID tag không hợp lệ"),
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

export const validateForumPostTagUnmap = [
    body("postId")
        .notEmpty()
        .withMessage("ID bài viết là bắt buộc")
        .isMongoId()
        .withMessage("ID bài viết không hợp lệ"),
    body("tagId")
        .notEmpty()
        .withMessage("ID tag là bắt buộc")
        .isMongoId()
        .withMessage("ID tag không hợp lệ"),
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
