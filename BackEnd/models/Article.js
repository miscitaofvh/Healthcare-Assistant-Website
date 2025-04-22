import dotenv from "dotenv";
import connection from "../config/connection.js";

dotenv.config();

export const getCategoriesDB = async () => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = "SELECT * FROM article_categories";
        const [categories] = await conn.execute(sql);

        await conn.commit();
        return categories;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error fetching categories:", error);
        throw new Error("Không thể lấy danh sách danh mục");
    } finally {
        if (conn) conn.release();
    }
};

export const getCategoryByIdDB = async (id) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = "SELECT * FROM article_categories WHERE category_id = ?";
        const [category] = await conn.execute(sql, [id]);

        await conn.commit();
        return category;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error fetching category:", error);
        throw new Error("Không thể lấy danh mục");
    } finally {
        if (conn) conn.release();
    }
};

export const getTagsDB = async () => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = "SELECT * FROM article_tags";
        const [tags] = await conn.execute(sql);
        
        await conn.commit();
        return tags;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error fetching tags:", error);
        throw new Error("Không thể lấy danh sách thẻ");
    } finally {
        if (conn) conn.release();
    }
}

export const getTagByIdDB = async (id) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = "SELECT * FROM article_tags WHERE tag_id = ?";
        const [tag] = await conn.execute(sql, [id]);

        await conn.commit();
        return tag;

    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error fetching tag:", error);
        throw new Error("Không thể lấy thẻ");
    } finally {
        if (conn) conn.release();
    }
};  

export const getArticlesDB = async () => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = "SELECT * FROM article";
        const [articles] = await conn.execute(sql);

        await conn.commit();
        return articles;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error fetching articles:", error);
        throw new Error("Không thể lấy danh sách bài viết");
    } finally {
        if (conn) conn.release();
    }
};

export const getArticleByIdDB = async (id) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = "SELECT * FROM article WHERE article_id = ?";
        const [article] = await conn.execute(sql, [id]);

        await conn.commit();
        return article;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error fetching article:", error);
        throw new Error("Không thể lấy bài viết");
    } finally {
        if (conn) conn.release();
    }
};

export const createArticleDB = async (title, content, author_id, category_name, tag_name, image_url) => {
    console.log(title, content, author_id, category_name, image_url);
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const categoryQuery = "SELECT category_id FROM article_categories WHERE category_name = ?";
        const [categoryResult] = await conn.execute(categoryQuery, [category_name]);

        let category_id;
        if (categoryResult.length > 0) {
            category_id = categoryResult[0].category_id;
        } else {
            const insertCategoryQuery = "INSERT INTO article_categories (category_name) VALUES (?)";
            const [categoryInsertResult] = await conn.execute(insertCategoryQuery, [category_name]);
            category_id = categoryInsertResult.insertId;
        }

        const tagQuery = "SELECT tag_id FROM article_tags WHERE tag_name = ?";
        const [tagResult] = await conn.execute(tagQuery, [tag_name]);

        let tag_id;
        if (tagResult.length > 0) {
            tag_id = tagResult[0].tag_id;
        } else {
            const insertTagQuery = "INSERT INTO article_tags (tag_name) VALUES (?)";
            const [tagInsertResult] = await conn.execute(insertTagQuery, [tag_name]);
            tag_id = tagInsertResult.insertId;
        }

        if (!title || !content || !author_id || !category_id) {
            throw new Error("Không thể tạo bài viết");
        }

        const sql = `
            INSERT INTO article (title, content, author_id, category_id, publication_date, image_url) 
            VALUES (?, ?, ?, ?, NOW(), ?)`;
        const [result] = await conn.execute(sql, [title, content, author_id, category_id, image_url || null]);

        await conn.commit();
        return result.insertId;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error creating article:", error);
        throw new Error("Không thể tạo bài viết");
    } finally {
        if (conn) conn.release();
    }
};

