import connection from '../../config/connection.js';

export const getAllCategoriesDB = async () => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT *
            FROM forum_categories
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
};

export const getSummaryCategoriesDB = async () => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = `
            SELECT category_id, category_name
            FROM forum_categories
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

export const getCategoryNameDB = async (category_name) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = `
            SELECT category_id 
            FROM forum_categories 
            WHERE category_name = ?
        `;
        const [rows] = await conn.execute(sql, [category_name.toLowerCase()]);
        await conn.commit();
        return rows[0]?.category_id || null;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting category:", error);
        throw new Error("Failed to get category");
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
            SELECT *
            FROM forum_categories
            WHERE category_id = ?
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

export const getThreadsByCategoryDB = async (categoryId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT *
            FROM forum_threads
            WHERE category_id = ?
        `;

        if (!categoryId || isNaN(categoryId)) {
            throw new Error("Invalid category ID");
        }

        const [threads] = await conn.execute(sql, [categoryId]);

        await conn.commit();
        return threads;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting threads by category:", error);
        throw new Error("Failed to get threads by category");
    } finally {
        if (conn) conn.release();
    }
};

export const getPostsByCategoryDB = async (categoryId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT p.*
            FROM forum_posts p
            INNER JOIN forum_threads t ON p.thread_id = t.thread_id
            WHERE t.category_id = ?
        `;

        if (!categoryId || isNaN(categoryId)) {
            throw new Error("Invalid category ID");
        }

        const [posts] = await conn.execute(sql, [categoryId]);

        await conn.commit();
        return posts;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting posts by category:", error);
        throw new Error("Failed to get posts by category");
    } finally {
        if (conn) conn.release();
    }
};

export const getCategoriesByUserDB = async (userId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT *
            FROM forum_categories
            WHERE user_id = ?
        `;

        if (!userId || isNaN(userId)) {
            throw new Error("Invalid user ID");
        }

        const [categories] = await conn.execute(sql, [userId]);

        await conn.commit();
        return categories;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting categories by user:", error);
        throw new Error("Failed to get categories by user");
    } finally {
        if (conn) conn.release();
    }
};


export const createCategoryDB = async (author_id, category_name, description) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Input validation
        if (!category_name || category_name.trim().length === 0) {
            throw new Error("Category name is required");
        }

        const checkSql = `
            SELECT category_id
            FROM forum_categories
            WHERE category_name = ?
        `;
        const [checkResult] = await conn.execute(checkSql, [category_name.toLowerCase()]);
        if (checkResult.length > 0) {
            throw new Error("Category already exists");
        }

        const sql = `
            INSERT INTO forum_categories (user_id, category_name, description) 
            VALUES (?, ?, ?)
        `;
        const [result] = await conn.execute(sql, [author_id, category_name.toLowerCase(), description]);
        await conn.commit();
        return result.insertId;
    } catch (error) {
        if (conn) await conn.rollback();
        if (error.message === "Category already exists") {
            throw error;
        }
        console.error("Error creating category:", error);
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
            SELECT category_id
            FROM forum_categories
            WHERE category_id = ?
        `;
        const [checkResult] = await conn.execute(checkSql, [categoryId]);
        if (checkResult.length === 0) {
            throw new Error("Category not found");
        }

        const validUserSql = `
            SELECT category_id
            FROM forum_categories
            WHERE user_id = ? AND category_id = ?
        `; 

        const [isValidUser] = await conn.execute(validUserSql, [author_id, categoryId]);
        if(isValidUser.length === 0){
            throw new Error("Unauthorized")
        }        

        if (category_name) {
            const checkNameSql = `
                SELECT category_id
                FROM forum_categories
                WHERE category_name = ? AND category_id != ?
            `;
            const [nameCheck] = await conn.execute(checkNameSql, [category_name.toLowerCase(), categoryId]);
            if (nameCheck.length > 0) {
                throw new Error("Category name already exists");
            }
        }

        if(!category_name && !description) {
            throw new Error("No fields to update provided");
        }

        const sql = `
            UPDATE forum_categories
            SET 
                category_name = COALESCE(?, category_name),
                description = COALESCE(?, description)
            WHERE category_id = ?
        `;
        const [result] = await conn.execute(sql, [category_name?.toLowerCase(), description, categoryId]);
        await conn.commit();
        if (result.affectedRows === 0) {
            throw new Error("Category not found or no changes made");
        }

        return `Category with ID ${categoryId} updated successfully`;

    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error updating category:", error);
        throw new Error("Failed to update category");
    }
    finally {
        if (conn) conn.release();
    }
}

export const deleteCategoryDB = async (author_id, categoryId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const checkSql = `
            SELECT category_id
            FROM forum_categories
            WHERE category_id = ?
        `;

        const [checkResult] = await conn.execute(checkSql, [categoryId]);
        if (checkResult.length === 0) {
            throw new Error("Category not found");
        }

        const validUserSql = `
            SELECT category_id
            FROM forum_categories
            WHERE user_id = ? AND category_id = ?
        `; 

        const [isValidUser] = await conn.execute(validUserSql, [author_id, categoryId]);
        if(isValidUser.length === 0){
            throw new Error("Unauthorized")
        }

        const checkDependenciesSql = `
            SELECT COUNT(*) as count
            FROM forum_threads
            WHERE category_id = ?
        `;
        const [dependencies] = await conn.execute(checkDependenciesSql, [categoryId]);
        if (dependencies[0].count > 0) {
            throw new Error("Cannot delete category with existing threads");
        }

        const sql = `
            DELETE FROM forum_categories
            WHERE category_id = ?
        `;
        const [result] = await conn.execute(sql, [categoryId]);

        await conn.commit();
        if (result.affectedRows === 0) {
            throw new Error("Category not found or already deleted");
        }

        return `Category with ID ${categoryId} deleted successfully`;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error deleting category:", error);
        throw new Error("Failed to delete category");
    } finally {
        if (conn) conn.release();
    }
}