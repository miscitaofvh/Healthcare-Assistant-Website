import connection from '../../config/connection.js';

const getAllThreadsDB = async (page = 1, limit = 10, orderByField = 'ft.created_at', orderDirection = 'ASC') => {
    let conn;
    const offset = (page - 1) * limit;

    try {
        conn = await connection.getConnection();

        const validThreadColumns = [
            'ft.thread_name', 'ft.created_at', 'ft.last_updated',
            'post_count', 'last_post_date', 'last_post_author'
        ];

        if (!validThreadColumns.includes(orderByField)) {
            orderByField = 'ft.created_at';
        }

        const threadsSql = `
            SELECT 
                ft.thread_id,
                ft.thread_name,
                ft.description,
                ft.created_at,
                ft.last_updated,
                u.username AS created_by,
                fc.category_id,
                fc.category_name,
                COUNT(DISTINCT fp.post_id) AS post_count,
                MAX(fp.created_at) AS last_post_date,
                (SELECT username FROM users WHERE user_id = (
                    SELECT user_id FROM forum_posts 
                    WHERE thread_id = ft.thread_id 
                    ORDER BY created_at DESC LIMIT 1
                )) AS last_post_author
            FROM forum_threads ft
            JOIN users u ON ft.user_id = u.user_id
            JOIN forum_categories fc ON ft.category_id = fc.category_id
            LEFT JOIN forum_posts fp ON fp.thread_id = ft.thread_id
            GROUP BY ft.thread_id, fc.category_id
            ORDER BY ${conn.escapeId(orderByField)} ${orderDirection}
            LIMIT ? OFFSET ?
        `;

        const countSql = `
            SELECT COUNT(*) AS totalCount 
            FROM forum_threads
        `;

        const [[threads], [countResult]] = await Promise.all([
            conn.execute(threadsSql, [limit.toString(), offset.toString()]),
            conn.execute(countSql)
        ]);

        await conn.commit();

        return {
            threads: threads.map(thread => ({
                ...thread,
                post_count: Number(thread.post_count)
            })),
            pagination: {
                totalItems: Number(countResult[0].totalCount),
                currentPage: page,
                totalPages: Math.ceil(Number(countResult[0].totalCount) / limit),
                itemsPerPage: limit,
                limit,
                sortBy: orderByField,
                sortOrder: orderDirection
            }
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in getAllThreadsDB:", error);
        throw new Error(error.message || "Failed to retrieve threads from database");
    } finally {
        if (conn) conn.release();
    }
};

const getSummaryThreadsDB = async (limit = null) => {
    let conn;
    try {
        conn = await connection.getConnection();

        const sql = `
            SELECT 
                thread_id,
                thread_name,
                category_id
            FROM forum_threads
            ORDER BY created_at DESC
            ${limit ? `LIMIT ?` : ''}
        `;

        const [threads] = await conn.execute(sql, limit ? [limit.toString()] : []);

        if (!threads.length) {
            throw new Error("No threads found");
        }

        return threads;
    } catch (error) {
        console.error("Database error in getSummaryThreadsDB:", error);
        throw new Error(error.message || "Failed to retrieve thread summaries");
    } finally {
        if (conn) conn.release();
    }
};

const getPopularThreadsDB = async (limit = 6) => {
    let conn;

    if (!limit) {
        limit = 6;
    }
    
    try {
        conn = await connection.getConnection();

        const sql = `
            SELECT 
                ft.thread_id,
                ft.thread_name,
                ft.category_id,
                ft.created_at,
                COUNT(DISTINCT fp.post_id) as post_count,
                MAX(fp.created_at) as last_post_date
            FROM forum_threads ft
            LEFT JOIN forum_posts fp ON ft.thread_id = fp.thread_id
            GROUP BY ft.thread_id, ft.thread_name, ft.category_id, ft.created_at
            ORDER BY post_count DESC
            LIMIT ?
        `;

        const [threads] = await conn.execute(sql, [limit.toString()]);

        if (!threads.length) {
            throw new Error("No threads found");
        }

        return threads.map(thread => ({
            ...thread,
            post_count: Number(thread.post_count)
        }));
    } catch (error) {
        console.error("Database error in getSummaryThreadsDB:", error);
        throw new Error(error.message || "Failed to retrieve thread summaries");
    } finally {
        if (conn) conn.release();
    }
};

const getThreadByIdDB = async (threadId) => {
    let conn;
    try {
        conn = await connection.getConnection();

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
                COUNT(DISTINCT fp.post_id) AS post_count,
                MAX(fp.created_at) AS last_post_date
            FROM forum_threads ft
            JOIN users u ON ft.user_id = u.user_id
            JOIN forum_categories fc ON ft.category_id = fc.category_id
            LEFT JOIN forum_posts fp ON fp.thread_id = ft.thread_id
            WHERE ft.thread_id = ?
            GROUP BY ft.thread_id, fc.category_id
        `;

        const [result] = await conn.execute(sql, [threadId]);
        const thread = result[0];

        if (!thread) {
            throw new Error("Thread not found");
        }

        return {
            ...thread,
            post_count: Number(thread.post_count)
        };
    } catch (error) {
        console.error("Database error in getThreadByIdDB:", error);
        throw new Error(error.message || "Failed to retrieve thread by ID");
    } finally {
        if (conn) conn.release();
    }
};

const getPostsByThreadDB = async (threadId, page = 1, limit = 10, sort = 'p.created_at DESC', author_id = null) => {
    let conn;
    const offset = (page - 1) * limit;

    try {
        conn = await connection.getConnection();

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
                COUNT(DISTINCT fp.post_id) AS post_count
                ${author_id ? ', (ft.user_id = ?) AS is_owner' : ''}
            FROM forum_threads ft
            JOIN users u ON ft.user_id = u.user_id
            JOIN forum_categories fc ON ft.category_id = fc.category_id
            LEFT JOIN forum_posts fp ON fp.thread_id = ft.thread_id
            WHERE ft.thread_id = ?
            GROUP BY ft.thread_id, fc.category_id
        `;

        const validPostColumns = [
            'p.created_at DESC', 'p.created_at ASC',
            'p.comment_count DESC', 'p.like_count DESC'
        ];

        if (!validPostColumns.includes(sort)) {
            sort = 'p.created_at DESC';
        }

        const postsSql = `
            SELECT 
                p.post_id,
                p.title,
                p.content,
                p.view_count,
                p.comment_count,
                p.like_count,
                p.created_at,
                p.last_updated,
                u.username AS created_by
                ${author_id ? ', (p.user_id = ?) AS is_owner' : ''}
            FROM forum_posts p
            JOIN users u ON p.user_id = u.user_id
            WHERE p.thread_id = ?
            ORDER BY ${sort}
            LIMIT ? OFFSET ?
        `;

        const countSql = `
            SELECT COUNT(*) AS totalCount 
            FROM forum_posts 
            WHERE thread_id = ?
        `;

        const [[threadResult], [posts], [countResult]] = await Promise.all([
            conn.execute(threadSql, author_id ? [author_id, threadId] : [threadId]),
            conn.execute(postsSql, author_id ? [author_id, threadId, limit.toString(), offset.toString()] : [threadId, limit.toString(), offset.toString()]),
            conn.execute(countSql, [threadId])
        ]);

        const thread = threadResult[0];

        if (!thread) {
            throw new Error("Thread not found");
        }

        await conn.commit();

        return {
            thread: {
                ...thread,
                post_count: Number(thread.post_count),
                is_owner: author_id ? thread.is_owner === 1 : false
            },
            posts: posts.map(post => ({
                ...post,
                comment_count: Number(post.comment_count),
                like_count: Number(post.like_count),
                view_count: Number(post.view_count),
                is_owner: author_id ? post.is_owner === 1 : false
            })),
            pagination: {
                totalItems: Number(countResult[0].totalCount),
                currentPage: page,
                totalPages: Math.ceil(Number(countResult[0].totalCount) / limit),
                itemsPerPage: limit,
                limit,
                sortBy: sort,
                sortOrder: sort.includes('DESC') ? 'DESC' : 'ASC'
            }
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in getPostsByThreadDB:", error);
        throw new Error(error.message || "Failed to retrieve posts by thread");
    } finally {
        if (conn) conn.release();
    }
};

const getThreadByNameDB = async (name) => {
    let conn;
    try {
        conn = await connection.getConnection();

        const sql = `
            SELECT 
                ft.thread_id,
                ft.thread_name,
                ft.description,
                ft.created_at,
                ft.last_updated,
                u.username AS created_by,
                fc.category_id,
                fc.category_name
            FROM forum_threads ft
            JOIN users u ON ft.user_id = u.user_id
            JOIN forum_categories fc ON ft.category_id = fc.category_id
            WHERE ft.thread_name = ?
        `;

        const [result] = await conn.execute(sql, [name.trim()]);
        const thread = result[0];

        if (!thread) {
            throw new Error("Thread not found");
        }

        return thread;
    } catch (error) {
        console.error("Database error in getThreadByNameDB:", error);
        throw new Error(error.message || "Failed to retrieve thread by name");
    } finally {
        if (conn) conn.release();
    }
};

const getThreadsByUserDB = async (username, page = 1, limit = 10, orderByField = 'ft.created_at', orderDirection = 'ASC') => {
    let conn;
    const offset = (page - 1) * limit;

    try {
        conn = await connection.getConnection();

        const validThreadColumns = [
            'ft.thread_name', 'ft.created_at', 'ft.last_updated',
            'post_count', 'last_post_date'
        ];

        if (!validThreadColumns.includes(orderByField)) {
            orderByField = 'ft.created_at';
        }

        const threadsSql = `
            SELECT 
                ft.thread_id,
                ft.thread_name,
                ft.description,
                ft.created_at,
                ft.last_updated,
                u.username AS created_by,
                fc.category_id,
                fc.category_name,
                COUNT(DISTINCT fp.post_id) AS post_count,
                MAX(fp.created_at) AS last_post_date
            FROM forum_threads ft
            JOIN users u ON ft.user_id = u.user_id
            JOIN forum_categories fc ON ft.category_id = fc.category_id
            LEFT JOIN forum_posts fp ON fp.thread_id = ft.thread_id
            WHERE u.username = ?
            GROUP BY ft.thread_id, fc.category_id
            ORDER BY ${conn.escapeId(orderByField)} ${orderDirection}
            LIMIT ? OFFSET ?
        `;

        const countSql = `
            SELECT COUNT(*) AS totalCount 
            FROM forum_threads ft
            JOIN users u ON ft.user_id = u.user_id
            WHERE u.username = ?
        `;

        const [[threads], [countResult]] = await Promise.all([
            conn.execute(threadsSql, [username.trim(), limit.toString(), offset.toString()]),
            conn.execute(countSql, [username.trim()])
        ]);

        await conn.commit();

        if (!threads.length) {
            throw new Error("No threads found for this user");
        }

        return {
            threads: threads.map(thread => ({
                ...thread,
                post_count: Number(thread.post_count)
            })),
            pagination: {
                totalItems: Number(countResult[0].totalCount),
                currentPage: page,
                totalPages: Math.ceil(Number(countResult[0].totalCount) / limit),
                itemsPerPage: limit,
                limit,
                sortBy: orderByField,
                sortOrder: orderDirection
            }
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in getThreadsByUserDB:", error);
        throw new Error(error.message || "Failed to retrieve threads by user");
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
            INSERT INTO forum_threads (user_id, category_id, thread_name, description)
            VALUES (?, ?, ?, ?)
        `;
        const [insertResult] = await conn.execute(insertSql, [
            userId,
            categoryId,
            threadName.trim(),
            description?.trim() || null
        ]);

        const threadId = insertResult.insertId;
        if (!threadId) {
            throw new Error("Failed to create thread");
        }

        await conn.commit();
        return { threadId };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in createThreadDB:", error);
        throw new Error(error.message || "Failed to create thread");
    } finally {
        if (conn) conn.release();
    }
};

const updateThreadDB = async (threadId, threadName, description) => {
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
            threadName ? threadName.trim() : null,
            description !== undefined ? description?.trim() : null,
            threadId
        ]);

        if (updateResult.affectedRows === 0) {
            throw new Error("Thread not found or no changes made");
        }

        await conn.commit();
        return "Thread updated successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in updateThreadDB:", error);
        throw new Error(error.message || "Failed to update thread");
    } finally {
        if (conn) conn.release();
    }
};

const deleteThreadDB = async (threadId) => {
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
            throw new Error("Thread not found");
        }

        await conn.commit();
        return `Thread with ID ${threadId} deleted successfully`;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in deleteThreadDB:", error);
        throw new Error(error.message || "Failed to delete thread");
    } finally {
        if (conn) conn.release();
    }
};

export default {
    getAllThreadsDB,
    getSummaryThreadsDB,
    getPopularThreadsDB,
    getThreadByIdDB,
    getPostsByThreadDB,
    getThreadByNameDB,
    getThreadsByUserDB,
    createThreadDB,
    updateThreadDB,
    deleteThreadDB
};