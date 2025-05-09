import { param, body, validationResult } from "express-validator";
import connection from "../../../config/connection.js";

// Common error formatter
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Dữ liệu không hợp lệ",
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// Common ID validator
const validateEntityExists = (table, idField = 'id') => {
  return async (value, { req }) => {
    const [result] = await connection.execute(
      `SELECT ${idField} FROM ${table} WHERE ${idField} = ?`,
      [value]
    );
    if (result.length === 0) {
      throw new Error(`${table.replace('_', ' ')} không tồn tại`);
    }
    return true;
  };
};

// Report Post Validation
export const validateReportPost = [
  param("postId")
    .notEmpty().withMessage("Post ID là bắt buộc")
    .isInt({ min: 1 }).withMessage("Post ID phải là số nguyên dương")
    .toInt()
    .custom(validateEntityExists('forum_posts', 'post_id')),

  body("reason")
    .notEmpty().withMessage("Lý do là bắt buộc")
    .isLength({ min: 10, max: 200 }).withMessage("Lý do phải từ 10-200 ký tự")
    .trim()
    .escape()
    .customSanitizer(value => value.replace(/\s+/g, ' ')), // Normalize whitespace

  handleValidationErrors
];

// Delete Post Report Validation
export const validateForumPostReportDelete = [
  param("reportId")
    .notEmpty().withMessage("ID báo cáo là bắt buộc")
    .isInt({ min: 1 }).withMessage("ID báo cáo phải là số nguyên dương")
    .toInt()
    .custom(validateEntityExists('forum_reports', 'report_id')),

  body("postId")
    .notEmpty().withMessage("ID bài viết là bắt buộc")
    .isInt({ min: 1 }).withMessage("ID bài viết phải là số nguyên dương")
    .toInt()
    .custom(async (postId, { req }) => {
      const [report] = await connection.execute(
        `SELECT post_id FROM forum_reports 
         WHERE report_id = ? AND post_id = ?`,
        [req.params.reportId, postId]
      );
      if (!report.length) {
        throw new Error('Báo cáo không thuộc về bài viết này');
      }
      return true;
    }),

  handleValidationErrors
];

// Report Comment Validation
export const validateReportComment = [
  param("commentId")
    .notEmpty().withMessage("ID bình luận là bắt buộc")
    .isInt({ min: 1 }).withMessage("ID bình luận phải là số nguyên dương")
    .toInt()
    .custom(async (commentId) => {
      const [comment] = await connection.execute(
        `SELECT comment_id FROM 
         (SELECT comment_id FROM article_comments
          UNION 
          SELECT comment_id FROM forum_comments) AS comments
         WHERE comment_id = ?`,
        [commentId]
      );
      if (!comment.length) {
        throw new Error('Bình luận không tồn tại');
      }
      return true;
    }),

  body("reason")
    .notEmpty().withMessage("Lý do là bắt buộc")
    .isLength({ min: 10, max: 500 }).withMessage("Lý do phải từ 10-500 ký tự")
    .trim()
    .escape()
    .custom(value => {
      const forbiddenWords = ['spam', 'scam', 'lừa đảo'];
      if (forbiddenWords.some(word => value.includes(word))) {
        throw new Error('Lý do chứa từ ngữ không được phép');
      }
      return true;
    }),

  body().custom(async (_, { req }) => {
    const [existing] = await connection.execute(
      `SELECT report_id FROM forum_comment_reports 
       WHERE comment_id = ? AND reported_by = ?`,
      [req.params.commentId, req.user.user_id]
    );
    if (existing.length > 0) {
      throw new Error('Bạn đã báo cáo bình luận này trước đó');
    }
    return true;
  }),

  handleValidationErrors
];

export const validateReportUpdate = [
  param("reportId")
    .notEmpty().withMessage("ID báo cáo là bắt buộc")
    .isInt({ min: 1 }).withMessage("ID báo cáo phải là số nguyên dương")
    .toInt()
    .custom(validateEntityExists('forum_reports', 'report_id')),

  body().custom(async (_, { req }) => {
    const [existing] = await connection.execute(
      `SELECT report_id FROM forum_reports 
         WHERE report_id = ?`,
      [req.params.reportId]
    );
    if (!existing.length) {
      throw new Error('Báo cáo không tồn tại');
    }
    return true;
  }),
  handleValidationErrors
]