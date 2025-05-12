import connection from '../../config/connection.js';

const reportCommentDB = async (userId, commentId, reason) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = `
            INSERT INTO forum_comment_reports (reported_by, comment_id, reason, status, created_at)
            VALUES (?, ?, ?, 'pending', NOW())
        `;
        await conn.execute(sql, [userId, commentId, reason]);
        await conn.commit();
        return "Comment reported successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error reporting comment:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

const getReportsForCommentDB = async (commentId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        
        const [reports] = await conn.execute(`
            SELECT 
                r.report_id, 
                r.reason, 
                r.status, 
                r.created_at,
                r.reviewed_at,
                u.username AS reported_by, 
                u.user_id,
                reviewer.username AS reviewed_by
            FROM forum_comment_reports r
            JOIN users u ON r.user_id = u.user_id
            LEFT JOIN users reviewer ON r.reviewed_by = reviewer.user_id
            WHERE r.comment_id = ?
            ORDER BY 
                CASE WHEN r.status = 'pending' THEN 0 ELSE 1 END,
                r.created_at DESC
        `, [commentId]);

        return reports;
    } catch (error) {
        console.error("Error in getReportsForCommentDB:", error);
        throw error; 
    } finally {
        if (conn) conn.release();
    }
};

const updateReportStatusForCommentDB = async (adminId, reportId, status, commentId) => {
    let conn;
    try {
        if (!adminId || !reportId || !status || !commentId) {
            throw new Error("Missing required fields");
        }

        if (!['pending', 'resolved', 'dismissed'].includes(status)) {
            throw new Error("Invalid status");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Check if report exists
        const [report] = await conn.execute(
            "SELECT report_id FROM forum_comment_reports WHERE report_id = ? AND comment_id = ?",
            [reportId, commentId]
        );

        if (!report[0]) {
            throw new Error("Report not found");
        }

        const sql = `
            UPDATE forum_comment_reports
            SET status = ?, reviewed_by = ?, reviewed_at = NOW()
            WHERE report_id = ? AND comment_id = ?
        `;
        await conn.execute(sql, [status, adminId, reportId, commentId]);
        await conn.commit();
        return "Report status updated successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error updating report status:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

const getAllReportsDB = async () => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT 
                r.report_id, r.report_type, r.report_content,
                r.status, r.created_at, r.resolved_at,
                r.resolved_by, r.resolution_notes,
                u.username AS reporter,
                p.post_id, p.content AS post_content,
                t.thread_name, c.category_name
            FROM forum_reports r
            LEFT JOIN users u ON r.user_id = u.user_id
            LEFT JOIN forum_posts p ON r.post_id = p.post_id
            LEFT JOIN forum_threads t ON p.thread_id = t.thread_id
            LEFT JOIN forum_categories c ON t.category_id = c.category_id
            ORDER BY r.created_at DESC
        `;
        const [reports] = await conn.execute(sql);
        await conn.commit();
        return reports;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting reports:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

const getReportByIdDB = async (reportId) => {
    let conn;
    try {
        if (!reportId) {
            throw new Error("Report ID is required");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT 
                r.report_id, r.report_type, r.report_content,
                r.status, r.created_at, r.resolved_at,
                r.resolved_by, r.resolution_notes,
                u.username AS reporter,
                p.post_id, p.content AS post_content,
                t.thread_name, c.category_name
            FROM forum_reports r
            LEFT JOIN users u ON r.user_id = u.user_id
            LEFT JOIN forum_posts p ON r.post_id = p.post_id
            LEFT JOIN forum_threads t ON p.thread_id = t.thread_id
            LEFT JOIN forum_categories c ON t.category_id = c.category_id
            WHERE r.report_id = ?
        `;
        const [report] = await conn.execute(sql, [reportId]);
        await conn.commit();
        return report[0] || null;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting report:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

const getReportsByUserDB = async (userId) => {
    let conn;
    try {
        if (!userId) {
            throw new Error("User ID is required");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT 
                r.report_id, r.report_type, r.report_content,
                r.status, r.created_at, r.resolved_at,
                r.resolved_by, r.resolution_notes,
                u.username AS reporter,
                p.post_id, p.content AS post_content,
                t.thread_name, c.category_name
            FROM forum_reports r
            LEFT JOIN users u ON r.user_id = u.user_id
            LEFT JOIN forum_posts p ON r.post_id = p.post_id
            LEFT JOIN forum_threads t ON p.thread_id = t.thread_id
            LEFT JOIN forum_categories c ON t.category_id = c.category_id
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC
        `;
        const [reports] = await conn.execute(sql, [userId]);
        await conn.commit();
        return reports;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting user reports:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

const getReportsByPostDB = async (postId) => {
    let conn;
    try {
        if (!postId) {
            throw new Error("Post ID is required");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT 
                r.report_id, r.report_type, r.report_content,
                r.status, r.created_at, r.resolved_at,
                r.resolved_by, r.resolution_notes,
                u.username AS reporter
            FROM forum_reports r
            LEFT JOIN users u ON r.user_id = u.user_id
            WHERE r.post_id = ?
            ORDER BY r.created_at DESC
        `;
        const [reports] = await conn.execute(sql, [postId]);
        await conn.commit();
        return reports;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting post reports:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

const createReportDB = async (postId, userId, reason) => {
    let conn;
    try {
        if (!postId || !userId || !reason) {
            throw new Error("Post ID, user ID, report type, and content are required");
        }

        if (reason.length > 1000) {
            throw new Error("Report content must be less than 1000 characters");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Check if post exists
        const [post] = await conn.execute(
            "SELECT post_id FROM forum_posts WHERE post_id = ?",
            [postId]
        );

        if (!post[0]) {
            throw new Error("Post not found");
        }

        // Check if user has already reported this post
        const [existingReport] = await conn.execute(
            "SELECT report_id FROM forum_reports WHERE post_id = ? AND reported_by = ? AND status = 'Pending' AND reason = ?",
            [postId, userId, reason]
        );

        if (existingReport[0]) {
            throw new Error("You have already reported this post with this reason");
        }

        const sql = `
            INSERT INTO forum_reports (post_id, reported_by, reason, created_at)
            VALUES (?, ?, ?, NOW())
        `;
        const [result] = await conn.execute(sql, [postId, userId, reason]);
        await conn.commit();
        return { reportId: result.insertId };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error creating report:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

const updateReportDB = async (reportId, status, resolvedBy, resolutionNotes) => {
    let conn;
    try {
        if (!reportId || !status || !resolvedBy) {
            throw new Error("Report ID, status, and resolver ID are required");
        }

        if (resolutionNotes && resolutionNotes.length > 1000) {
            throw new Error("Resolution notes must be less than 1000 characters");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Check if report exists
        const [report] = await conn.execute(
            "SELECT report_id FROM forum_reports WHERE report_id = ?",
            [reportId]
        );

        if (!report[0]) {
            throw new Error("Report not found");
        }

        const sql = `
            UPDATE forum_reports
            SET status = ?, resolved_by = ?, resolution_notes = ?, resolved_at = NOW()
            WHERE report_id = ?
        `;
        await conn.execute(sql, [status, resolvedBy, resolutionNotes, reportId]);
        await conn.commit();
        return "Report status updated successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error updating report status:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

const updateReportAdminDB = async (reportId, status, resolvedBy, resolutionNotes) => {
    let conn;
    try {
        if (!reportId || !status || !resolvedBy) {
            throw new Error("Report ID, status, and resolver ID are required");
        }

        if (resolutionNotes && resolutionNotes.length > 1000) {
            throw new Error("Resolution notes must be less than 1000 characters");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Check if report exists
        const [report] = await conn.execute(
            "SELECT report_id FROM forum_reports WHERE report_id = ?",
            [reportId]
        );

        if (!report[0]) {
            throw new Error("Report not found");
        }

        const sql = `
            UPDATE forum_reports
            SET status = ?, resolved_by = ?, resolution_notes = ?, resolved_at = NOW()
            WHERE report_id = ?
        `;
        await conn.execute(sql, [status, resolvedBy, resolutionNotes, reportId]);
        await conn.commit();
        return "Report status updated successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error updating report status:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

const deleteReportDB = async (reportId, userId) => {
    let conn;
    try {
        if (!reportId || !userId) {
            throw new Error("Report ID and user ID are required");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Check if report exists and user is authorized
        const [report] = await conn.execute(
            "SELECT user_id FROM forum_reports WHERE report_id = ?",
            [reportId]
        );

        if (!report[0]) {
            throw new Error("Report not found");
        }

        if (report[0].user_id !== userId) {
            throw new Error("Unauthorized: You can only delete your own reports");
        }

        await conn.execute("DELETE FROM forum_reports WHERE report_id = ?", [reportId]);
        await conn.commit();
        return "Report deleted successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error deleting report:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

const getReportsByStatusDB = async (status) => {
    let conn;
    try {
        if (!status) {
            throw new Error("Status is required");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT 
                r.report_id, r.report_type, r.report_content,
                r.status, r.created_at, r.resolved_at,
                r.resolved_by, r.resolution_notes,
                u.username AS reporter,
                p.post_id, p.content AS post_content,
                t.thread_name, c.category_name
            FROM forum_reports r
            LEFT JOIN users u ON r.user_id = u.user_id
            LEFT JOIN forum_posts p ON r.post_id = p.post_id
            LEFT JOIN forum_threads t ON p.thread_id = t.thread_id
            LEFT JOIN forum_categories c ON t.category_id = c.category_id
            WHERE r.status = ?
            ORDER BY r.created_at DESC
        `;
        const [reports] = await conn.execute(sql, [status]);
        await conn.commit();
        return reports;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting reports by status:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

const deleteReportByIdDB = async (reportId, userId) => {
    let conn;
    try {
        if (!reportId || !userId) {
            throw new Error("Report ID and user ID are required");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Check if report exists and user is authorized
        const [report] = await conn.execute(
            "SELECT user_id, status FROM forum_reports WHERE report_id = ?",
            [reportId]
        );

        if (!report[0]) {
            throw new Error("Report not found");
        }

        // Only allow deletion if user is the reporter or the report is resolved
        if (report[0].user_id !== userId && report[0].status !== 'Resolved') {
            throw new Error("Unauthorized: You can only delete your own reports or resolved reports");
        }

        await conn.execute("DELETE FROM forum_reports WHERE report_id = ?", [reportId]);
        await conn.commit();
        return "Report deleted successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error deleting report:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

const getAllReports = async (req, res) => {
    try {
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

const getReportById = async (req, res) => {
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

const getReportsByUser = async (req, res) => {
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

const getReportsByPost = async (req, res) => {
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

const updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resolutionNotes } = req.body;
        const resolvedBy = req.user.user_id;

        if (!resolvedBy) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User ID not found"
            });
        }

        if (!id || !status) {
            return res.status(400).json({
                success: false,
                message: "Report ID and status are required"
            });
        }

        const result = await updateReportStatusDB(id, status, resolvedBy, resolutionNotes);
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
        const { id } = req.params;
        const userId = req.user.user_id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User ID not found"
            });
        }

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

export default {
    reportCommentDB,
    getReportsForCommentDB,
    updateReportStatusForCommentDB,
    getAllReportsDB,
    getReportByIdDB,
    getReportsByUserDB,
    getReportsByPostDB,
    createReportDB,
    updateReportDB,
    updateReportAdminDB,
    deleteReportDB,
    getReportsByStatusDB,
    deleteReportByIdDB,
    getAllReports,
    getReportById,
    getReportsByUser,
    getReportsByPost,
    updateReportStatus,
    deleteReport,
    
}