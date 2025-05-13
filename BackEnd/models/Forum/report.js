import connection from '../../config/connection.js';

// Report a comment
const reportCommentDB = async (userId, commentId, reason) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = `
            INSERT INTO forum_comment_reports (comment_id, reported_by, reason, status, created_at)
            VALUES (?, ?, ?, 'pending', NOW())
        `;
        await conn.execute(sql, [commentId, userId, reason]);
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

// Report a post
const reportPostDB = async (userId, postId, reason) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = `
            INSERT INTO forum_post_reports (post_id, reported_by, reason, status, created_at)
            VALUES (?, ?, ?, 'pending', NOW())
        `;
        await conn.execute(sql, [postId, userId, reason]);
        await conn.commit();
        return "Post reported successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error reporting post:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

// Get reports for a comment
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
                reviewer.username AS reviewed_by
            FROM forum_comment_reports r
            JOIN users u ON r.reported_by = u.user_id
            LEFT JOIN users reviewer ON r.reviewed_by = reviewer.user_id
            WHERE r.comment_id = ?
            ORDER BY 
                CASE WHEN r.status = 'pending' THEN 0 ELSE 1 END,
                r.created_at DESC
        `, [commentId]);
        return reports;
    } catch (error) {
        console.error("Error retrieving comment reports:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

// Get reports for a post
const getReportsForPostDB = async (postId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        const [reports] = await conn.execute(`
            SELECT 
                r.report_id, 
                r.reason, 
                r.status, 
                r.created_at, 
                r.reviewed_by AS reviewed_by_id,
                u.username AS reported_by,
                reviewer.username AS reviewed_by,
                p.content AS post_content,
                t.thread_name,
                c.category_name
            FROM forum_post_reports r
            JOIN users u ON r.reported_by = u.user_id
            LEFT JOIN users reviewer ON r.reviewed_by = reviewer.user_id
            LEFT JOIN forum_posts p ON r.post_id = p.post_id
            LEFT JOIN forum_threads t ON p.thread_id = t.thread_id
            LEFT JOIN forum_categories c ON t.category_id = c.category_id
            WHERE r.post_id = ?
            ORDER BY 
                CASE WHEN r.status = 'pending' THEN 0 ELSE 1 END,
                r.created_at DESC
        `, [postId]);
        return reports;
    } catch (error) {
        console.error("Error retrieving post reports:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

// Update report status for a comment (admin)
const updateCommentReportStatusDB = async (adminId, reportId, status) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = `
            UPDATE forum_comment_reports
            SET status = ?, reviewed_by = ?, reviewed_at = NOW()
            WHERE report_id = ?
        `;
        await conn.execute(sql, [status, adminId, reportId]);
        await conn.commit();
        return "Comment report status updated successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error updating comment report status:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

// Update report status for a post (admin)
const updatePostReportStatusDB = async (adminId, reportId, status) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = `
            UPDATE forum_post_reports
            SET status = ?, reviewed_by = ?, reviewed_at = NOW()
            WHERE report_id = ?
        `;
        await conn.execute(sql, [status, adminId, reportId]);
        await conn.commit();
        return "Post report status updated successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error updating post report status:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

// Delete a comment report (admin)
const deleteCommentReportDB = async (reportId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        await conn.execute("DELETE FROM forum_comment_reports WHERE report_id = ?", [reportId]);
        await conn.commit();
        return "Comment report deleted successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error deleting comment report:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

// Delete a post report (admin)
const deletePostReportDB = async (reportId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        await conn.execute("DELETE FROM forum_post_reports WHERE report_id = ?", [reportId]);
        await conn.commit();
        return "Post report deleted successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error deleting post report:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export default {
    reportCommentDB,
    reportPostDB,
    getReportsForCommentDB,
    getReportsForPostDB,
    updateCommentReportStatusDB,
    updatePostReportStatusDB,
    deleteCommentReportDB,
    deletePostReportDB
};