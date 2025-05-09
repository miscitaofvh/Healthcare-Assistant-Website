import { param, body, validationResult, query } from "express-validator";
import connection from "../../config/connection.js";

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


const validateUserExists = [
    param('username')
        .isString().withMessage('Tên người dùng phải là chuỗi')
        .trim()
        .escape()
        .custom(validateEntityExists('users', 'username', 'Người dùng'))
        .custom(async (username) => {
            const [user] = await connection.execute(
                'SELECT status FROM users WHERE username = ?',
                [username]
            );
            if (user[0].status !== 'active') {
                throw new Error('Người dùng này hiện không hoạt động');
            }
            return true;
        }),
    handleValidationErrors
];

export default {
    validateUserExists
};