import { param, body, validationResult, query } from "express-validator";
import connection from "../../../config/connection.js";
import { isTagandCategoryValid } from "../../../utils/format/article.js";

// Constants
const MAX_TAG_NAME_LENGTH = 30;
const MIN_TAG_NAME_LENGTH = 2;
const MAX_TAG_DESCRIPTION_LENGTH = 200;
const MAX_TAGS_PER_POST = 5;
const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 50;

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

// Reusable validators
const validateTagId = (location = 'param') => {
    const validator = location === 'param' ? param("tagId") : body("tag_id");
    return validator
        .notEmpty().withMessage("ID thẻ là bắt buộc")
        .isInt({ min: 1 }).withMessage("ID thẻ phải là số nguyên dương")
        .toInt()
        .custom(async (value, { req }) => {
            try {
                const [result] = await connection.execute(
                    'SELECT 1 FROM forum_tags WHERE tag_id = ?',
                    [value]
                );
                if (result.length === 0) {
                    throw new Error('Thẻ không tồn tại');
                }
                req.tag = result[0]; // Cache tag for subsequent middleware
                return true;
            } catch (error) {
                throw new Error(`Lỗi xác thực thẻ: ${error.message}`);
            }
        });
};

const validateTagName = (checkUniqueness = true) => {
    const validator = body("tag_name")
        .notEmpty().withMessage("Tên thẻ là bắt buộc")
        .isLength({ min: MIN_TAG_NAME_LENGTH, max: MAX_TAG_NAME_LENGTH })
        .withMessage(`Tên thẻ phải từ ${MIN_TAG_NAME_LENGTH} đến ${MAX_TAG_NAME_LENGTH} ký tự`)
        .trim()
        .escape()
        .customSanitizer(value => value.replace(/\s+/g, ' '))
        .custom(value => {
            if (!isTagandCategoryValid(value)) {
                throw new Error('Tên thẻ chứa ký tự không hợp lệ');
            }
            return true;
        });

    if (checkUniqueness) {
        validator.custom(async (value, { req }) => {
            const [result] = await connection.execute(
                'SELECT 1 FROM forum_tags WHERE tag_name = ?',
                [value]
            );
            if (result.length > 0 && result[0].tag_id !== req.params?.tagId) {
                throw new Error('Tên thẻ đã tồn tại');
            }
            return true;
        });
    }

    return validator;
};

const validateTagDescription = () => {
    return body("description")
        .optional()
        .isLength({ max: MAX_TAG_DESCRIPTION_LENGTH })
        .withMessage(`Mô tả không quá ${MAX_TAG_DESCRIPTION_LENGTH} ký tự`)
        .trim()
        .escape();
};

const validatePostId = () => {
    return param("postId")
        .notEmpty().withMessage("ID bài viết là bắt buộc")
        .isInt({ min: 1 }).withMessage("ID bài viết phải là số nguyên dương")
        .toInt()
        .custom(async (value, { req }) => {
            try {
                const [result] = await connection.execute(
                    'SELECT 1 FROM forum_posts WHERE post_id = ?',
                    [value]
                );
                if (result.length === 0) {
                    throw new Error('Bài viết không tồn tại');
                }
                req.post = result[0]; // Cache post for subsequent middleware
                return true;
            } catch (error) {
                throw new Error(`Lỗi xác thực bài viết: ${error.message}`);
            }
        });
};

const validateTagIds = () => {
    return body("tagIds")
        .notEmpty().withMessage("Danh sách thẻ là bắt buộc")
        .isArray({ min: 1, max: MAX_TAGS_PER_POST })
        .withMessage(`Phải có từ 1 đến ${MAX_TAGS_PER_POST} thẻ`)
        .custom(async (tagIds, { req }) => {
            const uniqueIds = [...new Set(tagIds)];
            if (uniqueIds.length !== tagIds.length) {
                throw new Error('Danh sách thẻ chứa ID trùng lặp');
            }

            const [existingTags] = await connection.execute(
                'SELECT 1 FROM forum_tags WHERE tag_id IN (?)',
                [tagIds]
            );
            if (existingTags.length !== tagIds.length) {
                throw new Error('Một hoặc nhiều thẻ không tồn tại');
            }
            return true;
        });
};

