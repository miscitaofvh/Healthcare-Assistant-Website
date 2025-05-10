import { param, body, validationResult, query } from "express-validator";
import connection from "../../../config/connection.js";
import { isTagandCategoryValid } from "../../../utils/format/article.js";

// Constants
const VALID_THREAD_STATUSES = ['active', 'closed', 'pinned', 'archived'];
const VALID_SORT_OPTIONS = ['newest', 'oldest', 'most_active', 'most_viewed', 'most_liked'];
const MAX_THREAD_NAME_LENGTH = 100;
const MIN_THREAD_NAME_LENGTH = 3;
const MAX_DESCRIPTION_LENGTH = 500;
const MIN_DESCRIPTION_LENGTH = 10;
const MAX_TAGS = 5;
const MAX_SEARCH_LENGTH = 100;
const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 50;
const MAX_PINNED_THREADS_PER_CATEGORY = 5;

// Reusable validators
const validateEntityExists = (table, idField = 'id', entityName) => {
    return async (value, { req }) => {
        try {
            const [result] = await connection.execute(
                `SELECT * FROM ${table} WHERE ${idField} = ?`,
                [value]
            );
            if (result.length === 0) {
                throw new Error(`${entityName} không tồn tại`);
            }
            req[table] = result[0]; // Cache entity for subsequent middleware
            return true;
        } catch (error) {
            throw new Error(`Lỗi xác thực ${entityName}: ${error.message}`);
        }
    };
};

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

// Thread ID validation
const validateThreadId = (location = 'param') => {
    const validator = location === 'param' ? param("threadId") : body("thread_id");
    return validator
        .notEmpty().withMessage("ID chủ đề là bắt buộc")
        .isInt({ min: 1 }).withMessage("ID chủ đề phải là số nguyên dương")
        .toInt()
        .custom(validateEntityExists('forum_threads', 'thread_id', 'Chủ đề'));
};

// Thread name validation
const validateThreadName = (checkUniqueness = true) => {
    const validator = body("thread_name")
        .notEmpty().withMessage("Tên chủ đề là bắt buộc")
        .isLength({ min: MIN_THREAD_NAME_LENGTH, max: MAX_THREAD_NAME_LENGTH })
        .withMessage(`Tên chủ đề phải từ ${MIN_THREAD_NAME_LENGTH} đến ${MAX_THREAD_NAME_LENGTH} ký tự`)
        .trim()
        .escape()
        .customSanitizer(value => value.replace(/\s+/g, ' '))
        .custom(value => {
            if (!isTagandCategoryValid(value)) {
                throw new Error('Tên chủ đề chứa ký tự không hợp lệ');
            }
            return true;
        });

    if (checkUniqueness) {
        validator.custom(async (value, { req }) => {
            const [result] = await connection.execute(
                'SELECT thread_id FROM forum_threads WHERE thread_name = ? AND category_id = ?',
                [value, req.body.category_id || req.forum_threads?.category_id]
            );
            if (result.length > 0 && result[0].thread_id !== req.params?.threadId) {
                throw new Error('Tên chủ đề đã tồn tại trong danh mục này');
            }
            return true;
        });
    }

    return validator;
};

// Thread content validation
const validateThreadContent = () => {
    return body("content")
        .notEmpty().withMessage("Nội dung là bắt buộc")
        .isLength({ min: MIN_DESCRIPTION_LENGTH, max: MAX_DESCRIPTION_LENGTH })
        .withMessage(`Nội dung phải từ ${MIN_DESCRIPTION_LENGTH} đến ${MAX_DESCRIPTION_LENGTH} ký tự`)
        .trim()
        .escape();
};

// Thread description validation
const validateThreadDescription = () => {
    return body("description")
        .optional()
        .isLength({ min: MIN_DESCRIPTION_LENGTH, max: MAX_DESCRIPTION_LENGTH })
        .withMessage(`Mô tả phải từ ${MIN_DESCRIPTION_LENGTH} đến ${MAX_DESCRIPTION_LENGTH} ký tự`)
        .trim()
        .escape();
};

// Category validation
const validateCategoryId = () => {
    return body("category_id")
        .notEmpty().withMessage("Danh mục là bắt buộc")
        .isInt({ min: 1 }).withMessage("ID danh mục phải là số nguyên dương")
        .toInt()
        .custom(validateEntityExists('forum_categories', 'category_id', 'Danh mục'))
        .custom(async (value) => {
            const [category] = await connection.execute(
                'SELECT status FROM forum_categories WHERE category_id = ?',
                [value]
            );
            if (category[0].status !== 'active') {
                throw new Error('Danh mục này hiện không hoạt động');
            }
            return true;
        });
};

