import { param, body, validationResult } from "express-validator";
import connection from "../../../config/connection.js";

// Constants
const MIN_REASON_LENGTH = 10;
const MAX_POST_REASON_LENGTH = 200;
const MAX_COMMENT_REASON_LENGTH = 500;
const VALID_REPORT_STATUSES = ["pending", "resolved", "dismissed"];
const FORBIDDEN_WORDS = ["spam", "scam", "lừa đảo", "quảng cáo"];

// Common error formatter
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Dữ liệu không hợp lệ",
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
        type: "validation_error",
      })),
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

// Common ID validator
const validateEntityExists = (table, idField, entityName) => {
  return async (value, { req }) => {
    const [result] = await connection.execute(`SELECT * FROM ${table} WHERE ${idField} = ?`, [value]);
    if (result.length === 0) {
      throw new Error(`${entityName} không tồn tại`);
    }
    req[table] = result[0]; // Attach entity to request for later use
    return true;
  };
};

// Reusable validators
const validateReportId = (table, location = "param") => {
  const validator = location === "param" ? param("reportId") : body("reportId");
  return validator
    .notEmpty()
    .withMessage("ID báo cáo là bắt buộc")
    .isInt({ min: 1 })
    .withMessage("ID báo cáo phải là số nguyên dương")
    .toInt()
    .custom(validateEntityExists(table, "report_id", "Báo cáo"));
};

const validatePostId = (location = "param") => {
  const validator = location === "param" ? param("postId") : body("postId");
  return validator
    .notEmpty()
    .withMessage("ID bài viết là bắt buộc")
    .isInt({ min: 1 })
    .withMessage("ID bài viết phải là số nguyên dương")
    .toInt()
    .custom(validateEntityExists("forum_posts", "post_id", "Bài viết"));
};

const validateCommentId = (location = "param") => {
  const validator = location === "param" ? param("commentId") : body("commentId");
  return validator
    .notEmpty()
    .withMessage("ID bình luận là bắt buộc")
    .isInt({ min: 1 })
    .withMessage("ID bình luận phải là số nguyên dương")
    .toInt()
    .custom(validateEntityExists("forum_comments", "comment_id", "Bình luận"));
};

const validateReason = (maxLength = MAX_POST_REASON_LENGTH) => {
  return body("reason")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Lý do là bắt buộc")
    .isLength({ min: MIN_REASON_LENGTH, max: maxLength })
    .withMessage(`Lý do phải từ ${MIN_REASON_LENGTH} đến ${maxLength} ký tự`)
    .customSanitizer((value) => value.replace(/\s+/g, " "))
    .custom((value) => {
      if (FORBIDDEN_WORDS.some((word) => value.toLowerCase().includes(word))) {
        throw new Error("Lý do chứa từ ngữ không được phép");
      }
      return true;
    });
};

const validateStatus = () => {
  return body("status")
    .notEmpty()
    .withMessage("Trạng thái là bắt buộc")
    .isString()
    .withMessage("Trạng thái phải là chuỗi")
    .trim()
    .toLowerCase()
    .isIn(VALID_REPORT_STATUSES)
    .withMessage(`Trạng thái không hợp lệ. Chấp nhận: ${VALID_REPORT_STATUSES.join(", ")}`);
};

// Validation sets
export const validateReportPost = [
  validatePostId("param"),
  validateReason(MAX_POST_REASON_LENGTH),
  handleValidationErrors,
];

export const validateReportComment = [
  validateCommentId("param"),
  validateReason(MAX_COMMENT_REASON_LENGTH),
  handleValidationErrors,
];

export const validateReportUpdate = [
  validateStatus(),
  handleValidationErrors,
];

export const validateReportExists = [
  (req, res, next) => {
    // Dynamically choose table based on route
    const table = req.path.includes("/comments/") ? "forum_comment_reports" : "forum_post_reports";
    return validateReportId(table, "param")(req, res, next);
  },
  handleValidationErrors,
];

export default {
  validateReportPost,
  validateReportComment,
  validateReportUpdate,
  validateReportExists,

  // Reusable validators
  validateReportId,
  validatePostId,
  validateCommentId,
  validateReason,
  validateStatus,
  handleValidationErrors,
};