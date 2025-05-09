import connection from '../../config/connection.js';

export const likePostDB = async (userId, postId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Check if user already liked the post
        const [likeCheck] = await conn.execute(
            'SELECT 1 FROM forum_likes WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );

        if (likeCheck.length) {
            throw new Error("You have already liked this post");
        }

        // Insert new like
        await conn.execute(
            'INSERT INTO forum_likes (post_id, user_id) VALUES (?, ?)',
            [postId, userId]
        );

        // Update like count in posts table
        await conn.execute(
            'UPDATE forum_posts SET like_count = like_count + 1 WHERE post_id = ?',
            [postId]
        );

        await conn.commit();

        // Return the updated like count
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
        throw error; // Re-throw the error to be handled by the controller
    } finally {
        if (conn) conn.release();
    }
};

export const unlikePostDB = async (userId, postId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Check if user has liked the post
        const [likeCheck] = await conn.execute(
            'SELECT 1 FROM forum_likes WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );

        if (!likeCheck.length) {
            throw new Error("You have not liked this post");
        }

        // Remove the like
        await conn.execute(
            'DELETE FROM forum_likes WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );

        // Update like count in posts table
        await conn.execute(
            'UPDATE forum_posts SET like_count = GREATEST(0, like_count - 1) WHERE post_id = ?',
            [postId]
        );

        await conn.commit();

        // Return the updated like count
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
        throw error; // Re-throw the error to be handled by the controller
    } finally {
        if (conn) conn.release();
    }
};

export const likeCommentDB = async (userId, commentId) => {
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

export const unlikeCommentDB = async (userId, commentId, postId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

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