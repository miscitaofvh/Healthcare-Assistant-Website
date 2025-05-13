import dotenv from "dotenv";
import { StatusCodes } from "http-status-codes";
import ReportDB from "../../models/Forum/report.js";

dotenv.config();

const handleError = (error, req, res, action = "process") => {
  console.error(`[${req.requestId || "no-request-id"}] Error in ${action}:`, error);

  const errorMap = {
    // Validation errors
    "Invalid comment ID": StatusCodes.BAD_REQUEST,
    "Invalid post ID": StatusCodes.BAD_REQUEST,
    "Invalid report ID": StatusCodes.BAD_REQUEST,
    "Invalid status": StatusCodes.BAD_REQUEST,

    // Not found errors
    "Comment not found": StatusCodes.NOT_FOUND,
    "Post not found": StatusCodes.NOT_FOUND,
    "Report not found": StatusCodes.NOT_FOUND,
    "No reports found": StatusCodes.NOT_FOUND,

    // Database errors
    "Database query failed": StatusCodes.INTERNAL_SERVER_ERROR,
  };

  const statusCode = errorMap[error.message] || StatusCodes.INTERNAL_SERVER_ERROR;
  const response = {
    success: false,
    message: error.message || `Failed to ${action} report`,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === "development") {
    response.debug = {
      message: error.message,
      stack: error.stack?.split("\n")[0],
    };
  }

  if (error.message.includes("Invalid")) {
    response.errorCode = "VALIDATION_ERROR";
  }

  return res.status(statusCode).json(response);
};

// Report a comment
const reportComment = async (req, res) => {
  try {
    const userId = req.user.user_id; // Assumes user_id is set by middleware
    const { commentId } = req.params;
    const { reason } = req.body;

    const result = await ReportDB.reportCommentDB(userId, commentId, reason);

    res.status(StatusCodes.OK).json({
      success: true,
      message: result,
      metadata: {
        commentId,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    handleError(error, req, res, "report comment");
  }
};

// Report a post
const reportPost = async (req, res) => {
  try {
    const userId = req.user.user_id; // Assumes user_id is set by middleware
    const { postId } = req.params;
    const { reason } = req.body;

    const result = await ReportDB.reportPostDB(userId, postId, reason);

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: result,
      metadata: {
        postId,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    handleError(error, req, res, "report post");
  }
};

// Get reports for a comment
const getReportsForComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const reports = await ReportDB.getReportsForCommentDB(commentId.trim());

    res.status(StatusCodes.OK).json({
      success: true,
      reports,
      count: reports.length,
      message: reports.length ? "Comment reports retrieved successfully" : "No reports found for this comment",
      metadata: {
        commentId,
        retrievedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    handleError(error, req, res, "fetch comment reports");
  }
};

// Get reports for a post
const getReportsForPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const reports = await ReportDB.getReportsForPostDB(postId.trim());

    res.status(StatusCodes.OK).json({
      success: true,
      reports,
      count: reports.length,
      message: reports.length ? "Post reports retrieved successfully" : "No reports found for this post",
      metadata: {
        postId,
        retrievedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    handleError(error, req, res, "fetch post reports");
  }
};

// Update report status for a comment (admin)
const updateCommentReportStatus = async (req, res) => {
  try {
    const adminId = req.user.user_id; // Assumes user_id is set by middleware
    const { reportId } = req.params;
    const { status } = req.body;

    const result = await ReportDB.updateCommentReportStatusDB(adminId, reportId, status);

    res.status(StatusCodes.OK).json({
      success: true,
      message: result,
      metadata: {
        reportId,
        updatedAt: new Date().toISOString(),
        updatedFields: ["status"],
      },
    });
  } catch (error) {
    handleError(error, req, res, "update comment report status");
  }
};

// Update report status for a post (admin)
const updatePostReportStatus = async (req, res) => {
  try {
    const adminId = req.user.user_id; // Assumes user_id is set by middleware
    const { reportId } = req.params;
    const { status } = req.body;

    const result = await ReportDB.updatePostReportStatusDB(adminId, reportId, status);

    res.status(StatusCodes.OK).json({
      success: true,
      message: result,
      metadata: {
        reportId,
        updatedAt: new Date().toISOString(),
        updatedFields: ["status"],
      },
    });
  } catch (error) {
    handleError(error, req, res, "update post report status");
  }
};

// Delete a comment report (admin)
const deleteCommentReport = async (req, res) => {
  try {
    const adminId = req.user.user_id; // Assumes user_id is set by middleware
    const { reportId } = req.params;

    const result = await ReportDB.deleteCommentReportDB(reportId);

    res.status(StatusCodes.OK).json({
      success: true,
      message: result,
      metadata: {
        reportId,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    handleError(error, req, res, "delete comment report");
  }
};

// Delete a post report (admin)
const deletePostReport = async (req, res) => {
  try {
    const adminId = req.user.user_id; // Assumes user_id is set by middleware
    const { reportId } = req.params;

    const result = await ReportDB.deletePostReportDB(reportId);

    res.status(StatusCodes.OK).json({
      success: true,
      message: result,
      metadata: {
        reportId,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    handleError(error, req, res, "delete post report");
  }
};

export default {
  reportComment,
  reportPost,
  getReportsForComment,
  getReportsForPost,
  updateCommentReportStatus,
  updatePostReportStatus,
  deleteCommentReport,
  deletePostReport,
};