import connection from '../../config/connection.js';

export const getAllTagsDB = async () => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT 
                t.tag_id, t.tag_name, t.description,
                t.usage_count, t.last_used_at,
                t.created_at, t.last_updated,
                u.username AS creator,
                COUNT(DISTINCT tm.post_id) AS post_count
            FROM forum_tags t
            LEFT JOIN forum_tags_mapping tm ON t.tag_id = tm.tag_id
            LEFT JOIN users u ON t.user_id = u.user_id
            GROUP BY t.tag_id
            ORDER BY t.usage_count DESC, t.last_used_at DESC
        `;
        const [tags] = await conn.execute(sql);
        await conn.commit();
        return tags;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting tags:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const getTagByIdDB = async (tagId) => {
    let conn;
    try {
        if (!tagId) {
            throw new Error("Tag ID is required");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT 
                t.tag_id, t.tag_name, t.description,
                t.usage_count, t.last_used_at,
                t.created_at, t.last_updated,
                t.user_id, u.username AS creator,
                COUNT(DISTINCT tm.post_id) AS post_count,
                GROUP_CONCAT(DISTINCT p.post_id) AS post_ids
            FROM forum_tags t
            LEFT JOIN forum_tags_mapping tm ON t.tag_id = tm.tag_id
            LEFT JOIN forum_posts p ON tm.post_id = p.post_id
            LEFT JOIN users u ON t.user_id = u.user_id
            WHERE t.tag_id = ?
            GROUP BY t.tag_id
        `;
        const [tag] = await conn.execute(sql, [tagId]);
        await conn.commit();
        return tag[0] || null;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting tag:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const getTagByNameDB = async (tagName) => {
    let conn;
    try {
        if (!tagName) {
            throw new Error("Tag name is required");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT 
                t.tag_id, t.tag_name, t.description,
                t.created_at, t.last_updated,
                COUNT(DISTINCT tm.post_id) AS post_count
            FROM forum_tags t
            LEFT JOIN forum_tags_mapping tm ON t.tag_id = tm.tag_id
            WHERE t.tag_name = ?
            GROUP BY t.tag_id
        `;
        const [tag] = await conn.execute(sql, [tagName]);
        await conn.commit();
        return tag[0] || null;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting tag by name:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const getPostsByTagDB = async (tagId) => {
    let conn;
    try {
        if (!tagId) {
            throw new Error("Tag ID is required");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT 
                p.post_id, p.content, p.created_at, p.last_updated,
                u.username AS author, u.user_id,
                t.thread_name, c.category_name,
                COUNT(DISTINCT l.like_id) AS like_count,
                COUNT(DISTINCT r.report_id) AS report_count
            FROM forum_posts p
            JOIN forum_tags_mapping tm ON p.post_id = tm.post_id
            JOIN forum_tags t ON tm.tag_id = t.tag_id
            JOIN users u ON p.user_id = u.user_id
            JOIN forum_threads th ON p.thread_id = th.thread_id
            JOIN forum_categories c ON th.category_id = c.category_id
            LEFT JOIN forum_likes l ON p.post_id = l.post_id
            LEFT JOIN forum_reports r ON p.post_id = r.post_id
            WHERE t.tag_id = ?
            GROUP BY p.post_id
            ORDER BY p.created_at DESC
        `;
        const [posts] = await conn.execute(sql, [tagId]);
        await conn.commit();
        return posts;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting posts by tag:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const getPopularTagsDB = async (limit = 10) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT 
                t.tag_id, t.tag_name, t.description,
                t.usage_count, t.last_used_at,
                t.created_at, t.last_updated,
                u.username AS creator,
                COUNT(DISTINCT tm.post_id) AS post_count
            FROM forum_tags t
            LEFT JOIN forum_tags_mapping tm ON t.tag_id = tm.tag_id
            LEFT JOIN users u ON t.user_id = u.user_id
            GROUP BY t.tag_id
            ORDER BY t.usage_count DESC, t.last_used_at DESC
            LIMIT ?
        `;
        const [tags] = await conn.execute(sql, [limit]);
        await conn.commit();
        return tags;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting popular tags:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const getTagsForPostDB = async (postId) => {
    let conn;
    try {
        if (!postId) {
            throw new Error("Post ID is required");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT 
                t.tag_id, t.tag_name, t.description,
                t.created_at, t.last_updated
            FROM forum_tags t
            JOIN forum_tags_mapping tm ON t.tag_id = tm.tag_id
            WHERE tm.post_id = ?
        `;
        const [tags] = await conn.execute(sql, [postId]);
        await conn.commit();
        return tags;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting tags for post:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const getTagsByUserDB = async (userId) => {
    let conn;
    try {
        if (!userId) {
            throw new Error("User ID is required");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT DISTINCT
                t.tag_id, t.tag_name, t.description,
                t.created_at, t.last_updated,
                COUNT(DISTINCT tm.post_id) AS post_count
            FROM forum_tags t
            JOIN forum_tags_mapping tm ON t.tag_id = tm.tag_id
            JOIN forum_posts p ON tm.post_id = p.post_id
            WHERE p.user_id = ?
            GROUP BY t.tag_id
            ORDER BY post_count DESC
        `;
        const [tags] = await conn.execute(sql, [userId]);
        await conn.commit();
        return tags;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting tags by user:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const createTagDB = async (tagName, description = null, userId) => {
    let conn;
    try {
        if (!tagName || !userId) {
            throw new Error("Tag name and user ID are required");
        }

        if (tagName.length > 100) {
            throw new Error("Tag name must be less than 100 characters");
        }

        if (description && description.length > 1000) {
            throw new Error("Description must be less than 1000 characters");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Check if tag already exists
        const [existingTag] = await conn.execute(
            "SELECT tag_id FROM forum_tags WHERE tag_name = ?",
            [tagName]
        );

        if (existingTag[0]) {
            throw new Error("Tag already exists");
        }

        const sql = `
            INSERT INTO forum_tags (tag_name, description, user_id, created_at)
            VALUES (?, ?, ?, NOW())
        `;
        const [result] = await conn.execute(sql, [tagName, description, userId]);
        await conn.commit();
        return { tagId: result.insertId };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error creating tag:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const updateTagDB = async (tagId, tagName, description = null, userId) => {
    let conn;
    try {
        if (!tagId || !tagName || !userId) {
            throw new Error("Tag ID, name, and user ID are required");
        }

        if (tagName.length > 100) {
            throw new Error("Tag name must be less than 100 characters");
        }

        if (description && description.length > 1000) {
            throw new Error("Description must be less than 1000 characters");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Check if tag exists and user is authorized
        const [tag] = await conn.execute(
            "SELECT user_id FROM forum_tags WHERE tag_id = ?",
            [tagId]
        );

        if (!tag[0]) {
            throw new Error("Tag not found");
        }

        if (tag[0].user_id !== userId) {
            throw new Error("Unauthorized: You can only update your own tags");
        }

        // Check if new name conflicts with existing tag
        const [existingTag] = await conn.execute(
            "SELECT tag_id FROM forum_tags WHERE tag_name = ? AND tag_id != ?",
            [tagName, tagId]
        );

        if (existingTag[0]) {
            throw new Error("Tag name already exists");
        }

        const sql = `
            UPDATE forum_tags
            SET tag_name = ?, description = ?, last_updated = NOW()
            WHERE tag_id = ?
        `;
        await conn.execute(sql, [tagName, description, tagId]);
        await conn.commit();
        return "Tag updated successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error updating tag:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const deleteTagDB = async (tagId, userId) => {
    let conn;
    try {
        if (!tagId || !userId) {
            throw new Error("Tag ID and user ID are required");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Check if tag exists and user is authorized
        const [tag] = await conn.execute(
            "SELECT user_id FROM forum_tags WHERE tag_id = ?",
            [tagId]
        );

        if (!tag[0]) {
            throw new Error("Tag not found");
        }

        if (tag[0].user_id !== userId) {
            throw new Error("Unauthorized: You can only delete your own tags");
        }

        // Delete related data first
        await conn.execute("DELETE FROM forum_tags_mapping WHERE tag_id = ?", [tagId]);
        await conn.execute("DELETE FROM forum_tags WHERE tag_id = ?", [tagId]);
        
        await conn.commit();
        return "Tag deleted successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error deleting tag:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const getAllTagsByPostDB = async (postId) => {
    let conn;
    try {
        if (!postId) {
            throw new Error("Post ID is required");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT 
                t.tag_id,
                t.tag_name,
                t.description,
                t.created_at,
                t.updated_at
            FROM forum_tags t
            INNER JOIN forum_post_tags pt ON t.tag_id = pt.tag_id
            WHERE pt.post_id = ?
            ORDER BY t.tag_name ASC
        `;
        const [tags] = await conn.execute(sql, [postId]);
        await conn.commit();
        return tags;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting tags by post:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const getTagsOfPostDB = async (postId) => {
    let conn;
    try {
        if (!postId) {
            throw new Error("Post ID is required");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT 
                t.tag_id,
                t.tag_name,
                t.description,
                t.created_at,
                t.last_updated,
                COUNT(DISTINCT pt.post_id) as usage_count
            FROM forum_tags t
            INNER JOIN forum_tags_mapping pt ON t.tag_id = pt.tag_id
            WHERE pt.post_id = ?
            GROUP BY t.tag_id
            ORDER BY t.tag_name ASC
        `;
        const [tags] = await conn.execute(sql, [postId]);
        await conn.commit();
        return tags;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting tags of post:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const getTagOfPostByIdDB = async (postId, tagId) => {
    let conn;
    try {
        if (!postId || !tagId) {
            throw new Error("Post ID and Tag ID are required");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT 
                t.tag_id,
                t.tag_name,
                t.description,
                t.created_at,
                t.updated_at,
                COUNT(DISTINCT pt.post_id) as usage_count
            FROM forum_tags t
            INNER JOIN forum_post_tags pt ON t.tag_id = pt.tag_id
            WHERE pt.post_id = ? AND t.tag_id = ?
            GROUP BY t.tag_id
        `;
        const [tags] = await conn.execute(sql, [postId, tagId]);
        await conn.commit();
        return tags[0] || null;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting tag of post by ID:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const addTagsToPostDB = async (postId, tagIds, userId) => {
    let conn;
    try {
        if (!postId || !tagIds || !Array.isArray(tagIds) || tagIds.length === 0 || !userId) {
            throw new Error("Post ID, tag IDs, and user ID are required");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Check if post exists and user is authorized
        const [post] = await conn.execute(
            "SELECT user_id FROM forum_posts WHERE post_id = ?",
            [postId]
        );

        if (!post[0]) {
            throw new Error("Post not found");
        }

        if (post[0].user_id !== userId) {
            throw new Error("Unauthorized: You can only add tags to your own posts");
        }

        // Check if tags exist
        const [tags] = await conn.execute(
            "SELECT tag_id FROM forum_tags WHERE tag_id IN (?)",
            [tagIds]
        );

        if (tags.length !== tagIds.length) {
            throw new Error("One or more tags not found");
        }

        // Add tags to post and update usage count
        const values = tagIds.map(tagId => [postId, tagId]);
        await conn.execute(
            "INSERT IGNORE INTO forum_tags_mapping (post_id, tag_id) VALUES ?",
            [values]
        );

        // Update usage count and last_used_at for each tag
        await conn.execute(
            `UPDATE forum_tags 
             SET usage_count = usage_count + 1, 
                 last_used_at = NOW() 
             WHERE tag_id IN (?)`,
            [tagIds]
        );

        await conn.commit();
        return "Tags added to post successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error adding tags to post:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const removeTagFromPostDB = async (postId, tagId, userId) => {
    let conn;
    try {
        if (!postId || !tagId || !userId) {
            throw new Error("Post ID, tag ID, and user ID are required");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Check if post exists and user is authorized
        const [post] = await conn.execute(
            "SELECT user_id FROM forum_posts WHERE post_id = ?",
            [postId]
        );

        if (!post[0]) {
            throw new Error("Post not found");
        }

        if (post[0].user_id !== userId) {
            throw new Error("Unauthorized: You can only remove tags from your own posts");
        }

        // Check if mapping exists
        const [mapping] = await conn.execute(
            "SELECT post_id FROM forum_tags_mapping WHERE post_id = ? AND tag_id = ?",
            [postId, tagId]
        );

        if (!mapping[0]) {
            throw new Error("Tag not found on post");
        }

        // Remove tag and update usage count
        await conn.execute(
            "DELETE FROM forum_tags_mapping WHERE post_id = ? AND tag_id = ?",
            [postId, tagId]
        );

        await conn.execute(
            `UPDATE forum_tags 
             SET usage_count = GREATEST(0, usage_count - 1)
             WHERE tag_id = ?`,
            [tagId]
        );
        
        await conn.commit();
        return "Tag removed from post successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error removing tag from post:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};