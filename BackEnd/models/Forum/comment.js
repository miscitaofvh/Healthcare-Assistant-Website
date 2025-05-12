import connection from '../../config/connection.js';

const getCommentsByPostIdDB = async (postId, page = 1, limit = 20) => {
    let conn;
    try {
        conn = await connection.getConnection();
        const offset = (page - 1) * limit;

        const [comments] = await conn.execute(`
            SELECT 
                c.comment_id,
                c.content,
                c.created_at,
                c.depth,
                c.thread_path,
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

const getCommentRepliesDB = async (commentId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        
        const [replies] = await conn.execute(`
            SELECT 
                c.comment_id,
                c.content,
                c.created_at,
                c.depth,
                c.thread_path,
                u.username AS author,
                COUNT(l.like_id) AS like_count
            FROM forum_comments c
            JOIN users u ON c.user_id = u.user_id
            LEFT JOIN forum_comment_likes l ON c.comment_id = l.comment_id
            WHERE c.parent_comment_id = ?
            GROUP BY c.comment_id
            ORDER BY c.created_at ASC
        `, [commentId]);

        return replies;
    } finally {
        if (conn) conn.release();
    }
};

const getAllCommentsByUserDB = async (userId, page = 1, limit = 20) => {
    let conn;
    try {
        if (!userId) {
            throw new Error("User ID is required");
        }

        conn = await connection.getConnection();
        const offset = (page - 1) * limit;

        const [comments] = await conn.execute(`
            SELECT 
                c.comment_id,
                c.content,
                c.created_at,
                c.last_updated,
                c.depth,
                c.thread_path,
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
        `, [userId, limit.toString(), offset.toString()]);

        const [total] = await conn.execute(`
            SELECT COUNT(*) as count 
            FROM forum_comments 
            WHERE user_id = ?
        `, [userId]);

        return {
            comments,
            totalCount: total[0].count
        };
    } catch (error) {
        console.error("Error getting comments by user:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

const generateThreadPath = async (conn, parent_comment_id) => {
    if (!parent_comment_id) return null;
    
    const [parent] = await conn.execute(
        "SELECT thread_path FROM forum_comments WHERE comment_id = ?",
        [parent_comment_id]
    );
    
    if (!parent[0]) throw new Error("Parent comment not found");
    
    return parent[0].thread_path 
        ? `${parent[0].thread_path}-${parent_comment_id}`
        : `${parent_comment_id}`;
};

const addCommentToPostDB = async ({ userId, postId, content, parent_comment_id = null }) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        let depth = 0;
        let thread_path = null;

        if (parent_comment_id) {
            const [parentComment] = await conn.execute(
                "SELECT depth, thread_path, post_id FROM forum_comments WHERE comment_id = ?",
                [parent_comment_id]
            );
            
            if (!parentComment[0]) {
                throw new Error("Parent comment not found");
            }
            
            if (parentComment[0].post_id !== postId) {
                throw new Error("Parent comment does not belong to this post");
            }

            depth = parentComment[0].depth + 1;
            thread_path = parentComment[0].thread_path 
                ? `${parentComment[0].thread_path}-${parent_comment_id}`
                : `${parent_comment_id}`;
        }

        // Verify post exists
        const [postCheck] = await conn.execute(
            "SELECT post_id FROM forum_posts WHERE post_id = ?",
            [postId]
        );
        
        if (!postCheck[0]) {
            throw new Error("Post not found");
        }

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
            postId,
            userId,
            content,
            parent_comment_id,
            depth,
            thread_path
        ]);

        // Update comment_count in forum_posts
        await conn.execute(`
            UPDATE forum_posts 
            SET comment_count = comment_count + 1 
            WHERE post_id = ?
        `, [postId]);

        await conn.commit();
        
        return {
            commentId: result.insertId,
            parent_comment_id,
            depth,
            thread_path
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in addCommentToPostDB:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

const addReplyToCommentDB = async ({ userId, parentCommentId, content }) => {
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

        // Update comment_count in forum_posts
        await conn.execute(`
            UPDATE forum_posts 
            SET comment_count = comment_count + 1 
            WHERE post_id = ?
        `, [parent[0].post_id]);

        await conn.commit();
        
        return {
            commentId: result.insertId,
            parentCommentId,
            depth: newDepth,
            thread_path: newThreadPath
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in addReplyToCommentDB:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

const updateCommentDB = async ({ commentId, userId, content }) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Check if user owns the comment
        const [comment] = await conn.execute(`
            SELECT user_id 
            FROM forum_comments 
            WHERE comment_id = ?
        `, [commentId]);

        if (!comment[0]) {
            throw new Error("Comment not found");
        }

        if (comment[0].user_id !== userId) {
            throw new Error("Cannot update this comment");
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
                created_at,
                depth,
                thread_path
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

const deleteCommentDB = async ({ commentId, userId, isAdmin = false }) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Get comment details
        const [comment] = await conn.execute(`
            SELECT user_id, post_id 
            FROM forum_comments 
            WHERE comment_id = ?
        `, [commentId]);

        if (!comment[0]) {
            throw new Error("Comment not found");
        }

        // Check permissions
        if (!isAdmin && comment[0].user_id !== userId) {
            throw new Error("Cannot delete this comment");
        }

        // Delete comment
        await conn.execute(`
            DELETE FROM forum_comments 
            WHERE comment_id = ?
        `, [commentId]);

        // Update comment_count in forum_posts
        await conn.execute(`
            UPDATE forum_posts 
            SET comment_count = comment_count - 1 
            WHERE post_id = ? AND comment_count > 0
        `, [comment[0].post_id]);

        await conn.commit();
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in deleteCommentDB:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export default {
    getCommentsByPostIdDB,
    getCommentRepliesDB,
    getAllCommentsByUserDB,
    generateThreadPath,
    addCommentToPostDB,
    addReplyToCommentDB,
    updateCommentDB,
    deleteCommentDB
};