export const updateArticleDB = async (id, title, content, category_name, image_url) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = "UPDATE article SET title = ?, content = ?, category_name = ?, image_url = ? WHERE article_id = ?";
        const [result] = await conn.execute(sql, [title, content, category_name, image_url, id]);

        await conn.commit();
        return result.affectedRows > 0;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error updating article:", error);
        throw new Error("Không thể cập nhật bài viết");
    } finally {
        if (conn) conn.release();
    }
};

export const deleteArticleDB = async (id) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = "DELETE FROM article WHERE article_id = ?";
        const [result] = await conn.execute(sql, [id]);

        await conn.commit();
        return result.affectedRows > 0;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error deleting article:", error);
        throw new Error("Không thể xóa bài viết");
    } finally {
        if (conn) conn.release();
    }
};



export const likeArticleDB = async (article_id, user_id) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = "INSERT INTO article_likes (article_id, user_id) VALUES (?, ?)";
        await conn.execute(sql, [article_id, user_id]);

        await conn.commit();
    } catch (error) {
        if (conn) await conn.rollback();
        throw new Error("Không thể thích bài viết");
    } finally {
        if (conn) conn.release();
    }
};

export const unlikeArticleDB = async (article_id, user_id) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = "DELETE FROM article_likes WHERE article_id = ? AND user_id = ?";
        await conn.execute(sql, [article_id, user_id]);

        await conn.commit();
    } catch (error) {
        if (conn) await conn.rollback();
        throw new Error("Không thể bỏ thích bài viết");
    } finally {
        if (conn) conn.release();
    }
};

export const getArticleLikesDB = async (article_id) => {
    let conn;
    try {
        conn = await connection.getConnection();
        const sql = "SELECT COUNT(*) AS total_likes FROM article_likes WHERE article_id = ?";
        const [likes] = await conn.execute(sql, [article_id]);
        return likes[0];
    } catch (error) {
        throw new Error("Không thể lấy danh sách lượt thích");
    } finally {
        if (conn) conn.release();
    }
};

export const addCommentDB = async (article_id, user_id, comment_content) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = "INSERT INTO article_comments (article_id, user_id, comment_content) VALUES (?, ?, ?)";
        await conn.execute(sql, [article_id, user_id, comment_content]);

        await conn.commit();
    } catch (error) {
        if (conn) await conn.rollback();
        throw new Error("Không thể thêm bình luận");
    } finally {
        if (conn) conn.release();
    }
};

export const deleteCommentDB = async (comment_id) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = "DELETE FROM article_comments WHERE comment_id = ?";
        await conn.execute(sql, [comment_id]);

        await conn.commit();
    } catch (error) {
        if (conn) await conn.rollback();
        throw new Error("Không thể xóa bình luận");
    } finally {
        if (conn) conn.release();
    }
};

export const getArticleCommentsDB = async (article_id) => {
    let conn;
    try {
        conn = await connection.getConnection();
        const sql = "SELECT * FROM article_comments WHERE article_id = ? ORDER BY created_at DESC";
        const [comments] = await conn.execute(sql, [article_id]);
        return comments;
    } catch (error) {
        throw new Error("Không thể lấy danh sách bình luận");
    } finally {
        if (conn) conn.release();
    }
};

export const addArticleViewDB = async (article_id, user_id) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = "INSERT INTO article_views (article_id, user_id) VALUES (?, ?)";
        await conn.execute(sql, [article_id, user_id]);

        await conn.commit();
    } catch (error) {
        if (conn) await conn.rollback();
        throw new Error("Không thể ghi nhận lượt xem");
    } finally {
        if (conn) conn.release();
    }
};

export const getArticleViewsDB = async (article_id) => {
    let conn;
    try {
        conn = await connection.getConnection();
        const sql = "SELECT COUNT(*) AS total_views FROM article_views WHERE article_id = ?";
        const [views] = await conn.execute(sql, [article_id]);
        return views[0];
    } catch (error) {
        throw new Error("Không thể lấy lượt xem");
    } finally {
        if (conn) conn.release();
    }
};