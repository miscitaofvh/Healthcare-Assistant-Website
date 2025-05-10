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

const getAllThreadsDB = async (page = 1, limit = 10, orderByField = 'created_at', orderDirection = 'DESC') => {
    let conn;
    const offset = (page - 1) * limit;

    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const validThreadColumns = [
            'thread_id', 'thread_name', 'description',
            'created_at', 'last_updated', 'created_by',
            'category_name', 'post_count'
        ];

        if (!validThreadColumns.includes(orderByField)) {
            orderByField = 'created_at';
        }

        const threadsSql = `
            SELECT 
                ft.thread_id, 
                ft.thread_name, 
                ft.description, 
                ft.created_at, 
                ft.last_updated,
                u.username AS created_by,
                fc.category_name, 
                fc.category_id,
                COUNT(DISTINCT p.post_id) AS post_count
            FROM forum_threads ft
            JOIN users u ON ft.user_id = u.user_id
            JOIN forum_categories fc ON ft.category_id = fc.category_id
            LEFT JOIN forum_posts p ON ft.thread_id = p.thread_id
            GROUP BY ft.thread_id
            ORDER BY ${conn.escapeId(orderByField)} ${orderDirection === 'ASC' ? 'ASC' : 'DESC'}
            LIMIT ? OFFSET ?
        `;

        const countSql = `
            SELECT COUNT(*) as totalCount 
            FROM forum_threads
        `;

        const [threadsResult, [countResult]] = await Promise.all([
            conn.execute(threadsSql, [limit.toString(), offset.toString()]),
            conn.execute(countSql)
        ]);

        await conn.commit();

        return {
            threads: threadsResult[0].map(thread => ({
                ...thread,
                post_count: Number(thread.post_count),
            })),
            pagination: {
                totalItems: Number(countResult[0].totalCount),
                currentPage: page,
                totalPages: Math.ceil(Number(countResult[0].totalCount) / limit),
                itemsPerPage: limit,
                limit: limit,
                sortBy: orderByField,
                sortOrder: orderDirection
            }
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in getAllThreadsDB:", error);
        throw new Error("Failed to retrieve threads from database");
    } finally {
        if (conn) conn.release();
    }
};

const getThreadsByCategoryDB = async (categoryId, page = 1, limit = 10, orderByField = 'created_at', orderDirection = 'DESC') => {
    let conn;
    const offset = (page - 1) * limit;

    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const validThreadColumns = [
            'thread_id', 'thread_name', 'description',
            'created_at', 'last_updated', 'created_by',
            'post_count', 'last_post_date'
        ];

        if (!validThreadColumns.includes(orderByField)) {
            orderByField = 'created_at';
        }

        const threadsSql = `
            SELECT 
                t.thread_id,
                t.thread_name,
                t.description,
                t.created_at,
                t.last_updated,
                u.username AS created_by,
                COUNT(DISTINCT p.post_id) AS post_count,
                MAX(p.created_at) AS last_post_date
                (
                    SELECT username
                    FROM users
                    WHERE user_id = (
                        SELECT user_id
                        FROM forum_posts
                        WHERE thread_id = t.thread_id
                        ORDER BY created_at DESC
                        LIMIT 1
                    )
                ) AS last_post_author
            FROM forum_threads t
            JOIN users u ON ft.user_id = u.user_id
            LEFT JOIN forum_posts p ON p.thread_id = t.thread_id
            WHERE t.category_id = ?
            GROUP BY t.thread_id
            ORDER BY ${conn.escapeId(orderByField)} ${orderDirection === 'ASC' ? 'ASC' : 'DESC'}
            LIMIT ? OFFSET ?
        `;

        const countSql = `
            SELECT COUNT(*) AS totalCount 
            FROM forum_threads 
            WHERE category_id = ?
        `;

        const [threadsResult, [countResult]] = await Promise.all([
            conn.execute(threadsSql, [categoryId, limit.toString(), offset.toString()]),
            conn.execute(countSql, [categoryId])
        ]);

        await conn.commit();

        return {
            threads: threadsResult[0].map(thread => ({
                ...thread,
                post_count: Number(thread.post_count),
            })),
            pagination: {
                totalItems: Number(countResult[0].totalCount),
                currentPage: page,
                totalPages: Math.ceil(Number(countResult[0].totalCount) / limit),
                itemsPerPage: limit,
                limit: limit,
                sortBy: orderByField,
                sortOrder: orderDirection
            }
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in getThreadsByCategoryDB:", error);
        throw new Error("Failed to retrieve threads by category from database");
    } finally {
        if (conn) conn.release();
    }
};

