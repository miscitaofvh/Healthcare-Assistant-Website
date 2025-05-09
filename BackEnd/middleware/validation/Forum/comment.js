import { param, body, validationResult, query } from "express-validator";
import connection from "../../../config/connection.js";
import { isTagandCategoryValid } from "../../../utils/format/article.js";

export const validatecommentPost = [
    // Validate postId
    body("postId")
        .notEmpty()
        .withMessage("ID bài viết là bắt buộc")
        .isInt({ min: 1 })
        .withMessage("ID bài viết phải là số nguyên dương")
        .toInt()
        .custom(async (postId, { req }) => {
            // Check if post exists in database
            const [post] = await connection.execute(
                'SELECT post_id FROM forum_posts WHERE post_id = ?', 
                [postId]
            );
            if (post.length === 0) {
                throw new Error('Bài viết không tồn tại');
            }
            return true;
        }),
    
    // Validate content
    body("content")
        .notEmpty()
        .withMessage("Nội dung là bắt buộc")
        .isLength({ min: 1, max: 2000 })
        .withMessage("Nội dung phải từ 1 đến 2000 ký tự")
        .trim()
        .escape(), // Sanitize HTML
    
    // Handle validation errors
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }));
            
            return res.status(400).json({
                success: false,
                message: "Dữ liệu không hợp lệ",
                errors: errorMessages
            });
        }
        next();
    }
];

export const validatereplyComment = [
    // Validate postId
    body("commentId")
        .notEmpty()
        .withMessage("ID bình luận là bắt buộc")
        .isInt({ min: 1 })
        .withMessage("ID bình luận phải là số nguyên dương")
        .toInt()
        .custom(async (commentId, { req }) => {
            // Check if post exists in database
            const [comment] = await connection.execute(
                'SELECT comment_id FROM forum_comments WHERE comment_id = ?', 
                [commentId]
            );
            if (comment.length === 0) {
                throw new Error('Bình luận không tồn tại');
            }
            return true;
        }),
    
    // Validate content
    body("content")
        .notEmpty()
        .withMessage("Nội dung là bắt buộc")
        .isLength({ min: 1, max: 2000 })
        .withMessage("Nội dung phải từ 1 đến 2000 ký tự")
        .trim()
        .escape(), // Sanitize HTML
    
    // Handle validation errors
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }));
            
            return res.status(400).json({
                success: false,
                message: "Dữ liệu không hợp lệ",
                errors: errorMessages
            });
        }
        next();
    }
];

export const validateupdateComment = [
    // Validate postId
    body("commentId")
        .notEmpty()
        .withMessage("ID bình luận là bắt buộc")
        .isInt({ min: 1 })
        .withMessage("ID bình luận phải là số nguyên dương")
        .toInt()
        .custom(async (commentId, { req }) => {
            // Check if post exists in database
            const [comment] = await connection.execute(
                'SELECT comment_id FROM forum_comments WHERE comment_id = ?', 
                [commentId]
            );
            if (comment.length === 0) {
                throw new Error('Bình luận không tồn tại');
            }
            return true;
        }),
    
    // Validate content
    body("content")
        .notEmpty()
        .withMessage("Nội dung là bắt buộc")
        .isLength({ min: 1, max: 2000 })
        .withMessage("Nội dung phải từ 1 đến 2000 ký tự")
        .trim()
        .escape(), // Sanitize HTML
    
    // Handle validation errors
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }));
            
            return res.status(400).json({
                success: false,
                message: "Dữ liệu không hợp lệ",
                errors: errorMessages
            });
        }
        next();
    }
];

export const validateComment = [
    // Validate postId
    body("commentId")
        .notEmpty()
        .withMessage("ID bình luận là bắt buộc")
        .isInt({ min: 1 })
        .withMessage("ID bình luận phải là số nguyên dương")
        .toInt()
        .custom(async (commentId, { req }) => {
            // Check if post exists in database
            const [comment] = await connection.execute(
                'SELECT comment_id FROM forum_comments WHERE comment_id = ?', 
                [commentId]
            );
            if (comment.length === 0) {
                throw new Error('Bình luận không tồn tại');
            }
            return true;
        }),
    
    // Handle validation errors
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }));
            
            return res.status(400).json({
                success: false,
                message: "Dữ liệu không hợp lệ",
                errors: errorMessages
            });
        }
        next();
    }
];

