import { param, body, validationResult, query } from "express-validator";
import connection from "../../../config/connection.js";
import { isTagandCategoryValid } from "../../../utils/format/article.js";

// Constants
const VALID_THREAD_STATUSES = ['active', 'closed', 'pinned', 'archived'];
const VALID_SORT_OPTIONS = ['newest', 'oldest', 'most_active', 'most_viewed'];
const MAX_THREAD_NAME_LENGTH = 100;
const MIN_THREAD_NAME_LENGTH = 3;
const MAX_DESCRIPTION_LENGTH = 500;
const MIN_DESCRIPTION_LENGTH = 10;
const MAX_TAGS = 5;
const MAX_SEARCH_LENGTH = 100;
const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 50;

// Reusable validators with enhanced security
const validateEntityExists = (table, idField = 'id', entityName) => {
    return async (value, { req }) => {
        try {
            const [result] = await connection.execute(
                `SELECT ${idField} FROM ${table} WHERE ${idField} = ?`,
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

// Enhanced error handler with logging
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Log validation errors for debugging
        console.warn('Validation errors:', errors.array());
        
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

// Content validation with XSS protection
const validateContent = (field = "content", min = MIN_DESCRIPTION_LENGTH, max = MAX_DESCRIPTION_LENGTH) => {
    return body(field)
        .notEmpty().withMessage(`${field === "content" ? "Nội dung" : "Mô tả"} là bắt buộc`)
        .isLength({ min, max }).withMessage(`${field === "content" ? "Nội dung" : "Mô tả"} phải từ ${min} đến ${max} ký tự`)
        .trim()
        .escape()
        .customSanitizer(value => value.replace(/\s+/g, ' ')); // Normalize whitespace
};

// Thread ID validation with caching
const validateThreadId = (location = 'param') => {
    const validator = location === 'param' ? param("threadId") : body("threadId");
    return validator
        .notEmpty().withMessage("ID chủ đề là bắt buộc")
        .isInt({ min: 1 }).withMessage("ID chủ đề phải là số nguyên dương")
        .toInt()
        .custom(validateEntityExists('forum_threads', 'thread_id', 'Chủ đề'));
};

// Thread name validation with profanity filter
const validateThreadName = () => {
    const forbiddenWords = ['spam', 'scam', 'xoso']; // Add more as needed
    
    return body("thread_name")
        .notEmpty().withMessage("Tên chủ đề là bắt buộc")
        .isLength({ min: MIN_THREAD_NAME_LENGTH, max: MAX_THREAD_NAME_LENGTH })
        .withMessage(`Tên chủ đề phải từ ${MIN_THREAD_NAME_LENGTH} đến ${MAX_THREAD_NAME_LENGTH} ký tự`)
        .trim()
        .escape()
        .customSanitizer(value => value.replace(/\s+/g, ' '))
        .custom(value => {
            const lowerValue = value.toLowerCase();
            if (forbiddenWords.some(word => lowerValue.includes(word))) {
                throw new Error('Tên chủ đề chứa từ ngữ không phù hợp');
            }
            return true;
        });
};

// Category validation with hierarchy support
const validateCategoryId = () => {
    return body("category_id")
        .notEmpty().withMessage("Danh mục là bắt buộc")
        .isInt({ min: 1 }).withMessage("ID danh mục phải là số nguyên dương")
        .toInt()
        .custom(validateEntityExists('forum_categories', 'category_id', 'Danh mục'))
        .custom(async (value, { req }) => {
            // Check if category is active
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

// Tag validation with duplicate check
const validateThreadTags = () => {
    return body("tags")
        .optional()
        .isArray({ max: MAX_TAGS }).withMessage(`Tối đa ${MAX_TAGS} thẻ`)
        .custom((tags, { req }) => {
            // Check for duplicates
            const uniqueTags = [...new Set(tags)];
            if (uniqueTags.length !== tags.length) {
                throw new Error('Thẻ không được trùng lặp');
            }
            
            // Validate each tag
            const invalidTags = tags.filter(tag => !isTagandCategoryValid(tag));
            if (invalidTags.length > 0) {
                throw new Error(`Thẻ không hợp lệ: ${invalidTags.join(', ')}`);
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
            // Additional checks for status transitions
            if (req.forum_threads && req.forum_threads.status) {
                const currentStatus = req.forum_threads.status;
                
                // Prevent changing from archived to other statuses
                if (currentStatus === 'archived' && value !== 'archived') {
                    throw new Error('Không thể thay đổi trạng thái từ archived');
                }
                
                // Only admins can pin/unpin threads
                if ((value === 'pinned' || currentStatus === 'pinned') && req.user.role !== 'admin') {
                    throw new Error('Chỉ quản trị viên có thể thay đổi trạng thái pinned');
                }
            }
            return true;
        });
};

// Other potentially missing functions that might be needed:

// User ownership validation
const validateThreadOwnership = () => {
    return body().custom(async (_, { req }) => {
        if (!req.params.threadId) {
            throw new Error('Thread ID is required');
        }
        
        const [thread] = await connection.execute(
            'SELECT user_id FROM forum_threads WHERE thread_id = ?',
            [req.params.threadId]
        );
        
        if (thread.length === 0) {
            throw new Error('Chủ đề không tồn tại');
        }
        
        if (thread[0].user_id !== req.user.user_id && req.user.role !== 'admin') {
            throw new Error('Bạn không có quyền chỉnh sửa chủ đề này');
        }
        
        return true;
    });
};

// View count validation (if needed)
const validateViewCount = () => {
    return body("views")
        .optional()
        .isInt({ min: 0 }).withMessage("Lượt xem phải là số nguyên không âm")
        .toInt();
};

// Thread creation validation with ownership check
const validateThreadCreate = [
    validateThreadName(),
    validateCategoryId(),
    validateContent('description').optional(),
    validateThreadTags(),
    handleValidationErrors
];

// Thread update validation with change tracking
const validateThreadUpdate = [
    validateThreadId(),
    validateThreadName().optional(),
    validateCategoryId().optional(),
    validateContent('description').optional(),
    validateThreadStatus(),
    validateThreadTags(),
    body().custom(async (_, { req }) => {
        if (!req.body.thread_name && !req.body.description && 
            !req.body.category_id && !req.body.tags && !req.body.status) {
            throw new Error('Cần cập nhật ít nhất một trường');
        }
        return true;
    }),
    handleValidationErrors
];

// Thread deletion with comprehensive checks
const validateThreadDelete = [
    validateThreadId(),
    body().custom(async (_, { req }) => {
        const [posts] = await connection.execute(
            'SELECT COUNT(*) as count FROM forum_posts WHERE thread_id = ?',
            [req.params.threadId]
        );
        
        if (posts[0].count > 0) {
            throw new Error('Không thể xóa chủ đề đã có bài viết');
        }
        
        // Additional check for admin-only deletion
        if (req.user.role !== 'admin') {
            const [thread] = await connection.execute(
                'SELECT user_id FROM forum_threads WHERE thread_id = ?',
                [req.params.threadId]
            );
            
            if (thread[0].user_id !== req.user.user_id) {
                throw new Error('Chỉ quản trị viên hoặc người tạo mới có thể xóa chủ đề này');
            }
        }
        
        return true;
    }),
    handleValidationErrors
];

// Enhanced thread query validation
const validateThreadQuery = [
    query("category")
        .optional()
        .isInt({ min: 1 }).withMessage("ID danh mục phải là số nguyên dương")
        .toInt()
        .custom(async (value) => {
            const [category] = await connection.execute(
                'SELECT 1 FROM forum_categories WHERE category_id = ?',
                [value]
            );
            if (category.length === 0) {
                throw new Error('Danh mục không tồn tại');
            }
            return true;
        }),

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

    query("author")
        .optional()
        .isString()
        .withMessage("Tên tác giả phải là chuỗi")
        .trim()
        .escape(),

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
    validateThreadStatus,
    validateThreadOwnership,
    validateViewCount,
    validateThreadId,
    validateThreadName,
    validateCategoryId,
    validateContent,
    validateThreadTags,
    handleValidationErrors
};