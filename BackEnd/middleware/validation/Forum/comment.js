import { param, body, validationResult } from "express-validator";
import connection from "../../../config/connection.js";

// Constants
const MAX_CONTENT_LENGTH = 2000;
const MIN_CONTENT_LENGTH = 1;
const MAX_REASON_LENGTH = 500;
const MIN_REASON_LENGTH = 10;
const FORBIDDEN_WORDS = ['spam', 'quảng cáo', 'lừa đảo'];

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

const validateContent = (field = "content", min = MIN_CONTENT_LENGTH, max = MAX_CONTENT_LENGTH) => {
    return body(field)
        .notEmpty().withMessage(`${field === "content" ? "Nội dung" : "Lý do"} là bắt buộc`)
        .isLength({ min, max }).withMessage(`${field === "content" ? "Nội dung" : "Lý do"} phải từ ${min} đến ${max} ký tự`)
        .trim()
        .escape();
};

const validateId = (field, entityName, location = 'body') => {
    const validator = location === 'body' ? body(field) : param(field);
    return validator
        .notEmpty().withMessage(`${entityName} là bắt buộc`)
        .isInt({ min: 1 }).withMessage(`${entityName} phải là số nguyên dương`)
        .toInt();
};

const validateCommentId = (location = 'body', field = 'commentId') => {
    return validateId(field, 'ID bình luận', location)
        .custom(validateEntityExists('forum_comments', 'comment_id', 'Bình luận'));
};

const validatePostId = (location = 'body', field = 'postId') => {
    return validateId(field, 'ID bài viết', location)
        .custom(validateEntityExists('forum_posts', 'post_id', 'Bài viết'));
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

// Custom validations
const validateCommentOwnership = async (commentId, { req }) => {
    const [comment] = await connection.execute(
        'SELECT user_id FROM forum_comments WHERE comment_id = ?',
        [commentId]
    );
    
    if (!comment.length) {
        throw new Error('Bình luận không tồn tại');
    }
    
    if (comment[0].user_id !== req.user?.user_id) {
        throw new Error('Bạn không có quyền thao tác với bình luận này');
    }
    
    return true;
};

const validateCommentInPost = async (commentId, { req }) => {
    const postId = req.body.postId || req.params.postId;
    if (!postId) throw new Error('Thiếu ID bài viết');
    
    const [comment] = await connection.execute(
        'SELECT comment_id FROM forum_comments WHERE comment_id = ? AND post_id = ?',
        [commentId, postId]
    );
    
    if (!comment.length) {
        throw new Error('Bình luận không tồn tại hoặc không thuộc bài viết này');
    }
    
    return true;
};

const validateReportReason = () => {
    return validateContent('reason', MIN_REASON_LENGTH, MAX_REASON_LENGTH)
        .custom(reason => {
            if (FORBIDDEN_WORDS.some(word => reason.toLowerCase().includes(word))) {
                throw new Error('Lý do báo cáo chứa từ ngữ không phù hợp');
            }
            return true;
        });
};

const validateDuplicateReport = async (_, { req }) => {
    const userId = req.user?.user_id;
    if (!userId) throw new Error('Người dùng không hợp lệ');

    const [existingReport] = await connection.execute(
        'SELECT report_id FROM forum_comment_reports WHERE comment_id = ? AND reported_by = ?',
        [req.body.commentId, userId]
    );
    
    if (existingReport.length) {
        throw new Error('Bạn đã báo cáo bình luận này trước đó');
    }
    
    return true;
};

// Validation sets
const validateCommentExists = [
    validateCommentId('param'),
    handleValidationErrors
];

const validateCommentPost = [
    validatePostId(),
    validateContent(),
    handleValidationErrors
];

const validateReplyComment = [
    validateCommentId('body'),
    validateContent(),
    handleValidationErrors
];

const validateUpdateComment = [
    validateCommentId('body'),
    validateContent(),
    body().custom(async (_, { req }) => {
        await validateCommentOwnership(req.body.commentId, { req });
        return true;
    }),
    handleValidationErrors
];

const validateDeleteComment = [
    validatePostId(),
    validateCommentId('body'),
    body().custom(async (_, { req }) => {
        await validateCommentInPost(req.body.commentId, { req });
        return true;
    }),
    body().custom(async (_, { req }) => {
        // Allow admin to delete any comment
        if (req.user?.role !== 'admin') {
            await validateCommentOwnership(req.body.commentId, { req });
        }
        return true;
    }),
    handleValidationErrors
];

const validateReportComment = [
    validatePostId(),
    validateCommentId('body'),
    validateReportReason(),
    validateDuplicateReport,
    handleValidationErrors
];

export default {
    validateCommentExists,
    validateCommentPost,
    validateReplyComment,
    validateUpdateComment,
    validateDeleteComment,
    validateReportComment,
    
    // Utility validators for reuse
    validateCommentId,
    validatePostId,
    validateContent,
    handleValidationErrors
};