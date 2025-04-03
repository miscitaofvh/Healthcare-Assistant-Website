import connection from '../config/connection.js';

export const getPostsDB = async () => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = "SELECT p.id, p.title, p.content, u.username AS author FROM forum_posts p JOIN users u ON p.user_id = u.user_id";
        const [posts] = await conn.execute(sql);
        await conn.commit();
        return posts;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Lỗi khi lấy bài viết:", error);
        throw new Error("Không thể lấy bài viết");
    } finally {
        if (conn) conn.release();
    }
};

export const getPostByIdDB = async (id) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = "SELECT * FROM forum_posts WHERE id = ?";
        const [post] = await conn.execute(sql, [id]);
        await conn.commit();
        return post;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Lỗi khi lấy bài viết:", error);
        throw new Error("Không thể lấy bài viết");
    } finally {
        if (conn) conn.release();
    }
};

export const createPostDB = async (title, content, user_id) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = "INSERT INTO forum_posts (title, content, user_id) VALUES (?, ?, ?)";
        const [result] = await conn.execute(sql, [title, content, user_id]);
        await conn.commit();
        return result.insertId;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Lỗi khi tạo bài viết:", error);
        throw new Error("Không thể tạo bài viết");
    } finally {
        if (conn) conn.release();
    }
};

export const updatePostDB = async (id, title, content) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = "UPDATE forum_posts SET title = ?, content = ? WHERE id = ?";
        await conn.execute(sql, [title, content, id]);
        await conn.commit();
        return "Forum post updated successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Lỗi khi cập nhật bài viết:", error);
        throw new Error("Không thể cập nhật bài viết");
    } finally {
        if (conn) conn.release();
    }

};

export const deletePostDB = async (id) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = "DELETE FROM forum_posts WHERE id = ?";
        await conn.execute(sql, [id]);
        await conn.commit();
        return "Forum post deleted successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Lỗi khi xóa bài viết:", error);
        throw new Error("Không thể xóa bài viết");
    } finally {
        if (conn) conn.release();
    }
};

export const getCommentsDB = async (id) => {
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = "SELECT * FROM forum_comments WHERE post_id = ?";
        const [comments] = await conn.execute(sql, [id]);
        await conn.commit();
        return comments;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Lỗi khi lấy bình luận:", error);
        throw new Error("Không thể lấy bình luận");
    } finally {
        if (conn) conn.release();
    }
};

export const createCommentDB = async (id, content, user_id) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = "INSERT INTO forum_comments (content, post_id, user_id) VALUES (?, ?, ?)";
        await conn.execute(sql, [content, id, user_id]);
        await conn.commit();
        return "Comment added successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Lỗi khi tạo bình luận:", error);
        throw new Error("Không thể tạo bình luận");
    } finally {
        if (conn) conn.release();
    }
};

export const deleteCommentDB = async (id, commentId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = "DELETE FROM forum_comments WHERE id = ? AND post_id = ?";
        await conn.execute(sql, [commentId, id]);
        await conn.commit();
        return "Comment deleted successfully";
    } catch (error) {   
        if (conn) await conn.rollback();
        console.error("Lỗi khi xóa bình luận:", error);
        throw new Error("Không thể xóa bình luận");
    } finally {
        if (conn) conn.release();
    }
};