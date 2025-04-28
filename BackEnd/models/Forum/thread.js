import connection from '../../config/connection.js';

const validateThreadOwnership = async (conn, threadId, userId) => {
    const sql = `
        SELECT thread_id
        FROM forum_threads
        WHERE thread_id = ? AND user_id = ?
    `;
    const [result] = await conn.execute(sql, [threadId, userId]);
    if (result.length === 0) {
        throw new Error("Thread not found or unauthorized");
    }
};

export const getAllThreadsDB = async () => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT 
                t.thread_id, t.thread_name, t.description, t.created_at, t.last_updated,
                u.username AS author, u.user_id,
                c.category_name, c.category_id,
                COUNT(DISTINCT p.post_id) AS post_count
            FROM forum_threads t
            JOIN users u ON t.user_id = u.user_id
            JOIN forum_categories c ON t.category_id = c.category_id
            LEFT JOIN forum_posts p ON t.thread_id = p.thread_id
            GROUP BY t.thread_id
            ORDER BY t.created_at DESC
        `;
        const [threads] = await conn.execute(sql);
        await conn.commit();
        return threads;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting threads:", error);
        throw new Error("Failed to get threads");
    } finally {
        if (conn) conn.release();
    }
};

export const getSummaryThreadsDB = async () => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = `
            SELECT thread_id, thread_name, category_id
            FROM forum_threads
            ORDER BY created_at DESC
        `;
        const [threads] = await conn.execute(sql);
        await conn.commit();
        return threads;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting threads:", error);
        throw new Error("Failed to get threads");
    } finally {
        if (conn) conn.release();
    }
};

export const getThreadByIdDB = async (threadId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        if (!threadId || isNaN(threadId)) {
            throw new Error("Invalid thread ID");
        }

        const sql = `
            SELECT 
                t.thread_id, t.thread_name, t.description, t.created_at, t.last_updated,
                u.username AS author, u.user_id,
                c.category_name, c.category_id,
                COUNT(DISTINCT p.post_id) AS post_count
            FROM forum_threads t
            JOIN users u ON t.user_id = u.user_id
            JOIN forum_categories c ON t.category_id = c.category_id
            LEFT JOIN forum_posts p ON t.thread_id = p.thread_id
            WHERE t.thread_id = ?
            GROUP BY t.thread_id
        `;
        const [thread] = await conn.execute(sql, [threadId]);
        await conn.commit();
        return thread[0] || null;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting thread:", error);
        throw new Error("Failed to get thread");
    } finally {
        if (conn) conn.release();
    }
};

export const getThreadNameDB = async (threadName) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = `
            SELECT thread_id 
            FROM forum_threads 
            WHERE thread_name = ?
        `;
        const [rows] = await conn.execute(sql, [threadName.toLowerCase()]);
        await conn.commit();
        return rows[0]?.thread_id || null;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting thread:", error);
        throw new Error("Failed to get thread");
    } finally {
        if (conn) conn.release();
    }
};

export const getAllThreadsByPostDB = async (postId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        if (!postId || isNaN(postId)) {
            throw new Error("Invalid post ID");
        }

        const sql = `
            SELECT t.*
            FROM forum_threads t
            JOIN forum_posts p ON t.thread_id = p.thread_id
            WHERE p.post_id = ?
        `;
        const [threads] = await conn.execute(sql, [postId]);
        await conn.commit();
        return threads;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting threads by post:", error);
        throw new Error("Failed to get threads by post");
    } finally {
        if (conn) conn.release();
    }
};

export const getPostsByThreadDB = async (threadId) => {
    let conn;
    try {
        conn = await connection.getConnection();

        if (!threadId || isNaN(threadId)) {
            throw new Error("Invalid thread ID");
        }

        const sql = `
            SELECT p.*
            FROM forum_posts p
            WHERE p.thread_id = ?
        `;
        const [posts] = await conn.execute(sql, [threadId]);
        return posts;
    } catch (error) {
        console.error("Error getting posts by thread:", error);
        throw new Error("Failed to get posts by thread");
    } finally {
        if (conn) conn.release();
    }
};

export const getAllThreadsByUserDB = async (userId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        if (!userId) {
            throw new Error("Invalid user ID");
        }

        const sql = `
            SELECT 
                t.thread_id, t.thread_name, t.description, t.created_at, t.last_updated,
                c.category_name, c.category_id,
                COUNT(DISTINCT p.post_id) AS post_count
            FROM forum_threads t
            JOIN forum_categories c ON t.category_id = c.category_id
            LEFT JOIN forum_posts p ON t.thread_id = p.thread_id
            WHERE t.user_id = ?
            GROUP BY t.thread_id
            ORDER BY t.created_at DESC
        `;
        const [threads] = await conn.execute(sql, [userId]);
        await conn.commit();
        return threads;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting threads by user:", error);
        throw new Error("Failed to get threads by user");
    } finally {
        if (conn) conn.release();
    }
};

export const createThreadDB = async (author_id, category_id, thread_name, description = null) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Input validation
        if (!thread_name || thread_name.trim().length === 0) {
            throw new Error("Thread name is required");
        }

        if (!category_id || isNaN(category_id)) {
            throw new Error("Invalid category ID");
        }

        // Check if category exists
        const checkCategorySql = `
            SELECT category_id
            FROM forum_categories
            WHERE category_id = ?
        `;
        const [categoryCheck] = await conn.execute(checkCategorySql, [category_id]);
        if (categoryCheck.length === 0) {
            throw new Error("Category does not exist");
        }

        // Check for duplicate thread name
        const checkThreadSql = `
            SELECT thread_id
            FROM forum_threads
            WHERE thread_name = ?
        `;
        const [threadCheck] = await conn.execute(checkThreadSql, [thread_name.toLowerCase()]);
        if (threadCheck.length > 0) {
            throw new Error("Thread name already exists");
        }

        const sql = `
            INSERT INTO forum_threads (thread_name, category_id, user_id, description) 
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await conn.execute(sql, [
            thread_name.toLowerCase(),
            category_id,
            author_id,
            description
        ]);
        await conn.commit();
        return result.insertId;
    } catch (error) {
        if (conn) await conn.rollback();
        if (error.message === "Thread name already exists" || 
            error.message === "Category does not exist") {
            throw error;
        }
        console.error("Error creating thread:", error);
        throw new Error("Failed to create thread");
    } finally {
        if (conn) conn.release();
    }
};

