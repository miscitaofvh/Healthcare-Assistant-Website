import { param, body, validationResult, query } from "express-validator";
import connection from "../../../config/connection.js";
import { isTagandCategoryValid } from "../../../utils/format/article.js";

const MAX_CATEGORY_NAME_LENGTH = 50;
const MIN_CATEGORY_NAME_LENGTH = 3;
const MAX_DESCRIPTION_LENGTH = 200;
const MIN_DESCRIPTION_LENGTH = 10;
const VALID_CATEGORY_STATUSES = ['active', 'closed', 'pinned', 'archived'];
const DEFAULT_PAGE_LIMIT = 6;
const MAX_PAGE_LIMIT = 30;

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            code: "VALIDATION_ERROR",
            message: "Invalid data",
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg,
                type: 'validation_error'
            }))
        });
    }
    next();
};

const validateCategoryId = (location = 'param') => {
    const validator = location === 'param' ? param("categoryId") : body("category_id");
    return validator
        .notEmpty().withMessage("Category ID is required")
        .isInt({ min: 1 }).withMessage("Category ID must be a positive integer")
        .toInt()
        .custom(async (value, { req }) => {
            try {
                const [result] = await connection.execute(
                    'SELECT 1 FROM forum_categories WHERE category_id = ?',
                    [value]
                );
                if (result.length === 0) {
                    throw new Error('Category does not exist');
                }
                req.category = result[0];
                return true;
            } catch (error) {
                throw new Error(`Category validation error: ${error.message}`);
            }
        });
};

const validateCategoryName = (checkUniqueness = true) => {
    const validator = body("category_name")
        .notEmpty().withMessage("Category name is required")
        .isLength({ min: MIN_CATEGORY_NAME_LENGTH, max: MAX_CATEGORY_NAME_LENGTH })
        .withMessage(`Category name must be between ${MIN_CATEGORY_NAME_LENGTH} and ${MAX_CATEGORY_NAME_LENGTH} characters`)
        .trim()
        .escape()
        .customSanitizer(value => value.replace(/\s+/g, ' '))
        .custom(value => {
            if (!isTagandCategoryValid(value)) {
                throw new Error('Category name contains invalid characters');
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
                throw new Error('Category name already exists');
            }
            return true;
        });
    }

    return validator;
};

const validateCategoryDescription = () => {
    return body("description")
        .optional()
        .isLength({ min: MIN_DESCRIPTION_LENGTH, max: MAX_DESCRIPTION_LENGTH })
        .withMessage(`Description must be between ${MIN_DESCRIPTION_LENGTH} and ${MAX_DESCRIPTION_LENGTH} characters`)
        .trim()
        .escape();
};

const validateCategoryStatus = () => {
    return body("status")
        .optional()
        .isIn(VALID_CATEGORY_STATUSES)
        .withMessage(`Status must be one of: ${VALID_CATEGORY_STATUSES.join(', ')}`);
};

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
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                code: "VALIDATION_ERROR",
                message: "Invalid data",
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

const validateCategoryUpdate = [
    validateCategoryId(),
    validateCategoryName(),
    validateCategoryDescription(),
    validateCategoryStatus().optional(),
    body().custom(async (_, { req }) => {
        if (!req.body.category_name && !req.body.description && 
            !req.body.status) {
            throw new Error('At least one field must be updated');
        }
        return true;
    }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                code: "VALIDATION_ERROR",
                message: "Invalid data",
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

const validateCategoryDelete = [
    validateCategoryId(),
    body().custom(async (_, { req }) => {
        const [threads] = await connection.execute(
            'SELECT COUNT(*) as count FROM forum_threads WHERE category_id = ?',
            [req.params.categoryId]
        );
        
        if (threads[0].count > 0) {
            throw new Error('Cannot delete category with existing threads (only admin has this permission)');
        }
        
        return true;
    }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                code: "VALIDATION_ERROR",
                message: "Invalid data",
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

const validateCategoryQuery = [
    query("status")
        .optional()
        .isIn([...VALID_CATEGORY_STATUSES, 'all'])
        .withMessage(`Status must be one of: ${VALID_CATEGORY_STATUSES.join(', ')} or 'all'`),

    query("search")
        .optional()
        .isString()
        .withMessage("Search keyword must be a string")
        .trim()
        .escape(),

    query("page")
        .optional()
        .default(1)
        .isInt({ min: 1 }).withMessage("Page number must be a positive integer")
        .toInt(),

    query("limit")
        .optional()
        .default(DEFAULT_PAGE_LIMIT)
        .isInt({ min: 1, max: MAX_PAGE_LIMIT })
        .withMessage(`Limit must be between 1 and ${MAX_PAGE_LIMIT}`)
        .toInt(),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                code: "VALIDATION_ERROR",
                message: "Invalid data",
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
    handleValidationErrors: (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                code: "VALIDATION_ERROR",
                message: "Invalid data",
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