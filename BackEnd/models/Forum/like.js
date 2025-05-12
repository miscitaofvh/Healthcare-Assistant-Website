import connection from '../../config/connection.js';

const likePostDB = async (userId, postId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const [likeCheck] = await conn.execute(
            'SELECT 1 FROM forum_likes WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );

        if (likeCheck.length) {
            throw new Error("You have already liked this post");
        }

        await conn.execute(
            'INSERT INTO forum_likes (post_id, user_id) VALUES (?, ?)',
            [postId, userId]
        );

        await conn.execute(
            'UPDATE forum_posts SET like_count = like_count + 1 WHERE post_id = ?',
            [postId]
        );

        await conn.commit();

        const [updatedPost] = await conn.execute(
            'SELECT like_count FROM forum_posts WHERE post_id = ?',
            [postId]
        );

        return {
            message: "Post liked successfully",
            likeCount: updatedPost[0].like_count
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in likePostDB:", error);
        throw error; 
    } finally {
        if (conn) conn.release();
    }
};

const unlikePostDB = async (userId, postId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const [likeCheck] = await conn.execute(
            'SELECT 1 FROM forum_likes WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );

        if (!likeCheck.length) {
            throw new Error("You have not liked this post");
        }

        await conn.execute(
            'DELETE FROM forum_likes WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );

        await conn.execute(
            'UPDATE forum_posts SET like_count = GREATEST(0, like_count - 1) WHERE post_id = ?',
            [postId]
        );

        await conn.commit();

        const [updatedPost] = await conn.execute(
            'SELECT like_count FROM forum_posts WHERE post_id = ?',
            [postId]
        );

        return {
            message: "Post unliked successfully",
            likeCount: updatedPost[0].like_count
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in unlikePostDB:", error);
        throw error; 
    } finally {
        if (conn) conn.release();
    }
};

const likeCommentDB = async (userId, commentId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

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

const unlikeCommentDB = async (userId, commentId, postId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

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

export default {
    likePostDB,
    unlikePostDB,
    likeCommentDB,
    unlikeCommentDB
}