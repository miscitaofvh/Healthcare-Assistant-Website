import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import {
    getAllReportsDB,
    getReportByIdDB,
    getReportsByUserDB,
    getReportsByPostDB,
    createReportDB,
    updateReportStatusDB,
    deleteReportDB,
    getReportsByStatusDB,
    deleteReportByIdDB
} from "../../models/Forum/report.js";

dotenv.config();

export const getAllReports = async (req, res) => {
    try {
        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const userId = decoded.user_id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User ID not found"
            });
        }

        const reports = await getAllReportsDB();
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

export const getReportById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Report ID is required"
            });
        }

        const report = await getReportByIdDB(id);
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

export const getReportsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        const reports = await getReportsByUserDB(userId);
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

export const getReportsByPost = async (req, res) => {
    try {
        const { postId } = req.params;
        if (!postId) {
            return res.status(400).json({
                success: false,
                message: "Post ID is required"
            });
        }

        const reports = await getReportsByPostDB(postId);
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

export const createReport = async (req, res) => {
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

        const result = await createReportDB(postId, userId, reason);
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

export const updateReportStatus = async (req, res) => {
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
        const { status, resolutionNotes } = req.body;

        if (!id || !status) {
            return res.status(400).json({
                success: false,
                message: "Report ID and status are required"
            });
        }

        const result = await updateReportStatusDB(id, status, userId, resolutionNotes);
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

export const deleteReport = async (req, res) => {
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

        const result = await deleteReportDB(id, userId);
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

export const getReportsByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required"
            });
        }

        const reports = await getReportsByStatusDB(status);
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

export const deleteReportById = async (req, res) => {
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

        const result = await deleteReportByIdDB(id, userId);
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