export const validateForumPostCommentDelete = [
    // Validate postId with database check
    body("postId")
        .notEmpty()
        .withMessage("ID bài viết là bắt buộc")
        .isInt({ min: 1 })
        .withMessage("ID bài viết phải là số nguyên dương")
        .toInt()
        .custom(async (postId) => {
            const [post] = await connection.execute(
                'SELECT post_id FROM forum_posts WHERE post_id = ?', 
                [postId]
            );
            if (!post.length) {
                throw new Error('Bài viết không tồn tại');
            }
            return true;
        }),

    // Validate commentId with relationship check
    body("commentId")
        .notEmpty()
        .withMessage("ID bình luận là bắt buộc")
        .isInt({ min: 1 })
        .withMessage("ID bình luận phải là số nguyên dương")
        .toInt()
        .custom(async (commentId, { req }) => {
            const [comment] = await connection.execute(
                'SELECT comment_id FROM forum_comments WHERE comment_id = ? AND post_id = ?',
                [commentId, req.body.postId]
            );
            if (!comment.length) {
                throw new Error('Bình luận không tồn tại hoặc không thuộc bài viết này');
            }
            return true;
        }),

    // Error handling middleware
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const formattedErrors = errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }));

            return res.status(400).json({
                success: false,
                message: "Dữ liệu không hợp lệ",
                errors: formattedErrors
            });
        }
        next();
    }
];

export const validateForumPostCommentReport = [
    // Validate postId with existence check
    body("postId")
        .notEmpty()
        .withMessage("ID bài viết là bắt buộc")
        .isInt({ min: 1 })
        .withMessage("ID bài viết phải là số nguyên dương")
        .toInt()
        .custom(async (postId) => {
            const [post] = await connection.execute(
                'SELECT post_id FROM forum_posts WHERE post_id = ?', 
                [postId]
            );
            if (!post.length) {
                throw new Error('Bài viết không tồn tại');
            }
            return true;
        }),

    // Validate commentId with relationship check
    body("commentId")
        .notEmpty()
        .withMessage("ID bình luận là bắt buộc")
        .isInt({ min: 1 })
        .withMessage("ID bình luận phải là số nguyên dương")
        .toInt()
        .custom(async (commentId, { req }) => {
            const [comment] = await connection.execute(
                'SELECT comment_id FROM forum_comments WHERE comment_id = ? AND post_id = ?',
                [commentId, req.body.postId]
            );
            if (!comment.length) {
                throw new Error('Bình luận không tồn tại hoặc không thuộc bài viết này');
            }
            return true;
        }),

    // Validate reason with length and profanity check
    body("reason")
        .notEmpty()
        .withMessage("Lý do báo cáo là bắt buộc")
        .isString()
        .withMessage("Lý do báo cáo phải là chuỗi")
        .trim()
        .escape() // Sanitize HTML
        .isLength({ min: 10, max: 500 })
        .withMessage("Lý do báo cáo phải từ 10 đến 500 ký tự")
        .custom(reason => {
            const forbiddenWords = ['spam', 'quảng cáo', 'lừa đảo']; // Add your forbidden words
            if (forbiddenWords.some(word => reason.toLowerCase().includes(word))) {
                throw new Error('Lý do báo cáo chứa từ ngữ không phù hợp');
            }
            return true;
        }),

    // Check for duplicate reports
    body().custom(async (_, { req }) => {
        const userId = req.user.user_id;
        const { commentId, reason } = req.body;
        const [existingReport] = await connection.execute(
            'SELECT report_id FROM forum_comment_reports WHERE comment_id = ? AND reported_by = ? AND reason = ?',
            [commentId, userId, reason]
        );
        if (existingReport.length) {
            throw new Error('Bạn đã báo cáo bình luận này trước đó');
        }
        return true;
    }),

    // Error handling middleware
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const formattedErrors = errors.array().map(err => ({
                field: err.param,
                message: err.msg,
                type: 'validation_error'
            }));

            return res.status(400).json({
                success: false,
                message: "Dữ liệu không hợp lệ",
                errors: formattedErrors,
                error_code: 'VALIDATION_FAILED'
            });
        }
        next();
    }
];