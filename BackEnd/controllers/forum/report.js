import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import ReportDB from "../../models/Forum/report.js";

dotenv.config();

const reportComment = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { commentId } = req.params;
        const { reason } = req.body;

        const result = await ReportDB.reportCommentDB(userId, commentId, reason);

        res.status(200).json({
            success: true,
            message: result
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error reporting the comment"
        });
    }
};

const getReportsForComment = async (req, res) => {
    try {
        const { commentId } = req.params;

        if (!commentId || typeof commentId !== 'string' || commentId.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Comment ID is required and must be a non-empty string"
            });
        }

        if (!/^\d+$/.test(commentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Comment ID format"
            });
        }

        const reports = await ReportDB.getReportsForCommentDB(commentId.trim());

        res.status(200).json({
            success: true,
            data: reports,
            count: reports.length
        });

    } catch (error) {
        console.error("Error in getReportsForComment:", error);
        
        if (error.message.includes("not found")) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error while fetching reports",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const updateReportStatusForComment = async (req, res) => {
    try {
        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const admin_id = decoded.user_id;

        if (!admin_id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { commentId, reportId } = req.params; // commentId = comment_id, reportId = report_id
        const { status } = req.body; // status (e.g., "resolved", "pending", "dismissed")

        const result = await ReportDB.updateReportStatusForCommentDB(admin_id, reportId, status, commentId);

        res.status(200).json({
            success: true,
            message: result
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error updating report status for comment"
        });
    }
};

const getAllReports = async (req, res) => {
    try {
        const reports = await ReportDB.getAllReportsDB();
        res.status(200).json({
            success: true,
            data: reports
        });
    } catch (error) {
        console.error("Error getting all reports:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching reports",
            error: error.message
        });
    }
};

const getReportById = async (req, res) => {
    try {
        const report = await ReportDB.getReportByIdDB(id);
        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found"
            });
        }

        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error("Error getting report by ID:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching report",
            error: error.message
        });
    }
};

const getReportsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        const reports = await ReportDB.getReportsByUserDB(userId);
        res.status(200).json({
            success: true,
            data: reports
        });
    } catch (error) {
        console.error("Error getting user reports:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching user reports",
            error: error.message
        });
    }
};

const getReportsByPost = async (req, res) => {
    try {
        const { postId } = req.params;
        if (!postId) {
            return res.status(400).json({
                success: false,
                message: "Post ID is required"
            });
        }

        const reports = await ReportDB.getReportsByPostDB(postId);
        res.status(200).json({
            success: true,
            data: reports
        });
    } catch (error) {
        console.error("Error getting post reports:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching post reports",
            error: error.message
        });
    }
};

const createReport = async (req, res) => {
    try {
        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const userId = decoded.user_id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User ID not found"
            });
        }
        const { postId } = req.params;
        const { reason } = req.body;
        if (!postId || !reason) {
            return res.status(400).json({
                success: false,
                message: "Post ID, report type, and content are required"
            });
        }

        const result = await ReportDB.createReportDB(postId, userId, reason);
        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Error creating report:", error);
        res.status(500).json({
            success: false,
            message: "Error creating report",
            error: error.message
        });
    }
};

const updateReport = async (req, res) => {
    try {
        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const userId = decoded.user_id;
        const { id } = req.params;
        const { status, resolutionNotes } = req.body;

        if (!id || !status) {
            return res.status(400).json({
                success: false,
                message: "Report ID and status are required"
            });
        }

        const result = await ReportDB.updateReportDB(id, status, userId, resolutionNotes);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Error updating report status:", error);
        res.status(500).json({
            success: false,
            message: "Error updating report status",
            error: error.message
        });
    }
};

const updateReportAdmin = async (req, res) => {
    try {
        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const userId = decoded.user_id;
        const { id } = req.params;
        const { status, resolutionNotes } = req.body;

        if (!id || !status) {
            return res.status(400).json({
                success: false,
                message: "Report ID and status are required"
            });
        }

        const result = await ReportDB.updateReportAdminDB(id, status, userId, resolutionNotes);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Error updating report status:", error);
        res.status(500).json({
            success: false,
            message: "Error updating report status",
            error: error.message
        });
    }
};

const deleteReport = async (req, res) => {
    try {
        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const userId = decoded.user_id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User ID not found"
            });
        }

        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Report ID is required"
            });
        }

        const result = await ReportDB.deleteReportDB(id, userId);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Error deleting report:", error);
        if (error.message.includes("Unauthorized")) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: "Error deleting report",
            error: error.message
        });
    }
};

const getReportsByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required"
            });
        }

        const reports = await ReportDB.getReportsByStatusDB(status);
        res.status(200).json({
            success: true,
            data: reports
        });
    } catch (error) {
        console.error("Error getting reports by status:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching reports by status",
            error: error.message
        });
    }
};

const deleteReportById = async (req, res) => {
    try {
        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const userId = decoded.user_id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User ID not found"
            });
        }

        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Report ID is required"
            });
        }

        const result = await ReportDB.deleteReportByIdDB(id, userId);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Error deleting report:", error);
        if (error.message.includes("Unauthorized")) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: "Error deleting report",
            error: error.message
        });
    }
};

export default {
    reportComment,
    getReportsForComment,
    updateReportStatusForComment,
    getAllReports,
    getReportById,
    getReportsByUser,
    getReportsByPost,
    createReport,
    updateReport,
    updateReportAdmin,
    deleteReport,
    getReportsByStatus,
    deleteReportById
}