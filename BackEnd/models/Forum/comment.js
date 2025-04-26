import connection from '../../config/connection.js';

export const getCommentsByPostIdDB = async (postId) => {
    let conn;
    try {
        if (!postId) {
            throw new Error("Post ID is required");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT 
                c.comment_id, c.content, c.created_at, c.last_updated,
                u.username AS author, u.user_id,
                COUNT(DISTINCT l.like_id) AS like_count,
                COUNT(DISTINCT r.report_id) AS report_count
            FROM forum_comments c
            JOIN users u ON c.user_id = u.user_id
            LEFT JOIN forum_comment_likes l ON c.comment_id = l.comment_id
            LEFT JOIN forum_comment_reports r ON c.comment_id = r.comment_id
            WHERE c.post_id = ?
            GROUP BY c.comment_id
            ORDER BY c.created_at DESC
        `;
        const [comments] = await conn.execute(sql, [postId]);
        await conn.commit();
        return comments;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting comments:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const getAllCommentsByUserDB = async (userId) => {
    let conn;
    try {
        if (!userId) {
            throw new Error("User ID is required");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT 
                c.comment_id, c.content, c.created_at, c.last_updated,
                p.post_id, p.content AS post_content, t.thread_name,
                COUNT(DISTINCT l.like_id) AS like_count,
                COUNT(DISTINCT r.report_id) AS report_count
            FROM forum_comments c
            JOIN forum_posts p ON c.post_id = p.post_id
            JOIN forum_threads t ON p.thread_id = t.thread_id
            LEFT JOIN forum_comment_likes l ON c.comment_id = l.comment_id
            LEFT JOIN forum_comment_reports r ON c.comment_id = r.comment_id
            WHERE c.user_id = ?
            GROUP BY c.comment_id
            ORDER BY c.created_at DESC
        `;
        
        const [comments] = await conn.execute(sql, [userId]);
        await conn.commit();
        return comments;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting comments by user:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const createCommentDB = async (userId, postId, content) => {
    let conn;
    try {
        if (!userId || !postId || !content) {
            throw new Error("Missing required fields");
        }

        if (content.length > 1000) {
            throw new Error("Content must be less than 1000 characters");
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

        const sql = `
            INSERT INTO forum_comments (post_id, content, user_id, created_at)
            VALUES (?, ?, ?, NOW())
        `;
        const [result] = await conn.execute(sql, [postId, content, userId]);
        await conn.commit();
        return { commentId: result.insertId };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error creating comment:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const updateCommentInPostDB = async (userId, commentId, postId, content) => {
    let conn;
    try {
        if (!userId || !commentId || !postId || !content) {
            throw new Error("Missing required fields");
        }

        if (content.length > 1000) {
            throw new Error("Content must be less than 1000 characters");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Check if comment exists and user is authorized
        const [comment] = await conn.execute(
            "SELECT user_id FROM forum_comments WHERE comment_id = ? AND post_id = ?",
            [commentId, postId]
        );

        if (!comment[0]) {
            throw new Error("Comment not found");
        }

        if (comment[0].user_id !== userId) {
            throw new Error("Unauthorized to update this comment");
        }

        const sql = `
            UPDATE forum_comments
            SET content = ?, last_updated = CURRENT_TIMESTAMP
            WHERE comment_id = ? AND post_id = ?
        `;
        await conn.execute(sql, [content, commentId, postId]);
        await conn.commit();
        return "Comment updated successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error updating comment:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const deleteCommentDB = async (userId, commentId, postId) => {
    let conn;
    try {
        if (!userId || !commentId || !postId) {
            throw new Error("Missing required fields");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Check if comment exists and user is authorized
        const [comment] = await conn.execute(
            "SELECT user_id FROM forum_comments WHERE comment_id = ? AND post_id = ?",
            [commentId, postId]
        );

        if (!comment[0]) {
            throw new Error("Comment not found");
        }

        if (comment[0].user_id !== userId) {
            throw new Error("Unauthorized to delete this comment");
        }

        // Delete related data first
        await conn.execute("DELETE FROM forum_comment_likes WHERE comment_id = ?", [commentId]);
        await conn.execute("DELETE FROM forum_comment_reports WHERE comment_id = ?", [commentId]);
        await conn.execute("DELETE FROM forum_comments WHERE comment_id = ? AND post_id = ?", [commentId, postId]);
        
        await conn.commit();
        return "Comment deleted successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error deleting comment:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const likeCommentDB = async (userId, commentId, postId) => {
    let conn;
    try {
        if (!userId || !commentId || !postId) {
            throw new Error("Missing required fields");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Check if comment exists
        const [comment] = await conn.execute(
            "SELECT comment_id FROM forum_comments WHERE comment_id = ? AND post_id = ?",
            [commentId, postId]
        );

        if (!comment[0]) {
            throw new Error("Comment not found");
        }

        // Check if already liked
        const [existingLike] = await conn.execute(
            "SELECT like_id FROM forum_comment_likes WHERE user_id = ? AND comment_id = ?",
            [userId, commentId]
        );

        if (existingLike[0]) {
            throw new Error("Comment already liked");
        }

        const sql = `
            INSERT INTO forum_comment_likes (user_id, comment_id, created_at)
            VALUES (?, ?, NOW())
        `;
        await conn.execute(sql, [userId, commentId]);
        await conn.commit();
        return "Comment liked successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error liking comment:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const unlikeCommentDB = async (userId, commentId, postId) => {
    let conn;
    try {
        if (!userId || !commentId || !postId) {
            throw new Error("Missing required fields");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Check if comment exists
        const [comment] = await conn.execute(
            "SELECT comment_id FROM forum_comments WHERE comment_id = ? AND post_id = ?",
            [commentId, postId]
        );

        if (!comment[0]) {
            throw new Error("Comment not found");
        }

        // Check if liked
        const [existingLike] = await conn.execute(
            "SELECT like_id FROM forum_comment_likes WHERE user_id = ? AND comment_id = ?",
            [userId, commentId]
        );

        if (!existingLike[0]) {
            throw new Error("Comment not liked");
        }

        await conn.execute(
            "DELETE FROM forum_comment_likes WHERE user_id = ? AND comment_id = ?",
            [userId, commentId]
        );
        await conn.commit();
        return "Comment unliked successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error unliking comment:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const reportCommentDB = async (userId, commentId, postId, reason) => {
    let conn;
    try {
        if (!userId || !commentId || !postId || !reason) {
            throw new Error("Missing required fields");
        }

        if (reason.length > 500) {
            throw new Error("Reason must be less than 500 characters");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Check if comment exists
        const [comment] = await conn.execute(
            "SELECT comment_id FROM forum_comments WHERE comment_id = ? AND post_id = ?",
            [commentId, postId]
        );

        if (!comment[0]) {
            throw new Error("Comment not found");
        }

        // Check if already reported
        const [existingReport] = await conn.execute(
            "SELECT report_id FROM forum_comment_reports WHERE user_id = ? AND comment_id = ?",
            [userId, commentId]
        );

        if (existingReport[0]) {
            throw new Error("Comment already reported");
        }

        const sql = `
            INSERT INTO forum_comment_reports (user_id, comment_id, reason, status, created_at)
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

export const getReportsForCommentDB = async (commentId) => {
    let conn;
    try {
        if (!commentId) {
            throw new Error("Comment ID is required");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT 
                r.report_id, r.reason, r.status, r.created_at,
                u.username AS reported_by, u.user_id
            FROM forum_comment_reports r
            JOIN users u ON r.user_id = u.user_id
            WHERE r.comment_id = ?
            ORDER BY r.created_at DESC
        `;
        const [reports] = await conn.execute(sql, [commentId]);
        await conn.commit();
        return reports;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting reports for comment:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const updateReportStatusForCommentDB = async (adminId, reportId, status, commentId) => {
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