import connection from '../../config/connection.js';

export const likePostDB = async (postId, userId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = `
            INSERT INTO forum_likes (post_id, user_id)
            VALUES (?, ?)
        `;
        await conn.execute(sql, [postId, userId]);
        await conn.commit();
        return "Post liked successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            throw new Error("You have already liked this post");
        }
        console.error("Error liking post:", error);
        throw new Error("Failed to like post");
    } finally {
        if (conn) conn.release();
    }
};

export const unlikePostDB = async (postId, userId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = `
            DELETE FROM forum_likes
            WHERE post_id = ? AND user_id = ?
        `;
        const [result] = await conn.execute(sql, [postId, userId]);
        await conn.commit();
        if (result.affectedRows === 0) {
            throw new Error("You have not liked this post");
        }
        return "Post unliked successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error unliking post:", error);
        throw new Error("Failed to unlike post");
    } finally {
        if (conn) conn.release();
    }
};