export const updateThreadDB = async (author_id, threadId, thread_name, description) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        if (!threadId || isNaN(threadId)) {
            throw new Error("Invalid thread ID");
        }

        // Check if thread exists and user is authorized
        const checkThreadSql = `
            SELECT thread_id
            FROM forum_threads
            WHERE thread_id = ? AND user_id = ?
        `;
        const [threadCheck] = await conn.execute(checkThreadSql, [threadId, author_id]);
        if (threadCheck.length === 0) {
            throw new Error("Thread not found or unauthorized");
        }

        if (!thread_name && !description) {
            throw new Error("No fields to update provided");
        }

        // Check for duplicate thread name if updating name
        if (thread_name) {
            const checkNameSql = `
                SELECT thread_id
                FROM forum_threads
                WHERE thread_name = ? AND thread_id != ?
            `;
            const [nameCheck] = await conn.execute(checkNameSql, [thread_name.toLowerCase(), threadId]);
            if (nameCheck.length > 0) {
                throw new Error("Thread name already exists");
            }
        }

        const sql = `
            UPDATE forum_threads
            SET 
                thread_name = COALESCE(?, thread_name),
                description = COALESCE(?, description),
                last_updated = CURRENT_TIMESTAMP
            WHERE thread_id = ?
        `;
        const [result] = await conn.execute(sql, [
            thread_name?.toLowerCase(),
            description,
            threadId
        ]);
        await conn.commit();
        if (result.affectedRows === 0) {
            throw new Error("Thread not found or no changes made");
        }
        return `Thread with ID ${threadId} updated successfully`;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error updating thread:", error);
        throw new Error("Failed to update thread");
    } finally {
        if (conn) conn.release();
    }
};

export const deleteThreadDB = async (author_id, threadId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        if (!threadId || isNaN(threadId)) {
            throw new Error("Invalid thread ID");
        }

        // Check if thread exists and user is authorized
        const checkThreadSql = `
            SELECT thread_id
            FROM forum_threads
            WHERE thread_id = ? AND user_id = ?
        `;
        const [threadCheck] = await conn.execute(checkThreadSql, [threadId, author_id]);
        if (threadCheck.length === 0) {
            throw new Error("Thread not found or unauthorized");
        }

        // Check for existing posts
        const checkPostsSql = `
            SELECT COUNT(*) as count
            FROM forum_posts
            WHERE thread_id = ?
        `;
        const [postsCheck] = await conn.execute(checkPostsSql, [threadId]);
        if (postsCheck[0].count > 0) {
            throw new Error("Cannot delete thread with existing posts");
        }

        const sql = `
            DELETE FROM forum_threads
            WHERE thread_id = ?
        `;
        const [result] = await conn.execute(sql, [threadId]);
        await conn.commit();
        if (result.affectedRows === 0) {
            throw new Error("Thread not found or already deleted");
        }
        return `Thread with ID ${threadId} deleted successfully`;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error deleting thread:", error);
        throw new Error("Failed to delete thread");
    } finally {
        if (conn) conn.release();
    }
};
