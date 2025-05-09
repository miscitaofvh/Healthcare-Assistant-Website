import { param, body, validationResult } from "express-validator";
import connection from "../../../config/connection.js";

// Constants
const MIN_REASON_LENGTH = 10;
const MAX_POST_REASON_LENGTH = 200;
const MAX_COMMENT_REASON_LENGTH = 500;
const VALID_REPORT_STATUSES = ['pending', 'resolved', 'rejected', 'dismissed'];
const FORBIDDEN_WORDS = ['spam', 'scam', 'lừa đảo', 'quảng cáo'];

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
        message: err.msg,
        type: 'validation_error'
      })),
      timestamp: new Date().toISOString()
    });
  }
  next();
};

// Common ID validator
const validateEntityExists = (table, idField = 'id', entityName) => {
  return async (value, { req }) => {
    const [result] = await connection.execute(
      `SELECT * FROM ${table} WHERE ${idField} = ?`,
      [value]
    );
    if (result.length === 0) {
      throw new Error(`${entityName || table.replace('_', ' ')} không tồn tại`);
    }
    req[table] = result[0]; // Attach entity to request for later use
    return true;
  };
};

// Reusable validators
const validateReportId = (location = 'param') => {
  const validator = location === 'param' ? param('reportId') : body('reportId');
  return validator
    .notEmpty().withMessage('ID báo cáo là bắt buộc')
    .isInt({ min: 1 }).withMessage('ID báo cáo phải là số nguyên dương')
    .toInt()
    .custom(validateEntityExists('forum_reports', 'report_id', 'Báo cáo'));
};

const validatePostId = (location = 'param') => {
  const validator = location === 'param' ? param('postId') : body('postId');
  return validator
    .notEmpty().withMessage('ID bài viết là bắt buộc')
    .isInt({ min: 1 }).withMessage('ID bài viết phải là số nguyên dương')
    .toInt()
    .custom(validateEntityExists('forum_posts', 'post_id', 'Bài viết'));
};

const validateCommentId = (location = 'param') => {
  const validator = location === 'param' ? param('commentId') : body('commentId');
  return validator
    .notEmpty().withMessage('ID bình luận là bắt buộc')
    .isInt({ min: 1 }).withMessage('ID bình luận phải là số nguyên dương')
    .toInt()
    .custom(validateEntityExists('forum_comments', 'comment_id', 'Bình luận'));
};

const validateReason = (maxLength = MAX_POST_REASON_LENGTH) => {
  return body('reason')
    .trim()
    .escape()
    .notEmpty().withMessage('Lý do là bắt buộc')
    .isLength({ min: MIN_REASON_LENGTH, max: maxLength })
    .withMessage(`Lý do phải từ ${MIN_REASON_LENGTH} đến ${maxLength} ký tự`)
    .customSanitizer(value => value.replace(/\s+/g, ' '))
    .custom(value => {
      if (FORBIDDEN_WORDS.some(word => value.toLowerCase().includes(word))) {
        throw new Error('Lý do chứa từ ngữ không được phép');
      }
      return true;
    });
};

const validateStatus = (field = 'status') => {
  return body(field)
    .optional()
    .isString().withMessage('Trạng thái phải là chuỗi')
    .trim()
    .toLowerCase()
    .isIn(VALID_REPORT_STATUSES)
    .withMessage(`Trạng thái không hợp lệ. Chấp nhận: ${VALID_REPORT_STATUSES.join(', ')}`);
};

// Custom validations
const validateReportOwnership = async (reportId, { req }) => {
  const [report] = await connection.execute(
    `SELECT reported_by FROM forum_reports WHERE report_id = ?`,
    [reportId]
  );
  
  if (report.length === 0) {
    throw new Error('Báo cáo không tồn tại');
  }
  
  if (report[0].reported_by !== req.user.user_id && req.user.role !== 'admin') {
    throw new Error('Bạn không có quyền thao tác với báo cáo này');
  }
  
  return true;
};

const validateDuplicateReport = async (_, { req }) => {
  const userId = req.user.user_id;
  const reportType = req.params.commentId ? 'comment' : 'post';
  const idField = reportType === 'comment' ? 'comment_id' : 'post_id';
  const idValue = req.params.commentId || req.params.postId;
  
  const [existing] = await connection.execute(
    `SELECT report_id FROM forum_${reportType}_reports 
     WHERE ${idField} = ? AND reported_by = ? AND resolved = 0`,
    [idValue, userId]
  );
  
  if (existing.length > 0) {
    throw new Error(`Bạn đã báo cáo ${reportType === 'comment' ? 'bình luận' : 'bài viết'} này trước đó`);
  }
  
  return true;
};

// Validation sets
export const validateReportPost = [
  validatePostId('param'),
  validateReason(),
  validateDuplicateReport,
  handleValidationErrors
];

export const validateDeletePostReport = [
  validateReportId('param'),
  validatePostId('body'),
  body().custom(async (_, { req }) => {
    const [report] = await connection.execute(
      `SELECT post_id FROM forum_reports 
       WHERE report_id = ? AND post_id = ?`,
      [req.params.reportId, req.body.postId]
    );
    if (!report.length) {
      throw new Error('Báo cáo không thuộc về bài viết này');
    }
    return true;
  }),
  handleValidationErrors
];

export const validateReportComment = [
  validateCommentId('param'),
  validateReason(MAX_COMMENT_REASON_LENGTH),
  validateDuplicateReport,
  handleValidationErrors
];

export const validateReportUpdate = [
  validateReportId('param'),
  validateStatus(),
  body().custom(async (_, { req }) => {
    if (req.user.role !== 'admin') {
      await validateReportOwnership(req.params.reportId, { req });
    }
    return true;
  }),
  handleValidationErrors
];

export const validateReportExists = [
  validateReportId('param'),
  handleValidationErrors
];

export const validateReportStatus = [
  validateStatus(),
  handleValidationErrors
];

export default {
  validateReportPost,
  validateDeletePostReport,
  validateReportComment,
  validateReportUpdate,
  validateReportExists,
  validateReportStatus,
  
  // Reusable validators
  validateReportId,
  validatePostId,
  validateCommentId,
  validateReason,
  validateStatus,
  handleValidationErrors
};