import connection from '../../config/connection.js';

export const getCommentsByPostIdDB = async (postId, page = 1, limit = 20) => {
    let conn;
    try {
        conn = await connection.getConnection();
        const offset = (page - 1) * limit;

        const [comments] = await conn.execute(`
            SELECT 
                c.comment_id,
                c.content,
                c.created_at,
                u.username AS author,
                COUNT(l.like_id) AS like_count
            FROM forum_comments c
            JOIN users u ON c.user_id = u.user_id
            LEFT JOIN forum_comment_likes l ON c.comment_id = l.comment_id
            WHERE c.post_id = ? AND c.parent_comment_id IS NULL
            GROUP BY c.comment_id
            ORDER BY c.created_at DESC
            LIMIT ? OFFSET ?
        `, [postId, limit.toString(), offset.toString()]);

        const [total] = await conn.execute(`
            SELECT COUNT(*) as count 
            FROM forum_comments 
            WHERE post_id = ? AND parent_comment_id IS NULL
        `, [postId]);

        return {
            comments,
            totalCount: total[0].count
        };
    } finally {
        if (conn) conn.release();
    }
};

export const getCommentRepliesDB = async (commentId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        
        const [replies] = await conn.execute(`
            SELECT 
                c.comment_id,
                c.content,
                c.created_at,
                u.username AS author
            FROM forum_comments c
            JOIN users u ON c.user_id = u.user_id
            WHERE c.parent_comment_id = ?
            ORDER BY c.created_at ASC
        `, [commentId]);

        return replies;
    } finally {
        if (conn) conn.release();
    }
};

export const getAllCommentsByUserDB = async (userId, page = 1, limit = 20) => {
    let conn;
    try {
        if (!userId) {
            throw new Error("User ID is required");
        }

        conn = await connection.getConnection();
        const offset = (page - 1) * limit;

        // Main comments query with pagination
        const [comments] = await conn.execute(`
            SELECT 
                c.comment_id,
                c.content,
                c.created_at,
                c.last_updated,
                p.post_id,
                SUBSTRING(p.content, 1, 100) AS post_preview,
                t.thread_name,
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
            LIMIT ? OFFSET ?
        `, [userId, limit, offset]);

        // Total count query
        const [total] = await conn.execute(`
            SELECT COUNT(*) as total 
            FROM forum_comments 
            WHERE user_id = ?
        `, [userId]);

        return {
            comments,
            totalCount: total[0].total
        };
    } catch (error) {
        console.error("Error getting comments by user:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

const generateThreadPath = async (conn, parent_comment_id) => {
    const [parent] = await conn.execute(
        "SELECT thread_path FROM forum_comments WHERE comment_id = ?",
        [parent_comment_id]
    );
    return parent[0]?.thread_path 
        ? `${parent[0].thread_path}-${parent_comment_id}`
        : `${parent_comment_id}`;
};

export const createCommentDB = async ({ userId, postId, content, parent_comment_id = null }) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const [post] = await conn.execute(
            "SELECT 1 FROM forum_posts WHERE post_id = ?",
            [postId]
        );

        if (!post[0]) {
            throw new Error("Post not found");
        }

        if (parent_comment_id) {
            const [parentComment] = await conn.execute(
                "SELECT 1 FROM forum_comments WHERE comment_id = ? AND post_id = ?",
                [parent_comment_id, postId]
            );
            if (!parentComment[0]) {
                throw new Error("Parent comment not found in this post");
            }
        }

        const [result] = await conn.execute(`
            INSERT INTO forum_comments (
                post_id, 
                user_id, 
                content, 
                parent_comment_id,
                created_at,
                thread_path
            ) VALUES (?, ?, ?, ?, NOW(), ?)
        `, [
            postId,
            userId,
            content,
            parent_comment_id,
            parent_comment_id 
                ? await generateThreadPath(conn, parent_comment_id)
                : null
        ]);

        await conn.commit();
        
        return {
            commentId: result.insertId,
            parent_comment_id
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in createCommentDB:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const addReplyToCommentDB = async ({ userId, parentCommentId, content }) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Get parent comment details
        const [parent] = await conn.execute(`
            SELECT post_id, depth, thread_path 
            FROM forum_comments 
            WHERE comment_id = ?
        `, [parentCommentId]);

        if (!parent[0]) {
            throw new Error("Parent comment not found");
        }

        const newDepth = parent[0].depth + 1;
        const newThreadPath = parent[0].thread_path 
            ? `${parent[0].thread_path}-${parentCommentId}`
            : `${parentCommentId}`;

        // Insert reply
        const [result] = await conn.execute(`
            INSERT INTO forum_comments (
                post_id,
                user_id,
                content,
                parent_comment_id,
                depth,
                thread_path,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        `, [
            parent[0].post_id,
            userId,
            content,
            parentCommentId,
            newDepth,
            newThreadPath
        ]);

        await conn.commit();
        
        return {
            commentId: result.insertId,
            parentCommentId,
            depth: newDepth
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in addReplyToCommentDB:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const updateCommentDB = async ({ commentId, userId, content }) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Verify comment ownership
        const [comment] = await conn.execute(`
            SELECT user_id FROM forum_comments 
            WHERE comment_id = ?
        `, [commentId]);

        if (!comment[0]) {
            throw new Error("Comment not found");
        }

        if (comment[0].user_id !== userId) {
            throw new Error("Unauthorized: You can only edit your own comments");
        }

        // Update comment
        await conn.execute(`
            UPDATE forum_comments 
            SET content = ?, last_updated = NOW() 
            WHERE comment_id = ?
        `, [content, commentId]);

        // Get updated comment
        const [updated] = await conn.execute(`
            SELECT 
                comment_id,
                content,
                last_updated,
                created_at
            FROM forum_comments
            WHERE comment_id = ?
        `, [commentId]);

        await conn.commit();
        return updated[0];
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in updateCommentDB:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const deleteCommentDB = async ({ commentId, userId, isAdmin = false }) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Verify comment exists and ownership
        const [comment] = await conn.execute(`
            SELECT user_id FROM forum_comments 
            WHERE comment_id = ?
        `, [commentId]);

        if (!comment[0]) {
            throw new Error("Comment not found");
        }

        if (!isAdmin && comment[0].user_id !== userId) {
            throw new Error("Unauthorized: You can only delete your own comments");
        }

        // Delete comment (CASCADE will handle likes/reports)
        await conn.execute(`
            DELETE FROM forum_comments 
            WHERE comment_id = ?
        `, [commentId]);

        await conn.commit();
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in deleteCommentDB:", error);
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