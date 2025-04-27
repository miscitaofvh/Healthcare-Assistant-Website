import { param, body, validationResult, query } from "express-validator";
import { isTagandCategoryValid } from "../../utils/format/article.js";

// Category
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

// Thread
export const validateThread = [
    body("name")
        .notEmpty()
        .withMessage("Tên chủ đề là bắt buộc")
        .isLength({ min: 3, max: 50 })
        .withMessage("Tên chủ đề phải từ 3-50 ký tự")
        .trim(),
    body("description")
        .optional()
        .isLength({ min: 10, max: 200 })
        .withMessage("Mô tả phải từ 10-200 ký tự")
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

// Post
export const validateForumPost = [
    body("category_name")
        .notEmpty()
        .withMessage("Chuyên mục là bắt buộc")
        .isLength({ min: 3, max: 100 })
        .withMessage("Chuyên mục phải từ 3-100 ký tự")
        .trim(),
    body("thread_name")
        .notEmpty()
        .withMessage("Chủ đề là bắt buộc")
        .isLength({ min: 3, max: 100 })
        .withMessage("Chủ đề phải từ 3-100 ký tự")
        .trim(),
    body("content")
        .notEmpty()
        .withMessage("Nội dung là bắt buộc")
        .isLength({ min: 10 })
        .withMessage("Nội dung phải có ít nhất 10 ký tự")
        .trim(),
    body("image_url")
        .optional()
        .isURL()
        .withMessage("URL ảnh không hợp lệ")
        .trim(),
    body("tags")
        .optional()
        .isArray()
        .withMessage("Tags phải là một mảng")
        .custom((value) => {
            if (value.length > 5) {
                throw new Error("Chỉ được tối đa 5 tags");

            }
            for (const tag of value) {
                if (!isTagandCategoryValid(tag)) {
                    throw new Error("Tag không hợp lệ");
                }
            }
            return true;
        }),
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

export const validateForumPostUpdate = [
    body("content")
        .optional()
        .isLength({ min: 10 })
        .withMessage("Nội dung phải có ít nhất 10 ký tự")
        .trim(),
    body("image_url")
        .optional()
        .isURL()
        .withMessage("URL ảnh không hợp lệ")
        .trim(),
    body("tags")
        .optional()
        .isArray()
        .withMessage("Tags phải là một mảng")
        .custom((value) => {
            if (value.length > 5) {
                throw new Error("Chỉ được tối đa 5 tags");
            }
            for (const tag of value) {
                if (!isTagandCategoryValid(tag)) {
                    throw new Error("Tag không hợp lệ");
                }
            }
            return true;
        }),
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


// Like
export const validateForumPostLike = [
    body("postId")
        .notEmpty()
        .withMessage("ID bài viết là bắt buộc")
        .isMongoId()
        .withMessage("ID bài viết không hợp lệ"),
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

export const validateForumPostLikeUnmap = [
    body("postId")
        .notEmpty()
        .withMessage("ID bài viết là bắt buộc")
        .isMongoId()
        .withMessage("ID bài viết không hợp lệ"),
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

// Comments
export const validateForumPostComment = [
    body("postId")
        .notEmpty()
        .withMessage("ID bài viết là bắt buộc")
        .isMongoId()
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

export const validateForumPostCommentLike = [
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

export const validateForumPostCommentLikeUnmap = [
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

// Tag
export const validateTag = [
    body("name")
        .notEmpty()
        .withMessage("Tên tag là bắt buộc")
        .isLength({ min: 3, max: 50 })
        .withMessage("Tên tag phải từ 3-50 ký tự")
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

// Report 
export const validateReport = [
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