// Validation sets
const validateTagExists = [
    validateTagId(),
    handleValidationErrors
];

const validateTagCreate = [
    validateTagName(),
    validateTagDescription(),
    handleValidationErrors
];

const validateTagUpdate = [
    validateTagId(),
    validateTagName().optional(),
    validateTagDescription(),
    body().custom((_, { req }) => {
        if (!req.body.tag_name && !req.body.description) {
            throw new Error('Cần cập nhật ít nhất một trường');
        }
        return true;
    }),
    handleValidationErrors
];

const validateTagDelete = [
    validateTagId(),
    body().custom(async (_, { req }) => {
        const [usage] = await connection.execute(
            'SELECT COUNT(*) as count FROM forum_tags_mapping WHERE tag_id = ?',
            [req.params.tagId]
        );
        if (usage[0].count > 0) {
            throw new Error('Không thể xóa thẻ đang được sử dụng');
        }
        return true;
    }),
    handleValidationErrors
];

const validateTagQuery = [
    query("search")
        .optional()
        .isString()
        .withMessage("Từ khóa tìm kiếm phải là chuỗi")
        .trim()
        .escape(),

    query("sortBy")
        .optional()
        .isIn(['tag_name', 'usage_count', 'created_at', 'last_used_at', 'post_count'])
        .withMessage("Trường sắp xếp không hợp lệ")
        .default('usage_count'),

    query("sortOrder")
        .optional()
        .isIn(['ASC', 'DESC'])
        .withMessage("Thứ tự sắp xếp phải là 'ASC' hoặc 'DESC'")
        .default('desc'),

    query("page")
        .optional()
        .default(1)
        .isInt({ min: 1 }).withMessage("Số trang phải là số nguyên dương")
        .toInt(),

    query("limit")
        .optional()
        .default(DEFAULT_PAGE_LIMIT)
        .isInt({ min: 1, max: MAX_PAGE_LIMIT })
        .withMessage(`Giới hạn phải từ 1 đến ${MAX_PAGE_LIMIT}`)
        .toInt(),

    handleValidationErrors
];

const validatePostTagsAdd = [
    validatePostId(),
    validateTagIds(),
    body().custom(async (_, { req }) => {
        const [existingMappings] = await connection.execute(
            'SELECT tag_id FROM forum_tags_mapping WHERE post_id = ? AND tag_id IN (?)',
            [req.params.postId, req.body.tagIds]
        );
        if (existingMappings.length > 0) {
            throw new Error('Một hoặc nhiều thẻ đã được gắn cho bài viết này');
        }
        return true;
    }),
    handleValidationErrors
];

const validatePostTagRemove = [
    validatePostId(),
    validateTagId(),
    body().custom(async (_, { req }) => {
        const [mapping] = await connection.execute(
            'SELECT 1 FROM forum_tags_mapping WHERE post_id = ? AND tag_id = ?',
            [req.params.postId, req.params.tagId]
        );
        if (mapping.length === 0) {
            throw new Error('Thẻ chưa được gắn cho bài viết này');
        }

        const [remainingTags] = await connection.execute(
            'SELECT COUNT(*) as count FROM forum_tags_mapping WHERE post_id = ?',
            [req.params.postId]
        );
        if (remainingTags[0].count <= 1) {
            throw new Error('Bài viết phải có ít nhất một thẻ');
        }
        return true;
    }),
    handleValidationErrors
];

const validatePostTagsGet = [
    validatePostId(),
    handleValidationErrors
];

export default {
    // Tag validators
    validateTagExists,
    validateTagCreate,
    validateTagUpdate,
    validateTagDelete,
    validateTagQuery,
    
    // Post-Tag relationship validators
    validatePostTagsAdd,
    validatePostTagRemove,
    validatePostTagsGet,
    
    // Reusable validators
    validateTagId,
    validateTagName,
    validateTagDescription,
    handleValidationErrors
};