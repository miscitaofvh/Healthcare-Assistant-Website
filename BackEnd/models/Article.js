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

export const getTagsofArticleDB = async (article_id) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT t.tag_id, t.tag_name
            FROM article_tags t
            JOIN article_tag_mapping m ON t.tag_id = m.tag_id
            JOIN article a ON m.article_id = a.article_id
            WHERE a.article_id = ?
        `;
        const [tags] = await conn.execute(sql, [article_id]);

        await conn.commit();
        return tags;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error fetching tags of article:", error);
        throw new Error("Không thể lấy danh sách thẻ của bài viết");
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

export const createArticleDB = async (author_id, author_name, title, content, category_name, tag_name = [], image_url) => {
    let conn;

    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const [categoryResult] = await conn.execute(
            "SELECT category_id FROM article_categories WHERE category_name = ?",
            [category_name]
        );

        let category_id;
        if (categoryResult.length > 0) {
            category_id = categoryResult[0].category_id;
        } else {
            const [insertCategoryResult] = await conn.execute(
                "INSERT INTO article_categories (category_name) VALUES (?)",
                [category_name]
            );
            category_id = insertCategoryResult.insertId;
        }

        if(!title || !content || !author_id || !category_id) {
            throw new Error("Không thể tạo bài viết");
        }

        const insertArticleQuery = `
            INSERT INTO article (title, content, author_id, author_name, category_id, category_name, publication_date, image_url)
            VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
        `;
        const [articleResult] = await conn.execute(insertArticleQuery, [
            title,
            content,
            author_id,
            author_name,
            category_id,
            category_name,
            image_url || null
        ]);
        const article_id = articleResult.insertId;

        if (!article_id) {
            throw new Error("Tạo bài viết không thành công");
        }

        if (Array.isArray(tag_name) && tag_name.length > 0) {
            for (const tag of tag_name.map(t => t.trim())) {
                const [tagResult] = await conn.execute(
                    "SELECT tag_id FROM article_tags WHERE tag_name = ?",
                    [tag]
                );

                let tag_id;
                if (tagResult.length > 0) {
                    tag_id = tagResult[0].tag_id;
                } else {
                    const [insertTagResult] = await conn.execute(
                        "INSERT INTO article_tags (tag_name) VALUES (?)",
                        [tag]
                    );
                    tag_id = insertTagResult.insertId;
                }

                await conn.execute(
                    "INSERT INTO article_tag_mapping (article_id, tag_id) VALUES (?, ?)",
                    [article_id, tag_id]
                );
            }
        }

        await conn.commit();
        return article_id;
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