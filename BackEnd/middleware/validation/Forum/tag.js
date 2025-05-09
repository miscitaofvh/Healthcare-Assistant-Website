import { param, body, validationResult, query } from "express-validator";
import connection from "../../../config/connection.js";

// Constants
const MAX_TAG_NAME_LENGTH = 30;
const MIN_TAG_NAME_LENGTH = 2;
const MAX_TAG_DESCRIPTION_LENGTH = 200;
const MAX_TAGS_PER_POST = 5;
const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 50;

// Reusable validators
const validateEntityExists = (table, idField = 'id', entityName) => {
    return async (value, { req }) => {
        const [result] = await connection.execute(
            `SELECT * FROM ${table} WHERE ${idField} = ?`,
            [value]
        );
        if (result.length === 0) {
            throw new Error(`${entityName} không tồn tại`);
        }
        req[table] = result[0]; // Attach entity to request for later use
        return true;
    };
};

const validateTagName = () => {
    return body("tag_name")
        .trim()
        .escape()
        .notEmpty().withMessage("Tên thẻ là bắt buộc")
        .isLength({ min: MIN_TAG_NAME_LENGTH, max: MAX_TAG_NAME_LENGTH })
        .withMessage(`Tên thẻ phải từ ${MIN_TAG_NAME_LENGTH} đến ${MAX_TAG_NAME_LENGTH} ký tự`)
        .customSanitizer(value => value.replace(/\s+/g, ' '));
};

const validateTagDescription = () => {
    return body("description")
        .optional()
        .trim()
        .escape()
        .isLength({ max: MAX_TAG_DESCRIPTION_LENGTH })
        .withMessage(`Mô tả thẻ không quá ${MAX_TAG_DESCRIPTION_LENGTH} ký tự`);
};

const validateId = (field, entityName, location = 'body') => {
    const validator = location === 'body' ? body(field) : param(field);
    return validator
        .notEmpty().withMessage(`${entityName} là bắt buộc`)
        .isInt({ min: 1 }).withMessage(`${entityName} phải là số nguyên dương`)
        .toInt();
};

const validateTagId = (location = 'param', field = 'tagId') => {
    return validateId(field, 'ID thẻ', location)
        .custom(validateEntityExists('forum_tags', 'tag_id', 'Thẻ'));
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
            })),
            timestamp: new Date().toISOString()
        });
    }
    next();
};

// Custom validations
const validateTagNameUniqueness = async (tagName, { req }) => {
    const [result] = await connection.execute(
        'SELECT tag_id FROM forum_tags WHERE tag_name = ?',
        [tagName]
    );
    if (result.length > 0 && result[0].tag_id !== req.tag?.tag_id) {
        throw new Error('Tên thẻ đã tồn tại');
    }
    return true;
};

const validateTagNotInUse = async (tagId, { req }) => {
    const [posts] = await connection.execute(
        'SELECT COUNT(*) as count FROM forum_post_tags WHERE tag_id = ?',
        [tagId]
    );
    if (posts[0].count > 0) {
        throw new Error('Không thể xóa thẻ đang được sử dụng');
    }
    return true;
};

const validatePostTags = () => {
    return body("tagIds")
        .notEmpty().withMessage("Danh sách thẻ là bắt buộc")
        .isArray({ max: MAX_TAGS_PER_POST }).withMessage(`Tối đa ${MAX_TAGS_PER_POST} thẻ mỗi bài viết`)
        .custom(async (tagIds, { req }) => {
            const [existingTags] = await connection.execute(
                'SELECT tag_id FROM forum_tags WHERE tag_id IN (?)',
                [tagIds]
            );
            if (existingTags.length !== tagIds.length) {
                throw new Error('Một hoặc nhiều thẻ không tồn tại');
            }
            
            // Check for existing mappings
            const [existingMappings] = await connection.execute(
                'SELECT tag_id FROM forum_post_tags WHERE post_id = ? AND tag_id IN (?)',
                [req.params.postId, tagIds]
            );
            if (existingMappings.length > 0) {
                throw new Error('Một hoặc nhiều thẻ đã được gắn cho bài viết này');
            }
            
            return true;
        });
};

// Validation sets
const validateTagExists = [
    validateTagId('param'),
    handleValidationErrors
];

const validateTagCreate = [
    validateTagName(),
    validateTagDescription(),
    body().custom(async (_, { req }) => {
        await validateTagNameUniqueness(req.body.tag_name, { req });
        return true;
    }),
    handleValidationErrors
];

const validateTagUpdate = [
    validateTagId('param'),
    validateTagName().optional(),
    validateTagDescription(),
    body().custom(async (_, { req }) => {
        if (req.body.tag_name) {
            await validateTagNameUniqueness(req.body.tag_name, { req });
        }
        return true;
    }),
    handleValidationErrors
];

const validateTagDeletion = [
    validateTagId('param'),
    body().custom(async (_, { req }) => {
        await validateTagNotInUse(req.params.tagId, { req });
        return true;
    }),
    handleValidationErrors
];

const validateTagQuery = [
    query("search").optional().isString().trim().escape(),
    query("page").optional().isInt({ min: 1 }).default(1).toInt(),
    query("limit").optional().isInt({ min: 1, max: MAX_PAGE_LIMIT }).default(DEFAULT_PAGE_LIMIT).toInt(),
    handleValidationErrors
];

const validatePostTagMapping = [
    validateTagId('param'),
    body().custom(async (_, { req }) => {
        const [mapping] = await connection.execute(
            'SELECT * FROM forum_post_tags WHERE post_id = ? AND tag_id = ?',
            [req.params.postId, req.params.tagId]
        );
        if (mapping.length === 0) {
            throw new Error('Thẻ chưa được gắn cho bài viết này');
        }
        return true;
    }),
    handleValidationErrors
];

const validatePostTagUnmapping = [
    body().custom(async (_, { req }) => {
        // Check if this is the last tag being removed
        const [tags] = await connection.execute(
            'SELECT COUNT(*) as count FROM forum_post_tags WHERE post_id = ?',
            [req.params.postId]
        );
        if (tags[0].count <= 1) {
            throw new Error('Bài viết phải có ít nhất một thẻ');
        }
        return true;
    }),
    handleValidationErrors
];

export default {
    validateTagExists,
    validateTagCreate,
    validateTagUpdate,
    validateTagDeletion,
    validateTagQuery,
    validatePostTagMapping,
    validatePostTagUnmapping,
    validatePostTags,
    
    // Utility validators for reuse
    validateTagId,
    validateTagName,
    validateTagDescription,
    handleValidationErrors
};