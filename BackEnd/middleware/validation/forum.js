import { body, validationResult } from "express-validator";
import { isTagandCategoryValid } from "../../utils/format/article.js";


export const validateCategory = [
    body("name")
        .notEmpty()
        .withMessage("Tên danh mục là bắt buộc")
        .isLength({ min: 3, max: 50 })
        .withMessage("Tên danh mục phải từ 3-50 ký tự")
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

export const validateComment = [
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

export const validateForumPostLikeUser = [
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

export const validateReportStatus = [
    body("status")
        .notEmpty()
        .withMessage("Trạng thái là bắt buộc")
        .isIn(["pending", "resolved", "rejected"])
        .withMessage("Trạng thái không hợp lệ"),
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

export const validateForumActivity = [
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

export const validateTagAndCategory = [
    body("tag")
        .notEmpty()
        .withMessage("Tag là bắt buộc")
        .isLength({ min: 3, max: 50 })
        .withMessage("Tag phải từ 3-50 ký tự")
        .trim()
        .custom((value) => {
            if (!isTagandCategoryValid(value)) {
                throw new Error("Tag không hợp lệ");
            }
            return true;
        }),
    body("category")
        .notEmpty()
        .withMessage("Danh mục là bắt buộc")
        .isLength({ min: 3, max: 50 })
        .withMessage("Danh mục phải từ 3-50 ký tự")
        .trim()
        .custom((value) => {
            if (!isTagandCategoryValid(value)) {
                throw new Error("Danh mục không hợp lệ");
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

export const validateForumPostDelete = [
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

export const validateForumPostReport = [
    body("postId")
        .notEmpty()
        .withMessage("ID bài viết là bắt buộc")
        .isMongoId()
        .withMessage("ID bài viết không hợp lệ"),
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

export const validateForumPostReportUnmap = [
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

export const validateForumPostReportUpdate = [
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
    body("status")
        .notEmpty()
        .withMessage("Trạng thái là bắt buộc")
        .isIn(["pending", "resolved", "rejected"])
        .withMessage("Trạng thái không hợp lệ"),
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

export const validateForumPostActivity = [
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

export const validateForumPostActivityUnmap = [
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

export const validateForumPostActivityDelete = [
    body("userId")
        .notEmpty()
        .withMessage("ID người dùng là bắt buộc")
        .isMongoId()
        .withMessage("ID người dùng không hợp lệ"),
    body("activityId")
        .notEmpty()
        .withMessage("ID hoạt động là bắt buộc")
        .isMongoId()
        .withMessage("ID hoạt động không hợp lệ"),
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

export const validateForumPostActivityUpdate = [
    body("userId")
        .notEmpty()
        .withMessage("ID người dùng là bắt buộc")
        .isMongoId()
        .withMessage("ID người dùng không hợp lệ"),
    body("activityId")
        .notEmpty()
        .withMessage("ID hoạt động là bắt buộc")
        .isMongoId()
        .withMessage("ID hoạt động không hợp lệ"),
    body("status")
        .notEmpty()
        .withMessage("Trạng thái là bắt buộc")
        .isIn(["pending", "resolved", "rejected"])
        .withMessage("Trạng thái không hợp lệ"),
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