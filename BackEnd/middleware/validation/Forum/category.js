import { param, body, validationResult, query } from "express-validator";
import connection from "../../../config/connection.js";
import { isTagandCategoryValid } from "../../../utils/format/article.js";

// Constants
const MAX_CATEGORY_NAME_LENGTH = 50;
const MIN_CATEGORY_NAME_LENGTH = 3;
const MAX_DESCRIPTION_LENGTH = 200;
const MIN_DESCRIPTION_LENGTH = 10;
const VALID_CATEGORY_STATUSES = ['active', 'closed', 'pinned', 'archived'];
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
            }))
        });
    }
    next();
};

// Reusable validators
const validateCategoryId = (location = 'param') => {
    const validator = location === 'param' ? param("categoryId") : body("category_id");
    return validator
        .notEmpty().withMessage("ID danh mục là bắt buộc")
        .isInt({ min: 1 }).withMessage("ID danh mục phải là số nguyên dương")
        .toInt()
        .custom(async (value, { req }) => {
            try {
                const [result] = await connection.execute(
                    'SELECT * FROM forum_categories WHERE category_id = ?',
                    [value]
                );
                if (result.length === 0) {
                    throw new Error('Danh mục không tồn tại');
                }
                req.category = result[0]; // Cache category for subsequent middleware
                return true;
            } catch (error) {
                throw new Error(`Lỗi xác thực danh mục: ${error.message}`);
            }
        });
};

// Category name validation with uniqueness check
const validateCategoryName = (checkUniqueness = true) => {
    const validator = body("category_name")
        .notEmpty().withMessage("Tên danh mục là bắt buộc")
        .isLength({ min: MIN_CATEGORY_NAME_LENGTH, max: MAX_CATEGORY_NAME_LENGTH })
        .withMessage(`Tên danh mục phải từ ${MIN_CATEGORY_NAME_LENGTH} đến ${MAX_CATEGORY_NAME_LENGTH} ký tự`)
        .trim()
        .escape()
        .customSanitizer(value => value.replace(/\s+/g, ' '))
        .custom(value => {
            if (!isTagandCategoryValid(value)) {
                throw new Error('Tên danh mục chứa ký tự không hợp lệ');
            }
            return true;
        });

    if (checkUniqueness) {
        validator.custom(async (value, { req }) => {
            const [result] = await connection.execute(
                'SELECT category_id FROM forum_categories WHERE category_name = ?',
                [value]
            );
            if (result.length > 0 && result[0].category_id !== req.params?.categoryId) {
                throw new Error('Tên danh mục đã tồn tại');
            }
            return true;
        });
    }

    return validator;
};

// Category description validation
const validateCategoryDescription = () => {
    return body("description")
        .optional()
        .isLength({ min: MIN_DESCRIPTION_LENGTH, max: MAX_DESCRIPTION_LENGTH })
        .withMessage(`Mô tả phải từ ${MIN_DESCRIPTION_LENGTH} đến ${MAX_DESCRIPTION_LENGTH} ký tự`)
        .trim()
        .escape();
};

// Category status validation
const validateCategoryStatus = () => {
    return body("status")
        .optional()
        .isIn(VALID_CATEGORY_STATUSES)
        .withMessage(`Trạng thái phải là một trong: ${VALID_CATEGORY_STATUSES.join(', ')}`);
};

// Category parent validation
const validateParentCategory = () => {
    return body("parent_id")
        .optional()
        .isInt({ min: 0 }).withMessage("ID danh mục cha phải là số nguyên dương")
        .toInt()
        .custom(async (value) => {
            if (value === 0) return true; // 0 means no parent
            
            const [result] = await connection.execute(
                'SELECT category_id FROM forum_categories WHERE category_id = ?',
                [value]
            );
            if (result.length === 0) {
                throw new Error('Danh mục cha không tồn tại');
            }
            return true;
        });
};

// Category creation validation
const validateCategoryExists = [
    validateCategoryId(), 
    handleValidationErrors
];

const validateCategoryExistsByName = [
    validateCategoryName()
];
const validateCategoryCreate = [
    validateCategoryName(),
    validateCategoryDescription(),
    validateCategoryStatus(),
    validateParentCategory(),
    (req, res, next) => {
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
    }
];

// Category update validation
const validateCategoryUpdate = [
    validateCategoryId(),
    validateCategoryName(),
    validateCategoryDescription(),
    validateCategoryStatus().optional(),
    validateParentCategory().optional(),
    body().custom(async (_, { req }) => {
        if (!req.body.category_name && !req.body.description && 
            !req.body.status && !req.body.parent_id) {
            throw new Error('Cần cập nhật ít nhất một trường');
        }
        return true;
    }),
    (req, res, next) => {
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
    }
];

// Category deletion validation
const validateCategoryDelete = [
    validateCategoryId(),
    body().custom(async (_, { req }) => {
        // Check if category has threads
        const [threads] = await connection.execute(
            'SELECT COUNT(*) as count FROM forum_threads WHERE category_id = ?',
            [req.params.categoryId]
        );
        
        if (threads[0].count > 0) {
            throw new Error('Không thể xóa danh mục đã có chủ đề');
        }

        // Check if category has subcategories
        const [subcategories] = await connection.execute(
            'SELECT COUNT(*) as count FROM forum_categories WHERE parent_id = ?',
            [req.params.categoryId]
        );
        
        if (subcategories[0].count > 0) {
            throw new Error('Không thể xóa danh mục có danh mục con');
        }

        // Additional check for admin-only deletion
        if (req.user.role !== 'admin') {
            throw new Error('Chỉ quản trị viên mới có thể xóa danh mục');
        }
        
        return true;
    }),
    (req, res, next) => {
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
    }
];

// Category query validation
const validateCategoryQuery = [
    query("status")
        .optional()
        .isIn([...VALID_CATEGORY_STATUSES, 'all'])
        .withMessage(`Trạng thái phải là một trong: ${VALID_CATEGORY_STATUSES.join(', ')} hoặc 'all'`),

    query("search")
        .optional()
        .isString()
        .withMessage("Từ khóa tìm kiếm phải là chuỗi")
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

    (req, res, next) => {
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
    }
];

export default {
    // Category validators
    validateCategoryCreate,
    validateCategoryUpdate,
    validateCategoryDelete,
    validateCategoryQuery,
    validateCategoryExists,
    validateCategoryExistsByName,
    
    // Reusable validators
    validateCategoryId,
    validateCategoryName,
    validateCategoryDescription,
    validateCategoryStatus,
    validateParentCategory,
    handleValidationErrors: (req, res, next) => {
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
    }
};