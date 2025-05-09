import { param, body, validationResult } from "express-validator";
import connection from "../../../config/connection.js";
import { isTagandCategoryValid } from "../../../utils/format/article.js";

// Constants
const MIN_TITLE_LENGTH = 3;
const MAX_TITLE_LENGTH = 100;
const MIN_CONTENT_LENGTH = 10;
const MAX_CONTENT_LENGTH = 10000;
const MAX_TAGS = 5;

// Reusable validators
const validateEntityExists = (table, idField = 'id', entityName) => {
    return async (value, { req }) => {
        const [result] = await connection.execute(
            `SELECT ${idField} FROM ${table} WHERE ${idField} = ?`,
            [value]
        );
        if (result.length === 0) {
            throw new Error(`${entityName} không tồn tại`);
        }
        req[table] = result[0]; // Attach entity to request for later use
        return true;
    };
};

const validateId = (field, entityName, location = 'body') => {
    const validator = location === 'body' ? body(field) : param(field);
    return validator
        .notEmpty().withMessage(`${entityName} là bắt buộc`)
        .isInt({ min: 1 }).withMessage(`${entityName} phải là số nguyên dương`)
        .toInt();
};

const validateThreadId = (location = 'body') => {
    return validateId('thread_id', 'ID chủ đề', location)
        .custom(validateEntityExists('forum_threads', 'thread_id', 'Chủ đề'));
};

const validatePostId = (location = 'param', field = 'postId') => {
    return validateId(field, 'ID bài viết', location)
        .custom(validateEntityExists('forum_posts', 'post_id', 'Bài viết'));
};

const validateTitle = () => {
    return body("title")
        .notEmpty().withMessage("Tiêu đề là bắt buộc")
        .isLength({ min: MIN_TITLE_LENGTH, max: MAX_TITLE_LENGTH })
        .withMessage(`Tiêu đề phải từ ${MIN_TITLE_LENGTH} đến ${MAX_TITLE_LENGTH} ký tự`)
        .trim()
        .escape();
};

const validateContent = () => {
    return body("content")
        .notEmpty().withMessage("Nội dung là bắt buộc")
        .isLength({ min: MIN_CONTENT_LENGTH, max: MAX_CONTENT_LENGTH })
        .withMessage(`Nội dung phải từ ${MIN_CONTENT_LENGTH} đến ${MAX_CONTENT_LENGTH} ký tự`)
        .trim()
        .escape();
};

const validateTags = () => {
    return body("tags")
        .optional()
        .isArray().withMessage("Tags phải là một mảng")
        .custom((tags) => {
            if (tags.length > MAX_TAGS) {
                throw new Error(`Chỉ được tối đa ${MAX_TAGS} tags`);
            }
            
            const invalidTags = tags.filter(tag => !isTagandCategoryValid(tag));
            if (invalidTags.length > 0) {
                throw new Error(`Tags không hợp lệ: ${invalidTags.join(', ')}`);
            }
            
            return true;
        });
};

const validateAtLeastOneField = () => {
    return body().custom((body, { req }) => {
        const { title, content, tags } = req.body;
        if (!title && !content && !tags) {
            throw new Error('Cần cập nhật ít nhất một trường (tiêu đề, nội dung hoặc tags)');
        }
        return true;
    });
};

// Error handler middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            code: "VALIDATION_ERROR",
            message: "Dữ liệu không hợp lệ",
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg,
                type: 'validation_error'
            }))
        });
    }
    next();
};

// Validation middleware sets
const validatePostExists = [
    validatePostId('param'),
    handleValidationErrors
];

const validateCreatePost = [
    validateThreadId(),
    validateTitle(),
    validateContent(),
    validateTags(),
    handleValidationErrors
];

const validateUpdatePost = [
    validatePostId('param'),
    validateTitle().optional(),
    validateContent().optional(),
    validateTags().optional(),
    validateAtLeastOneField(),
    handleValidationErrors
];

const validateDeletePost = [
    validatePostId('param'),
    body().custom(async (_, { req }) => {
        const [comments] = await connection.execute(
            'SELECT COUNT(*) as count FROM forum_comments WHERE post_id = ?',
            [req.params.postId]
        );
        if (comments[0].count > 0) {
            throw new Error('Không thể xóa bài viết đã có bình luận');
        }
        return true;
    }),
    handleValidationErrors
];

// Export
export default {
    validatePostExists,
    validateCreatePost,
    validateUpdatePost,
    validateDeletePost,
    
    // Utility validators for reuse
    validateThreadId,
    validatePostId,
    validateTitle,
    validateContent,
    validateTags,
    handleValidationErrors
};