const getThreadByIdDB = async (threadId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT 
                ft.thread_id, 
                ft.thread_name, 
                ft.description,
                ft.created_at,
                ft.last_updated,
                u.username AS created_by,
                fc.category_id,
                fc.category_name,
                COUNT(DISTINCT p.post_id) AS post_count
            FROM forum_threads ft
            JOIN users u ON ft.user_id = u.user_id
            JOIN forum_categories fc ON ft.category_id = fc.category_id
            LEFT JOIN forum_posts p ON p.thread_id = ft.thread_id
            WHERE ft.thread_id = ?
            GROUP BY ft.thread_id
        `;

        const [thread] = await conn.execute(sql, [threadId]);
        await conn.commit();


        return {
            ...thread[0],
            post_count: Number(thread[0].post_count),
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in getThreadByIdDB:", error);
        throw new Error(error.message.includes("Thread not found") ?
            error.message : "Failed to retrieve thread from database");
    } finally {
        if (conn) conn.release();
    }
};

const getPostsByThreadDB = async (threadId, page = 1, limit = 10, orderByField = 'created_at', orderDirection = 'ASC', author_id = null) => {
    let conn;
    const offset = (page - 1) * limit;

    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const threadSql = `
            SELECT 
                ft.thread_id,
                ft.thread_name,
                ft.description,
                ft.created_at,
                ft.last_updated,
                u.username AS created_by,
                fc.category_id,
                fc.category_name,
                COUNT(DISTINCT p.post_id) AS post_count
                ${author_id ? ', (ft.user_id = ?) AS is_owner' : ''}
            FROM forum_threads ft
            JOIN users u ON ft.user_id = u.user_id
            JOIN forum_categories fc ON ft.category_id = fc.category_id
            LEFT JOIN forum_posts p ON p.thread_id = ft.thread_id
            WHERE ft.thread_id = ?
            GROUP BY ft.thread_id
        `;
        const [threadResult] = await conn.execute(threadSql, author_id ? [author_id, threadId] : [threadId]);

        const thread = threadResult[0];

        const validPostColumns = [
            'post_id', 'title', 'content', 'created_at',
            'last_updated', 'author'
        ];

        if (!validPostColumns.includes(orderByField)) {
            orderByField = 'created_at';
        }
        const postsSql = `
            SELECT 
                p.post_id,
                p.title,
                p.content,
                p.created_at,
                p.last_updated,
                p.like_count,
                u.username AS author,
                COUNT(DISTINCT c.comment_id) AS comment_count
            FROM forum_posts p
            JOIN users u ON p.user_id = u.user_id
            LEFT JOIN forum_comments c ON c.post_id = p.post_id
            WHERE p.thread_id = ?
            GROUP BY p.post_id, p.title, p.content, p.created_at, p.last_updated, p.like_count, u.username
            ORDER BY ${conn.escapeId(orderByField)} ${orderDirection === 'ASC' ? 'ASC' : 'DESC'}
            LIMIT ? OFFSET ?
        `;
        const countSql = `
            SELECT COUNT(*) AS totalCount 
            FROM forum_posts 
            WHERE thread_id = ?
        `;

        const [postsResult, [countResult]] = await Promise.all([
            conn.execute(postsSql, [threadId, limit.toString(), offset.toString()]),
            conn.execute(countSql, [threadId])
        ]);

        await conn.commit();

        return {
            thread: {
                ...thread,
                post_count: Number(thread.post_count),
                is_owner: author_id ? thread.is_owner === 1 : false
            },
            posts: postsResult[0].map(post => ({
                ...post
            })),
            pagination: {
                totalItems: Number(countResult[0].totalCount),
                currentPage: page,
                totalPages: Math.ceil(Number(countResult[0].totalCount) / limit),
                itemsPerPage: limit,
                limit: limit,
                sortBy: orderByField,
                sortOrder: orderDirection
            }
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in getPostsByThreadDB:", error);
        throw new Error(error.message.includes("Thread not found") ?
            error.message : "Failed to retrieve posts from database");
    } finally {
        if (conn) conn.release();
    }
};

const getThreadsByUserDB = async (userId, page = 1, limit = 10, orderByField = 'created_at', orderDirection = 'DESC') => {
    let conn;
    const offset = (page - 1) * limit;

    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const validThreadColumns = [
            'thread_id', 'thread_name', 'description',
            'created_at', 'last_updated', 'category_name',
            'post_count'
        ];

        if (!validThreadColumns.includes(orderByField)) {
            orderByField = 'created_at';
        }

        const threadsSql = `
            SELECT 
                ft.thread_id, 
                ft.thread_name, 
                ft.description, 
                ft.created_at, 
                ft.last_updated,
                fc.category_name, 
                fc.category_id,
                COUNT(DISTINCT p.post_id) AS post_count
            FROM forum_threads ft
            JOIN forum_categories fc ON ft.category_id = fc.category_id
            LEFT JOIN forum_posts p ON ft.thread_id = p.thread_id
            WHERE ft.user_id = ?
            GROUP BY ft.thread_id
            ORDER BY ${conn.escapeId(orderByField)} ${orderDirection === 'ASC' ? 'ASC' : 'DESC'}
            LIMIT ? OFFSET ?
        `;

        const countSql = `
            SELECT COUNT(*) AS totalCount 
            FROM forum_threads 
            WHERE user_id = ?
        `;

        const [threadsResult, [countResult]] = await Promise.all([
            conn.execute(threadsSql, [userId, limit.toString(), offset.toString()]),
            conn.execute(countSql, [userId])
        ]);

        await conn.commit();

        return {
            threads: threadsResult[0].map(thread => ({
                ...thread,
                post_count: Number(thread.post_count)
            })),
            pagination: {
                totalItems: Number(countResult[0].totalCount),
                currentPage: page,
                totalPages: Math.ceil(Number(countResult[0].totalCount) / limit),
                itemsPerPage: limit,
                limit: limit,
                sortBy: orderByField,
                sortOrder: orderDirection
            }
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in getThreadsByUserDB:", error);
        throw new Error("Failed to retrieve threads by user from database");
    } finally {
        if (conn) conn.release();
    }
};

const createThreadDB = async (userId, categoryId, threadName, description = null) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const insertSql = `
            INSERT INTO forum_threads (thread_name, category_id, user_id, description) 
            VALUES (?, ?, ?, ?)
        `;
        const [insertResult] = await conn.execute(insertSql, [
            threadName,
            categoryId,
            userId,
            description
        ]);

        const threadId = insertResult.insertId;

        const getUsernameSql = `
            SELECT username
            FROM users
            WHERE user_id = ?
        `;
        const [userRows] = await conn.execute(getUsernameSql, [userId]);
        const username = userRows[0]?.username || null;

        await conn.commit();

        return {
            threadId,
            username,
            categoryId,
            threadName
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in createThreadDB:", error);

        if (error.message === "Thread name is required" ||
            error.message === "Invalid category ID" ||
            error.message === "Category does not exist" ||
            error.message === "Thread name already exists in this category") {
            throw error;
        }

        throw new Error("Failed to create thread in database");
    } finally {
        if (conn) conn.release();
    }
};

const updateThreadDB = async (userId, threadId, threadName, description) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const updateSql = `
            UPDATE forum_threads
            SET
                thread_name = COALESCE(?, thread_name),
                description = COALESCE(?, description)
            WHERE thread_id = ?
        `;

        const [updateResult] = await conn.execute(updateSql, [
            threadName ? threadName : null,
            description !== undefined ? description : null,
            threadId
        ]);

        if (updateResult.affectedRows === 0) {
            throw new Error("Thread not found or no changes made");
        }

        await conn.commit();
        return 'Thread updated successfully';
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in updateThreadDB:", error);
        if ([
            "Invalid thread ID",
            "Thread not found or unauthorized",
            "No fields to update provided",
            "Thread name already exists in this category",
            "Thread not found or no changes made"
        ].includes(error.message)) {
            throw error;
        }

        throw new Error("Failed to update thread in database");
    } finally {
        if (conn) conn.release();
    }
};

const deleteThreadDB = async (userId, threadId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const deleteSql = `
            DELETE FROM forum_threads
            WHERE thread_id = ?
        `;
        const [deleteResult] = await conn.execute(deleteSql, [threadId]);

        if (deleteResult.affectedRows === 0) {
            throw new Error("Thread not found or already deleted");
        }

        await conn.commit();

        return `Thread with ID ${threadId} deleted successfully`;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in deleteThreadDB:", error);

        if (error.message === "Invalid thread ID" ||
            error.message === "Thread not found or unauthorized" ||
            error.message === "Cannot delete thread with existing posts" ||
            error.message === "Thread not found or already deleted") {
            throw error;
        }

        throw new Error("Failed to delete thread from database");
    } finally {
        if (conn) conn.release();
    }
};

const incrementThreadViewsDB = async (threadId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        const sql = `
            UPDATE forum_threads
            SET view_count = view_count + 1
            WHERE thread_id = ?
        `;
        await conn.execute(sql, [threadId]);
    } catch (error) {
        console.error("Database error in incrementThreadViewsDB:", error);
        throw new Error("Failed to increment thread views");
    } finally {
        if (conn) conn.release();
    }
};

export default {
    getAllThreadsDB,
    getThreadsByCategoryDB,
    getThreadByIdDB,
    getPostsByThreadDB,
    getThreadsByUserDB,
    createThreadDB,
    updateThreadDB,
    deleteThreadDB,
    incrementThreadViewsDB
};