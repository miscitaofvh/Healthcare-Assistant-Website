import { param, body, validationResult, query } from "express-validator";
import { isTagandCategoryValid } from "../../../utils/format/article.js";


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

export const validateForumPostDelete = [
    param("postId")
        .notEmpty()
        .withMessage("Post ID là bắt buộc")
        .isInt({ min: 1 })
        .withMessage("Post ID phải là số nguyên dương"),
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