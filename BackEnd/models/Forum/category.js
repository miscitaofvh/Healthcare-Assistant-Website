import connection from '../../config/connection.js';

const getAllCategoriesDB = async (page, limit, orderByField, orderDirection) => {
    let conn;
    const offset = (page - 1) * limit;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

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
            SELECT COUNT(*) as totalCount 
            FROM forum_categories
        `;

        const [categoriesResult, [countResult]] = await Promise.all([
            conn.execute(categoriesSql, [limit.toString(), offset.toString()]),
            conn.execute(countSql)
        ]);

        await conn.commit();

        return {
            categories: categoriesResult[0].map(category => ({
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
        throw new Error("Failed to retrieve categories from database");
    } finally {
        if (conn) conn.release();
    }
};

const getThreadsByCategoryDB = async (categoryId, page = 1, limit = 10, orderByField = 'category_name', orderDirection = 'ASC', author_id = null) => {
    let conn;
    const offset = (page - 1) * limit;
    const categoryIdNum = Number(categoryId);
    const limitNum = Number(limit);
    const pageNum = Number(page);

    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

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
            'thread_id', 'thread_name', 'description',
            'created_at', 'last_updated', 'created_by',
            'post_count', 'last_post_date', 'last_post_author'
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
            conn.execute(categorySql, author_id ? [author_id, categoryIdNum] : [categoryIdNum]),
            conn.execute(threadsSql, [categoryIdNum, limitNum.toString(), offset.toString()]),
            conn.execute(countSql, [categoryIdNum])
        ]);

        const returnCategory = categoryResult[0];

        await conn.commit();

        if (!returnCategory) {
            throw new Error("Category not found");
        }

        return {
            category: {
                ...returnCategory,
                thread_count: Number(returnCategory.thread_count),
                post_count: Number(returnCategory.post_count),
                is_owner: author_id ? returnCategory.is_owner === 1 : false
            },
            threads: threads.map(thread => ({
                ...thread,
                post_count: Number(thread.post_count)
            })),
            pagination: {
                totalItems: Number(countResult[0].totalCount),
                currentPage: pageNum,
                totalPages: Math.ceil(Number(countResult[0].totalCount) / limitNum),
                itemsPerPage: limitNum,
                limit: limitNum,
                sortBy: orderByField,
                sortOrder: orderDirection
            }
        };

    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in getThreadsByCategoryDB:", error);
        throw new Error(error.message.includes("Category not found") ?
            error.message : "Failed to get threads by category");
    } finally {
        if (conn) conn.release();
    }
};

const getSummaryCategoriesDB = async () => {
    let conn;
    try {
        conn = await connection.getConnection();
        
        const sql = `
            SELECT 
                category_id, 
                category_name,
                description,
                created_at,
                (SELECT COUNT(*) FROM forum_threads WHERE category_id = fc.category_id) as thread_count
            FROM forum_categories fc
            ORDER BY created_at DESC
            LIMIT 1000
        `;
        
        const [categories] = await conn.execute(sql);
        
        return categories;
        
    } catch (error) {
        console.error("Database error in getSummaryCategoriesDB:", error);
        throw new Error("Failed to retrieve category summaries");
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
                u.username as author,
                c.category_name, 
                c.description,
                c.created_at,
                c.last_updated
            FROM forum_categories c
            JOIN users u ON c.user_id = u.user_id
            WHERE c.category_name = ?
        `;
        const [categories] = await conn.execute(sql, [name]);

        const category = categories[0];

        return category;
    } catch (error) {
        console.error("Database error getting category by name:", error);
        throw error;
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
                fc.category_id, u.username, 
                fc.category_name, fc.description, 
                fc.created_at, fc.last_updated
            FROM forum_categories as fc
            JOIN users as u
            WHERE fc.category_id = ?
        `;

        const [returnCategory] = await conn.execute(sql, [categoryId]);
        
        const category = returnCategory[0];

        return category;
    }
    catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting category:", error);
        throw new Error("Failed to get category");
    } finally {
        if (conn) conn.release();
    }
}

const getThreadsSummaryByCategoryDB = async (categoryId) => {
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

        const sqlThreads = `
            SELECT 
                ft.thread_id,
                ft.thread_name,
                ft.category_id
            FROM forum_threads ft
            WHERE ft.category_id = ?`;
        const [threads] = await conn.execute(sqlThreads, [categoryId]);

        const [countResult] = await conn.execute(
            `SELECT COUNT(*) AS totalCount FROM forum_threads WHERE category_id = ?`,
            [categoryId]
        );
        const totalCount = countResult[0].totalCount || 0;

        return {
            category: category,
            threads: threads.map(thread => ({
                ...thread,
            })),
            pagination: {
                totalItems: totalCount,
            }
        };

    } catch (error) {
        console.error("Error in getThreadsByCategoryDB:", error);
        throw new Error(error.message.includes("Category not found") ? error.message : "Failed to get threads by category");
    } finally {
        if (conn) conn.release();
    }
};

const getPostsByCategoryDB = async (categoryId, page = 1, limit = 20, sort = 'newest') => {
    let conn;
    try {
        const offset = (page - 1) * limit;

        let orderByClause = 'p.created_at DESC';
        switch (sort) {
            case 'oldest':
                orderByClause = 'p.created_at ASC';
                break;
            case 'most_comments':
                orderByClause = 'p.comment_count DESC';
                break;
            case 'most_likes':
                orderByClause = 'p.like_count DESC';
                break;
        }

        conn = await connection.getConnection();

        const sqlPosts = `
            SELECT p.*
            FROM forum_posts p
            INNER JOIN forum_threads t ON p.thread_id = t.thread_id
            WHERE t.category_id = ?
            ORDER BY ${orderByClause}
            LIMIT ? OFFSET ?
        `;

        const [posts] = await conn.execute(sqlPosts, [categoryId.toString(), limit.toString(), offset.toString()]);

        const sqlCount = `
            SELECT COUNT(*) as totalCount
            FROM forum_posts p
            INNER JOIN forum_threads t ON p.thread_id = t.thread_id
            WHERE t.category_id = ?
        `;

        const [countResult] = await conn.execute(sqlCount, [categoryId]);
        const totalCount = countResult[0]?.totalCount || 0;

        return { posts, totalCount };
    } catch (error) {
        console.error("Error getting posts by category:", error);
        throw new Error("Failed to get posts by category");
    } finally {
        if (conn) conn.release();
    }
};

const getCategoriesByUserDB = async (username, includeStats = false) => {
    let conn;
    try {
        conn = await connection.getConnection();

        let sql = `
            SELECT
                u.username,
                fc.category_id,
                fc.category_name,
                fc.description,
                fc.created_at,
                fc.last_updated
            ${includeStats ? `,
                (
                    SELECT COUNT(*) 
                    FROM forum_threads ft 
                    WHERE ft.category_id = fc.category_id
                ) AS thread_count,
                (
                    SELECT COUNT(fp.post_id) 
                    FROM forum_threads ft
                    JOIN forum_posts fp ON fp.thread_id = ft.thread_id
                    WHERE ft.category_id = fc.category_id
                ) AS post_count
            ` : ''}
            FROM forum_categories AS fc
            JOIN users AS u ON u.user_id = fc.user_id 
            WHERE u.username = ?
            ORDER BY fc.created_at DESC
        `;

        const [categories] = await conn.execute(sql, [username.trim()]);

        if (!categories.length) {
            throw new Error("No categories found for this user");
        }

        return categories;
    } catch (error) {
        console.error("Error getting categories by user:", error);
        throw new Error("Failed to get categories by user");
    } finally {
        if (conn) conn.release();
    }
};

// DB Layer: createCategoryDB
const createCategoryDB = async (author_id, category_name, description = null) => {
    let conn;
    try {
        conn = await connection.getConnection();

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

        const getUsernameSQL = `
            SELECT username
            FROM users
            WHERE user_id = ?
        `;
        const [createResult] = await conn.execute(getUsernameSQL, [author_id]);

        if (createResult.affectedRows === 0) {
            throw new Error("Category not found or no changes made");
        }

        const username = createResult[0]?.username || null;

        return { categoryId, username };
    } catch (error) {
        console.error("Error creating category:", error);

        if (error.message === "Category name already exists" ||
            error.message.includes("required")) {
            throw error;
        }
        throw new Error("Failed to create category");
    } finally {
        if (conn) conn.release();
    }
};


const updateCategoryDB = async (author_id, categoryId, category_name, description) => {
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
            throw new Error("Category not found or no changes made");
        }

        await conn.commit();
        return 'Category updated successfully';

    } catch (error) {
        if (conn) await conn.rollback();

        if ([
            "Category not found or unauthorized",
            "Category name already exists",
            "No fields to update provided",
            "Category not found or no changes made"
        ].includes(error.message)) {
            throw error;
        }

        console.error("[UPDATE CATEGORY DB ERROR]", error);
        throw new Error("Failed to update category");
    } finally {
        if (conn) conn.release();
    }
};

const deleteCategoryDB = async (author_id, categoryId) => {
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
            throw new Error("Category not found or already deleted");
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