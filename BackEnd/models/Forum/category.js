import connection from '../../config/connection.js';

export const getAllCategoriesDB = async () => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
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
            ORDER BY fc.category_name ASC
        `;

        const [categories] = await conn.execute(sql);
        await conn.commit();

        return categories.map(category => ({
            ...category,
            thread_count: Number(category.thread_count),
            post_count: Number(category.post_count)
        }));
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in getAllCategoriesDB:", error);
        throw new Error("Failed to retrieve categories from database");
    } finally {
        if (conn) conn.release();
    }
};

export const getSummaryCategoriesDB = async () => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = `
            SELECT category_id, category_name
            FROM forum_categories
            ORDER BY created_at DESC
        `;
        const [categories] = await conn.execute(sql);
        await conn.commit();
        return categories;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting categories:", error);
        throw new Error("Failed to get categories");
    } finally {
        if (conn) conn.release();
    }
}

export const getCategoryByNameDB = async (name) => {
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
        return categories[0] || null;
    } catch (error) {
        console.error("Database error getting category by name:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const getCategoryByIdDB = async (categoryId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = `
            SELECT 
                fc.category_id, u.username, 
                fc.category_name, fc.description, 
                fc.created_at, fc.last_updated
            FROM forum_categories as fc
            JOIN users as u
            WHERE fc.category_id = ?
        `;
        if (!categoryId || isNaN(categoryId)) {
            throw new Error("Invalid category ID");
        }
        const [category] = await conn.execute(sql, [categoryId]);

        await conn.commit();
        return category[0] || null;
    }
    catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting category:", error);
        throw new Error("Failed to get category");
    } finally {
        if (conn) conn.release();
    }
}

export const getThreadsByCategoryDB = async (categoryId, page = 1, limit = 20) => {
    let conn;
    try {
        const categoryIdNum = parseInt(categoryId, 10);
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);

        if (isNaN(categoryIdNum)) {
            throw new Error("Invalid category ID");
        }
        if (isNaN(pageNum)) {
            throw new Error("Invalid page number");
        }
        if (isNaN(limitNum)) {
            throw new Error("Invalid limit value");
        }

        const offset = (pageNum - 1) * limitNum;

        conn = await connection.getConnection();

        const sqlCategory = `
            SELECT 
                fc.category_id, 
                fc.category_name,
                fc.description,
                fc.created_at,
                fc.last_updated,
                u.username AS created_by,
                (
                    SELECT COUNT(*) 
                    FROM forum_threads 
                    WHERE category_id = fc.category_id
                ) AS thread_count,
                (
                    SELECT COUNT(*)
                    FROM forum_posts fp
                    JOIN forum_threads ft ON fp.thread_id = ft.thread_id
                    WHERE ft.category_id = fc.category_id
                ) AS post_count
            FROM forum_categories fc
            JOIN users u ON fc.user_id = u.user_id
            WHERE fc.category_id = ?`;
        const [categoryResult] = await conn.execute(sqlCategory, [categoryIdNum]);

        if (categoryResult.length === 0) {
            throw new Error("Category not found");
        }

        const category = categoryResult[0];

        const sqlThreads = `
            SELECT 
                ft.thread_id,
                ft.thread_name,
                ft.description,
                ft.created_at,
                ft.last_updated,
                u.username AS created_by,
                COUNT(fp.post_id) AS post_count,
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
            ORDER BY IFNULL(last_post_date, 0) DESC, ft.created_at DESC
            LIMIT ? OFFSET ?`;
        const [threads] = await conn.execute(sqlThreads, [categoryIdNum, limitNum.toString(), offset.toString()]);

        // Get total thread count for pagination
        const [countResult] = await conn.execute(
            `SELECT COUNT(*) AS totalCount FROM forum_threads WHERE category_id = ?`,
            [categoryIdNum]
        );
        const totalCount = countResult[0].totalCount || 0;

        return {
            category: {
                ...category,
                thread_count: Number(category.thread_count),
                post_count: Number(category.post_count)
            },
            threads: threads.map(thread => ({
                ...thread,
                post_count: Number(thread.post_count)
            })),
            pagination: {
                totalItems: totalCount,
                currentPage: pageNum,
                totalPages: Math.ceil(totalCount / limitNum),
                itemsPerPage: limitNum
            }
        };

    } catch (error) {
        console.error("Error in getThreadsByCategoryDB:", error);
        throw new Error(error.message.includes("Category not found") ? error.message : "Failed to get threads by category");
    } finally {
        if (conn) conn.release();
    }
};

export const getPostsByCategoryDB = async (categoryId, page = 1, limit = 20, sort = 'newest') => {
    let conn;
    try {
        if (!categoryId || isNaN(Number(categoryId))) {
            throw new Error("Invalid category ID");
        }

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

export const getCategoriesByUserDB = async (username, includeStats = false) => {
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
        throw new Error("Invalid username provided");
    }

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
        return categories;
    } catch (error) {
        console.error("Error getting categories by user:", error);
        throw new Error("Failed to get categories by user");
    } finally {
        if (conn) conn.release();
    }
};

export const createCategoryDB = async (author_id, category_name, description = null) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!author_id || !uuidRegex.test(author_id)) {
        throw new Error("Invalid author ID format");
    }

    if (!category_name || typeof category_name !== 'string' || category_name.trim().length === 0) {
        throw new Error("Category name is required and must be a non-empty string");
    }

    let conn;
    try {
        conn = await connection.getConnection();

        const checkSql = `
            SELECT category_id
            FROM forum_categories
            WHERE LOWER(category_name) = LOWER(?)
            LIMIT 1
        `;
        const [existing] = await conn.execute(checkSql, [category_name.trim()]);
        if (existing.length > 0) {
            throw new Error("Category name already exists");
        }

        const insertSql = `
            INSERT INTO forum_categories (user_id, category_name, description)
            VALUES (?, ?, ?)
        `;
        const [insertResult] = await conn.execute(insertSql, [
            author_id,
            category_name.trim(),
            description?.trim() || null
        ]);

        return insertResult.insertId;
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


export const updateCategoryDB = async (author_id, categoryId, category_name, description) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const checkSql = `
            SELECT user_id
            FROM forum_categories
            WHERE category_id = ?
        `;
        const [categoryRows] = await conn.execute(checkSql, [categoryId]);
        if (categoryRows.length === 0) {
            throw new Error("Category not found or unauthorized");
        }

        const ownerId = categoryRows[0].user_id;
        if (ownerId !== author_id) {
            throw new Error("Category not found or unauthorized");
        }

        if (category_name) {
            const checkNameSql = `
                SELECT category_id
                FROM forum_categories
                WHERE LOWER(category_name) = ? AND category_id != ?
            `;
            const [nameCheckRows] = await conn.execute(checkNameSql, [category_name.toLowerCase(), categoryId]);
            if (nameCheckRows.length > 0) {
                throw new Error("Category name already exists");
            }
        }

        if (!category_name && !description) {
            throw new Error("No fields to update provided");
        }

        const updateSql = `
            UPDATE forum_categories
            SET 
                category_name = COALESCE(?, category_name),
                description = COALESCE(?, description)
            WHERE category_id = ?
        `;
        const [updateResult] = await conn.execute(updateSql, [
            category_name ? category_name.toLowerCase() : null,
            description !== undefined ? description : null,
            categoryId
        ]);

        if (updateResult.affectedRows === 0) {
            throw new Error("Category not found or no changes made");
        }

        await conn.commit();
        return `Category with ID ${categoryId} updated successfully`;

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

export const deleteCategoryDB = async (author_id, categoryId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const categorySql = `
            SELECT user_id
            FROM forum_categories
            WHERE category_id = ?
        `;
        const [categoryRows] = await conn.execute(categorySql, [categoryId]);

        if (categoryRows.length === 0) {
            throw new Error("Category not found");
        }

        const categoryOwnerId = categoryRows[0].user_id;
        if (categoryOwnerId !== author_id) {
            throw new Error("Category not found or unauthorized");
        }

        const dependencySql = `
            SELECT 1
            FROM forum_threads
            WHERE category_id = ?
            LIMIT 1
        `;
        const [threadRows] = await conn.execute(dependencySql, [categoryId]);

        if (threadRows.length > 0) {
            throw new Error("Cannot delete category with existing threads");
        }

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