// Thread status validation
const validateThreadStatus = () => {
    return body("status")
        .optional()
        .isIn(VALID_THREAD_STATUSES)
        .withMessage(`Trạng thái phải là một trong: ${VALID_THREAD_STATUSES.join(', ')}`)
        .custom(async (value, { req }) => {
            if (value === 'pinned') {
                const [pinnedCount] = await connection.execute(
                    'SELECT COUNT(*) as count FROM forum_threads ' +
                    'WHERE category_id = ? AND status = "pinned"',
                    [req.body.category_id || req.forum_threads?.category_id]
                );

                if (pinnedCount[0].count >= MAX_PINNED_THREADS_PER_CATEGORY) {
                    throw new Error(`Mỗi danh mục chỉ được ghim tối đa ${MAX_PINNED_THREADS_PER_CATEGORY} chủ đề`);
                }
            }
            return true;
        });
};

// Thread ownership validation
const validateThreadOwnership = () => {
    return body().custom(async (_, { req }) => {
        const threadId = req.params.threadId || req.body.thread_id;
        if (!threadId) throw new Error('Thread ID là bắt buộc');

        const [thread] = await connection.execute(
            'SELECT user_id, status FROM forum_threads WHERE thread_id = ?',
            [threadId]
        );

        if (thread.length === 0) {
            throw new Error('Chủ đề không tồn tại');
        }

        const isOwner = thread[0].user_id === req.user?.user_id;
        const isAdmin = req.user?.role === 'admin';
        const isModerator = req.user?.role === 'moderator';

        // Only admin can modify archived threads
        if (thread[0].status === 'archived' && !isAdmin) {
            throw new Error('Chủ đề đã lưu trữ, chỉ admin có quyền chỉnh sửa');
        }

        if (!isOwner && !isAdmin && !isModerator) {
            throw new Error('Bạn không có quyền chỉnh sửa chủ đề này');
        }

        return true;
    });
};

// Thread creation validation
const validateThreadCreate = [
    validateThreadName(),
    validateCategoryId(),
    validateThreadContent(),
    validateThreadDescription(),
    handleValidationErrors
];

// Thread update validation
const validateThreadUpdate = [
    validateThreadId(),
    validateThreadName().optional(),
    validateCategoryId().optional(),
    validateThreadDescription().optional(),
    validateThreadStatus().optional(),
    validateThreadOwnership(),
    body().custom(async (_, { req }) => {
        if (!req.body.thread_name && !req.body.description && 
            !req.body.category_id && !req.body.status) {
            throw new Error('Cần cập nhật ít nhất một trường');
        }
        return true;
    }),
    handleValidationErrors
];

// Thread deletion validation
const validateThreadDelete = [
    validateThreadId(),
    validateThreadOwnership(),
    body().custom(async (_, { req }) => {
        const [posts] = await connection.execute(
            'SELECT COUNT(*) as count FROM forum_posts WHERE thread_id = ?',
            [req.params.threadId]
        );

        if (posts[0].count > 0 && req.user?.role !== 'admin') {
            throw new Error('Không thể xóa chủ đề đã có bài viết (chỉ admin có quyền này)');
        }
        return true;
    }),
    handleValidationErrors
];

// Thread query validation
const validateThreadQuery = [
    query("category_id")
        .optional()
        .isInt({ min: 1 }).withMessage("ID danh mục phải là số nguyên dương")
        .toInt()
        .custom(validateEntityExists('forum_categories', 'category_id', 'Danh mục')),

    query("status")
        .optional()
        .isIn([...VALID_THREAD_STATUSES, 'all'])
        .withMessage(`Trạng thái phải là một trong: ${VALID_THREAD_STATUSES.join(', ')} hoặc 'all'`),

    query("sort")
        .optional()
        .isIn(VALID_SORT_OPTIONS)
        .withMessage(`Kiểu sắp xếp phải là một trong: ${VALID_SORT_OPTIONS.join(', ')}`),

    query("search")
        .optional()
        .isLength({ max: MAX_SEARCH_LENGTH }).withMessage(`Từ khóa tìm kiếm không vượt quá ${MAX_SEARCH_LENGTH} ký tự`)
        .trim()
        .escape(),

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

    query("author_id")
        .optional()
        .isInt({ min: 1 }).withMessage("ID tác giả phải là số nguyên dương")
        .toInt(),

    query("tag")
        .optional()
        .isString()
        .withMessage("Thẻ phải là chuỗi")
        .trim()
        .escape()
        .isLength({ max: 50 }).withMessage("Thẻ không vượt quá 50 ký tự"),
        
    handleValidationErrors
];

export default {
    // Thread validators
    validateThreadCreate,
    validateThreadUpdate,
    validateThreadDelete,
    validateThreadQuery,
    validateThreadExists: [validateThreadId(), handleValidationErrors],

    // Reusable validators
    validateThreadId,
    validateThreadName,
    validateThreadContent,
    validateThreadDescription,
    validateCategoryId,
    validateThreadStatus,
    validateThreadOwnership,
    handleValidationErrors
};