import connection from '../../config/connection.js';

const getAllCategoriesDB = async (page = 1, limit = 10, orderByField = 'created_at', orderDirection = 'ASC',) => {
    let conn;
    const offset = (page - 1) * limit;
    try {
        conn = await connection.getConnection();

        const validCategoryColumns = [
            'fc.category_name', 'fc.created_at', 'fc.last_updated', 'fc.created_by',
            'post_count', 'last_post_date', 'last_post_author', 'thread_count'
        ];

        if (!validCategoryColumns.includes(orderByField)) {
            orderByField = 'fc.created_at';
        }

        const categoriesSql = `
            SELECT 
                fc.category_id, 
                fc.category_name, 
                fc.description,
                u.username AS created_by,
                fc.created_at,
                fc.last_updated,
                COUNT(DISTINCT ft.thread_id) AS thread_count,
                COUNT(DISTINCT fp.post_id) AS post_count,
                (
                    SELECT MAX(fp3.created_at)
                    FROM forum_posts fp3
                    JOIN forum_threads ft3 ON fp3.thread_id = ft3.thread_id
                    WHERE ft3.category_id = fc.category_id
                ) AS last_post_date
            FROM forum_categories fc
            LEFT JOIN users u ON u.user_id = fc.user_id
            LEFT JOIN forum_threads ft ON ft.category_id = fc.category_id
            LEFT JOIN forum_posts fp ON fp.thread_id = ft.thread_id
            GROUP BY fc.category_id
            ORDER BY ${conn.escapeId(orderByField)} ${orderDirection === 'ASC' ? 'ASC' : 'DESC'}
            LIMIT ? OFFSET ?
        `;

        const countSql = `
            SELECT COUNT(*) AS totalCount 
            FROM forum_categories
        `;

        const [[categoriesResult], [countResult]] = await Promise.all([
            conn.execute(categoriesSql, [limit.toString(), offset.toString()]),
            conn.execute(countSql)
        ]);

        const categories = categoriesResult;

        if (!categories) {
            throw new Error("No categories found");
        }

        await conn.commit();

        return {
            categories: categories.map(category => ({
                ...category,
                thread_count: Number(category.thread_count),
                post_count: Number(category.post_count)
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
        console.error("Database error in getAllCategoriesDB:", error);
        throw new Error(error.message || "Failed to retrieve categories from database");
    } finally {
        if (conn) conn.release();
    }
};

const getThreadsByCategoryDB = async (categoryId, page = 1, limit = 10, orderByField = 'created_at', orderDirection = 'ASC', author_id = null) => {
    let conn;
    const offset = (page - 1) * limit;

    try {
        conn = await connection.getConnection();

        const categorySql = `
            SELECT 
                fc.category_id, 
                fc.category_name,
                fc.description,
                fc.created_at,
                fc.last_updated,
                u.username AS created_by,
                COUNT(DISTINCT ft.thread_id) AS thread_count,
                COUNT(DISTINCT fp.post_id) AS post_count,
                (
                    SELECT MAX(fp2.created_at)
                    FROM forum_posts fp2
                    JOIN forum_threads ft2 ON fp2.thread_id = ft2.thread_id
                    WHERE ft2.category_id = fc.category_id
                ) AS last_post_date
                ${author_id ? ', (fc.user_id = ?) AS is_owner' : ''}
            FROM forum_categories fc
            JOIN users u ON fc.user_id = u.user_id
            LEFT JOIN forum_threads ft ON ft.category_id = fc.category_id
            LEFT JOIN forum_posts fp ON fp.thread_id = ft.thread_id
            WHERE fc.category_id = ?
            GROUP BY fc.category_id
        `;

        const validThreadColumns = [
            'ft.thread_name', 'ft.created_at', 'ft.last_updated', 'ft.created_by',
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
                COUNT(DISTINCT fp.post_id) AS post_count,
                MAX(fp.created_at) AS last_post_date,
                (
                    SELECT username
                    FROM users
                    WHERE user_id = (
                        SELECT user_id
                        FROM forum_posts
                        WHERE thread_id = ft.thread_id
                        ORDER BY created_at DESC
                        LIMIT 1
                    )
                ) AS last_post_author
            FROM forum_threads ft
            JOIN users u ON ft.user_id = u.user_id
            LEFT JOIN forum_posts fp ON fp.thread_id = ft.thread_id
            WHERE ft.category_id = ?
            GROUP BY ft.thread_id
            ORDER BY ${conn.escapeId(orderByField)} ${orderDirection === 'ASC' ? 'ASC' : 'DESC'}
            LIMIT ? OFFSET ?
        `;

        const countSql = `
            SELECT COUNT(*) AS totalCount 
            FROM forum_threads 
            WHERE category_id = ?
        `;

        const [[categoryResult], [threads], [countResult]] = await Promise.all([
            conn.execute(categorySql, author_id ? [author_id, categoryId] : [categoryId]),
            conn.execute(threadsSql, [categoryId, limit.toString(), offset.toString()]),
            conn.execute(countSql, [categoryId])
        ]);

        const category = categoryResult[0];

        await conn.commit();

        if (!category) {
            throw new Error("Category not found");
        }

        return {
            category: {
                ...category,
                thread_count: Number(category.thread_count),
                post_count: Number(category.post_count),
                is_owner: author_id ? category.is_owner === 1 : false
            },
            threads: threads.map(thread => ({
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
        console.error("Database error in getThreadsByCategoryDB:", error);
        throw new Error(error.message.includes("Category not found") ?
            error.message : "Failed to retrieve threads by category");
    } finally {
        if (conn) conn.release();
    }
};

const getSummaryCategoriesDB = async (limit = null) => {
    let conn;
    try {
        conn = await connection.getConnection();

        const sql = `
            SELECT 
                category_id, 
                category_name
            FROM forum_categories fc
            ORDER BY created_at DESC
            ${limit ? `LIMIT ?` : ''}
        `;

        const [categories] = await conn.execute(sql, limit ? [limit.toString()] : []);

        if (!categories) {
            throw new Error("No categories found");
        }

        return categories;

    } catch (error) {
        console.error("Database error in getSummaryCategoriesDB:", error);
        throw new Error(error.message || "Failed to retrieve category summaries");
    } finally {
        if (conn) conn.release();
    }
}

const getPopularCategoriesDB = async (limit = 6) => {
    let conn;

    if (!limit) {
        limit = 6;
    }

    try {
        conn = await connection.getConnection();

        const sql = `
            SELECT 
                fc.category_id, 
                fc.category_name,
                fc.created_at,
                fc.description,
                COUNT(DISTINCT ft.thread_id) as thread_count,
                COUNT(DISTINCT fp.post_id) as post_count
            FROM forum_categories fc
            LEFT JOIN forum_threads ft ON fc.category_id = ft.category_id
            LEFT JOIN forum_posts fp ON ft.thread_id = fp.thread_id
            GROUP BY fc.category_id, fc.category_name, fc.created_at
            ORDER BY post_count DESC
            LIMIT ?
        `;

        const [categories] = await conn.execute(sql, [limit.toString()]);

        if (!categories) {
            throw new Error("No categories found");
        }

        return categories;

    } catch (error) {
        console.error("Database error in getSummaryCategoriesDB:", error);
        throw new Error(error.message || "Failed to retrieve category summaries");
    } finally {
        if (conn) conn.release();
    }
}

const getCategoryByNameDB = async (name) => {
    let conn;
    try {
        conn = await connection.getConnection();
        const sql = `
            SELECT 
                c.category_id, 
                u.username as created_by,
                c.category_name, 
                c.description,
                c.created_at,
                c.last_updated
            FROM forum_categories c
            JOIN users u ON c.user_id = u.user_id
            WHERE c.category_name = ?
        `;
        const [resultCategory] = await conn.execute(sql, [name]);

        const category = resultCategory[0];

        if (!category) {
            throw new Error("Category not found");
        }

        return category;
    } catch (error) {
        console.error("Database error getting category by name:", error);
        throw new Error(error.message || "Failed to retrieve category by name");
    } finally {
        if (conn) conn.release();
    }
};

const getCategoryByIdDB = async (categoryId) => {
    let conn;
    try {
        conn = await connection.getConnection();

        const sql = `
            SELECT 
                fc.category_id, u.username as created_by, 
                fc.category_name, fc.description, 
                fc.created_at, fc.last_updated
            FROM forum_categories as fc
            JOIN users as u
            WHERE fc.category_id = ?
        `;

        const [returnCategory] = await conn.execute(sql, [categoryId]);

        const category = returnCategory[0];

        if (!category) {
            throw new Error("Category not found");
        }

        return category;
    }
    catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting category:", error);
        throw new Error(error.message || "Failed to retrieve category by ID");
    } finally {
        if (conn) conn.release();
    }
}

const getThreadsSummaryByCategoryDB = async (categoryId, limit = null) => {
    let conn;
    try {
        conn = await connection.getConnection();

        const sqlCategory = `
            SELECT 
                fc.category_id, 
                fc.category_name
            FROM forum_categories fc
            WHERE fc.category_id = ?`;
        const [categoryResult] = await conn.execute(sqlCategory, [categoryId]);

        const category = categoryResult[0];

        if (!category) {
            throw new Error("Category not found");
        }

        const sqlThreads = `
            SELECT 
                ft.thread_id,
                ft.thread_name,
                ft.category_id
            FROM forum_threads ft
            WHERE ft.category_id = ?
            ${limit ? `LIMIT ?` : ''}`;
        const [threads] = await conn.execute(sqlThreads, limit ? [categoryId, limit.toString()] : [categoryId]);

        return {
            category: category,
            threads: threads.map(thread => ({
                ...thread,
            })),
            totalCount: threads.length
        };

    } catch (error) {
        console.error("Error in getThreadsByCategoryDB:", error);
        throw new Error(error.message.includes("Category not found") ? error.message : "Failed to retrieve thread summaries by category");
    } finally {
        if (conn) conn.release();
    }
};

const getPostsByCategoryDB = async (categoryId, page = 1, limit = 20, sort = 'p.created_at DESC') => {
    let conn;
    const offset = (page - 1) * limit;

    try {
        conn = await connection.getConnection();

        const sqlCategory = `
            SELECT 
                fc.category_id, 
                fc.category_name
            FROM forum_categories fc
            WHERE fc.category_id = ?`;
        const countSql = `
            SELECT COUNT(*) AS totalCount
            FROM forum_posts p
            INNER JOIN forum_threads t ON p.thread_id = t.thread_id
            WHERE t.category_id = ?
        `;

        const validPostColumns = [
            'p.created_at DESC', 'p.created_at ASC',
            'p.comment_count DESC', 'p.like_count DESC'
        ];

        if (!validPostColumns.includes(sort)) {
            sort = 'p.created_at DESC';
        }

        const sqlPosts = `
            SELECT 
                p.post_id, p.thread_id,
                p.title, p.content,
                p.view_count, p.comment_count, p.like_count,
                p.created_at, p.last_updated
            FROM forum_posts p
            INNER JOIN forum_threads t ON p.thread_id = t.thread_id
            WHERE t.category_id = ?
            ORDER BY ${sort}
            LIMIT ? OFFSET ?
        `;

        const [[categoryResult], [countResult], [posts]] = await Promise.all([
            conn.execute(sqlCategory, [categoryId]),
            conn.execute(countSql, [categoryId]),
            conn.execute(sqlPosts, [categoryId, limit.toString(), offset.toString()])
        ]);

        const category = categoryResult[0];

        if (!category) {
            throw new Error("Category not found");
        }

        const validCategoryColumns = [
            'p.created_at DESC', 'p.created_at ASC',
            'p.comment_count DESC', 'p.like_count DESC'
        ];

        if (!validCategoryColumns.includes(sort)) {
            throw new Error("Invalid sort parameter");
        }

        return {
            category: category,
            posts: posts,
            totalCount: Number(countResult[0].totalCount)
        }
    } catch (error) {
        console.error("Error getting posts by category:", error);
        throw new Error(error.message || "Failed to retrieve posts by category");
    } finally {
        if (conn) conn.release();
    }
};

const getCategoriesByUserDB = async (username, includeStats = false) => {
    let conn;
    try {
        conn = await connection.getConnection();

        let categoriesSql = `
            SELECT 
                fc.category_id, 
                fc.category_name, 
                fc.description,
                fc.created_at,
                fc.last_updated
                ${includeStats ? `,              
                COUNT(DISTINCT ft.thread_id) AS thread_count,
                COUNT(DISTINCT fp.post_id) AS post_count,
                (
                    SELECT MAX(fp3.created_at)
                    FROM forum_posts fp3
                    JOIN forum_threads ft3 ON fp3.thread_id = ft3.thread_id
                    WHERE ft3.category_id = fc.category_id
                ) AS last_post_date` : ''}
            FROM forum_categories fc
            LEFT JOIN users u ON u.user_id = fc.user_id
            LEFT JOIN forum_threads ft ON ft.category_id = fc.category_id
            LEFT JOIN forum_posts fp ON fp.thread_id = ft.thread_id
            WHERE username = ?
            GROUP BY fc.category_id
        `;

        const [categories] = await conn.execute(categoriesSql, [username.trim()]);

        if (!categories.length) {
            throw new Error("No categories found for this user");
        }

        return categories;
    } catch (error) {
        console.error("Error getting categories by user:", error);
        throw new Error(error.message || "Failed to retrieve categories by user");
    } finally {
        if (conn) conn.release();
    }
};

const createCategoryDB = async (author_id, category_name, description = null) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const insertSql = `
            INSERT INTO forum_categories (user_id, category_name, description)
            VALUES (?, ?, ?)
        `;
        const [insertResult] = await conn.execute(insertSql, [
            author_id,
            category_name.trim(),
            description?.trim() || null
        ]);

        const categoryId = insertResult.insertId;
        if (!categoryId) {
            throw new Error("Failed to create category");
        }

        return { categoryId };
    } catch (error) {
        console.error("Error creating category:", error);

        if (error.message === "Category name already exists" ||
            error.message.includes("required")) {
            throw error;
        }
        throw new Error(error.message || "Failed to create category");
    } finally {
        if (conn) conn.release();
    }
};

const updateCategoryDB = async (categoryId, category_name, description) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const updateSql = `
            UPDATE forum_categories
            SET 
                category_name = COALESCE(?, category_name),
                description = COALESCE(?, description)
            WHERE category_id = ?
        `;
        const [updateResult] = await conn.execute(updateSql, [
            category_name ? category_name : null,
            description !== undefined ? description : null,
            categoryId
        ]);

        if (updateResult.affectedRows === 0) {
            throw new Error("Category not found");
        }

        await conn.commit();
        return 'Category updated successfully';

    } catch (error) {
        if (conn) await conn.rollback();

        if ([
            "Category not found",
            "Category name already exists",
            "No fields to update provided"
        ].includes(error.message)) {
            throw error;
        }

        console.error("[UPDATE CATEGORY DB ERROR]", error);
        throw new Error(error.message || "Failed to update category");
    } finally {
        if (conn) conn.release();
    }
};

const deleteCategoryDB = async (categoryId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const deleteSql = `
            DELETE FROM forum_categories
            WHERE category_id = ?
        `;
        const [deleteResult] = await conn.execute(deleteSql, [categoryId]);

        await conn.commit();

        if (deleteResult.affectedRows === 0) {
            throw new Error("Category not found");
        }

        return `Category with ID ${categoryId} deleted successfully`;

    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error deleting category:", error.message);
        throw new Error(error.message || "Failed to delete category");
    } finally {
        if (conn) conn.release();
    }
};

export default {
    getAllCategoriesDB,
    getPopularCategoriesDB,
    getThreadsByCategoryDB,
    getSummaryCategoriesDB,
    getCategoryByNameDB,
    getCategoryByIdDB,
    getThreadsSummaryByCategoryDB,
    getPostsByCategoryDB,
    getCategoriesByUserDB,
    createCategoryDB,
    updateCategoryDB,
    deleteCategoryDB
}