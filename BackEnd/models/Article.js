import dotenv from "dotenv";
import connection from "../config/connection.js";
import pool from "../config/connection.js";

dotenv.config();
const FIXED_LIMIT = 18;

export const getCategories = async () => {
  const [rows] = await pool.query(
    "SELECT category_id, category_name, description, created_at, last_updated FROM article_categories"
  );
  return rows;
};

export const getCategoryById = async (categoryId) => {
  const [rows] = await pool.query(
    "SELECT category_id, category_name, description, created_at, last_updated FROM article_categories WHERE category_id = ?",
    [categoryId]
  );
  return rows[0] || null;
};

export const getTags = async () => {
  const [rows] = await pool.query(
    "SELECT tag_id, tag_name, description, created_at, last_updated FROM article_tags"
  );
  return rows;
};

export const getTagById = async (tagId) => {
  const [rows] = await pool.query(
    "SELECT tag_id, tag_name, description, created_at, last_updated FROM article_tags WHERE tag_id = ?",
    [tagId]
  );
  return rows[0] || null;
};

export const getTagsByArticle = async (articleId) => {
  const [rows] = await pool.query(
    `SELECT t.tag_id, t.tag_name
           FROM article_tags t
           JOIN article_tag_mapping m ON t.tag_id = m.tag_id
          WHERE m.article_id = ?`,
    [articleId]
  );
  return rows;
};

export const getArticles = async (page = 1) => {
  const offset = (page - 1) * FIXED_LIMIT;

  const [articles] = await pool.query(
    `SELECT a.*, u.full_name AS author_name
                                         FROM articles AS a
                                         LEFT JOIN users AS u
                                         ON a.author_id = u.user_id
                                         ORDER BY a.last_updated DESC 
                                         LIMIT ?, ?`,
    [offset, FIXED_LIMIT]
  );

  return articles;
};

export const getArticleById = async (articleId) => {
  const [rows] = await pool.query(
    `SELECT a.*, u.full_name AS author_name
       FROM articles AS a
       LEFT JOIN users AS u
         ON a.author_id = u.user_id
       WHERE a.article_id = ?`,
    [articleId]
  );
  return rows[0] || null;
};

export const createArticle = async (
  author_id,
  title,
  content,
  category_name,
  tag_name = [],
  image_url
) => {
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

    if (!title || !content || !author_id || !category_id) {
      throw new Error("Không thể tạo bài viết");
    }

    const insertArticleQuery = `
            INSERT INTO articles (title, content, author_id, category_id, publication_date, image_url)
            VALUES (?, ?, ?, ?, NOW(), ?)
        `;
    const [articleResult] = await conn.execute(insertArticleQuery, [
      title,
      content,
      author_id,
      category_id,
      image_url || null,
    ]);
    const article_id = articleResult.insertId;

    if (!article_id) {
      throw new Error("Tạo bài viết không thành công");
    }

    if (Array.isArray(tag_name) && tag_name.length > 0) {
      for (const tag of tag_name.map((t) => t.trim())) {
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

export const updateArticle = async (
  articleId,
  title,
  content,
  category_name,
  image_url
) => {
  const [result] = await pool.query(
    `UPDATE articles
            SET title = ?, content = ?, category_id = (
              SELECT category_id FROM article_categories WHERE category_name = ?
            ), image_url = ?, last_updated = NOW()
          WHERE article_id = ?`,
    [title, content, category_name, image_url, articleId]
  );
  return result.affectedRows > 0;
};

export const deleteArticle = async (articleId) => {
  const [result] = await pool.query(
    "DELETE FROM articles WHERE article_id = ?",
    [articleId]
  );
  return result.affectedRows > 0;
};

export const addComment = async (
  article_id,
  user_id,
  comment_content,
  parent_id
) => {
  await pool.query(
    "INSERT INTO article_comments (article_id, user_id, comment_content, parent_id) VALUES (?, ?, ?, ?)",
    [article_id, user_id, comment_content, parent_id]
  );
};

export const deleteComment = async (comment_id) => {
  const [replies] = await pool.query(
    "SELECT comment_id FROM article_comments WHERE parent_id = ?",
    [comment_id]
  );

  for (const reply of replies) {
    await deleteComment(reply.comment_id);
  }

  await pool.query("DELETE FROM article_comments WHERE comment_id = ?", [
    comment_id,
  ]);
};

export const getArticleComments = async (article_id) => {
  const [rows] = await pool.query(
    `SELECT ac.*, u.full_name AS author_name
       FROM article_comments ac
       JOIN users u ON ac.user_id = u.user_id
       WHERE ac.article_id = ?
       ORDER BY ac.created_at ASC`,
    [article_id]
  );

  const commentMap = new Map();
  const rootComments = [];

  for (const row of rows) {
    row.replies = [];
    commentMap.set(row.comment_id, row);
  }

  for (const row of rows) {
    if (row.parent_id && commentMap.has(row.parent_id)) {
      commentMap.get(row.parent_id).replies.push(row);
    } else {
      rootComments.push(row);
    }
  }

  return rootComments;
};

export const addArticleView = async (article_id, user_id) => {
  await pool.query(
    "INSERT INTO article_views (article_id, user_id) VALUES (?, ?)",
    [article_id, user_id]
  );
};

export const getArticleViews = async (article_id) => {
  const [[{ total_views }]] = await pool.query(
    "SELECT COUNT(*) AS total_views FROM article_views WHERE article_id = ?",
    [article_id]
  );
  return total_views;
};
