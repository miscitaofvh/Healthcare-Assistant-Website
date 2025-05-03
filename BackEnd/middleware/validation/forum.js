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

    body("image_url")
        .optional()
        .isURL()
        .withMessage("URL ảnh không hợp lệ.")
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

// Post
export const validateForumPost = [
    body("thread_id")
        .notEmpty()
        .withMessage("Thread ID là bắt buộc")
        .isInt({ min: 1 })
        .withMessage("Thread ID phải là số nguyên dương"),
    body("title")
        .notEmpty()
        .withMessage("Tiêu đề là bắt buộc")
        .isLength({ min: 3, max: 100 })
        .withMessage("Tiêu đề phải từ 3 đến 100 ký tự")
        .trim(),
    body("content")
        .notEmpty()
        .withMessage("Nội dung là bắt buộc")
        .isLength({ min: 10, max: 10000 })
        .withMessage("Nội dung phải có ít nhất 10 ký tự")
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
    body("title")
        .optional()
        .isLength({ min: 5, max: 255 })
        .withMessage("Tiêu đề phải từ 5 đến 255 ký tự")
        .trim(),
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
                const tagName = typeof tag === 'string' ? tag :
                    (tag && typeof tag === 'object' ? tag.tag_name : null);

                if (!tagName) {
                    throw new Error("Mỗi tag phải là chuỗi hoặc object có thuộc tính tag_name");
                }

                if (!isTagandCategoryValid(tagName)) {
                    throw new Error(`Tag "${tagName}" không hợp lệ`);
                }
            }
            return true;
        }),
    body("tag_name")
        .optional()
        .isArray()
        .withMessage("tag_name phải là một mảng")
        .custom((value) => {
            if (value.length > 5) {
                throw new Error("Chỉ được tối đa 5 tags trong tag_name");
            }
            for (const tag of value) {
                if (typeof tag !== 'string') {
                    throw new Error("Mỗi tag trong tag_name phải là chuỗi");
                }
                if (!isTagandCategoryValid(tag)) {
                    throw new Error(`Tag "${tag}" trong tag_name không hợp lệ`);
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

        if (req.body.tags && req.body.tag_name) {
            const mergedTags = [...new Set([...req.body.tags, ...req.body.tag_name])];
            req.body.tags = mergedTags;
            delete req.body.tag_name;
        } else if (req.body.tag_name && !req.body.tags) {
            req.body.tags = req.body.tag_name;
            delete req.body.tag_name;
        }

        next();
    }
];

// function isTagandCategoryValid(tag) {
//     return typeof tag === 'string' && 
//            tag.length >= 2 && 
//            tag.length <= 50 && 
//            /^[a-zA-Z0-9\s\-]+$/.test(tag);
// }

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