import dotenv from "dotenv";
import connection from "../config/connection.js";

dotenv.config();

export const getCategoriesDB = async () => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = "SELECT * FROM categories";
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

        const sql = "SELECT * FROM categories WHERE category_id = ?";
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


export const getArticlesDB = async () => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = "SELECT * FROM health_articles";
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

        const sql = "SELECT * FROM health_articles WHERE article_id = ?";
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

export const createArticleDB = async (title, content, author_id, category_id, publication_date, image_url) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = "INSERT INTO health_articles (title, content, author_id, category_id, publication_date, image_url) VALUES (?, ?, ?, ?, ?, ?)";
        const [result] = await conn.execute(sql, [title, content, author_id, category_id, publication_date, image_url || null]);
        if (!title || !content || !author_id || !category_id || !publication_date) {
            throw new Error("Missing required fields");
        }

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

export const updateArticleDB = async (id, title, content, category_id, publication_date, image_url) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = "UPDATE health_articles SET title = ?, content = ?, category_id = ?, publication_date = ?, image_url = ? WHERE article_id = ?";
        const [result] = await conn.execute(sql, [title, content, category_id, publication_date, image_url, id]);

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

        const sql = "DELETE FROM health_articles WHERE article_id = ?";
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

