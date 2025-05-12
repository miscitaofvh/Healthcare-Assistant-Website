import connection from '../../config/connection.js';

const getAllTagsDB = async (page = 1, limit = 20, search = '', sortBy = 'usage_count', sortOrder = 'DESC') => {
    let conn;
    const offset = (page - 1) * limit;

    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const tagsSql = `
            SELECT 
                t.tag_id, 
                t.tag_name, 
                t.description,
                t.usage_count, 
                t.last_used_at,
                t.created_at, 
                t.last_updated,
                u.username AS created_by,
                COUNT(DISTINCT tm.post_id) AS post_count,
                (
                    SELECT MAX(fp.created_at)
                    FROM forum_posts fp
                    JOIN forum_tags_mapping tm2 ON fp.post_id = tm2.post_id
                    WHERE tm2.tag_id = t.tag_id
                ) AS last_post_date
            FROM forum_tags t
            LEFT JOIN forum_tags_mapping tm ON t.tag_id = tm.tag_id
            LEFT JOIN users u ON t.user_id = u.user_id
            WHERE t.tag_name LIKE ?
            GROUP BY t.tag_id
            ORDER BY ${conn.escapeId(sortBy)} ${sortOrder === 'ASC' ? 'ASC' : 'DESC'}
            LIMIT ? OFFSET ?
        `;

        const countSql = `
            SELECT COUNT(*) as totalCount 
            FROM forum_tags
            WHERE tag_name LIKE ?
        `;

        const [tagsResult, [countResult]] = await Promise.all([
            conn.execute(tagsSql, [`%${search}%`, limit.toString(), offset.toString()]),
            conn.execute(countSql, [`%${search}%`])
        ]);

        await conn.commit();

        return {
            tags: tagsResult[0].map(tag => ({
                ...tag,
                usage_count: Number(tag.usage_count),
                post_count: Number(tag.post_count)
            })),
            pagination: {
                totalItems: Number(countResult[0].totalCount),
                currentPage: page,
                totalPages: Math.ceil(Number(countResult[0].totalCount) / limit),
                itemsPerPage: limit,
                limit: limit,
                sortBy: sortBy,
                sortOrder: sortOrder
            }
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in getAllTagsDB:", error);
        throw new Error("Failed to retrieve tags from database");
    } finally {
        if (conn) conn.release();
    }
};

const getSummaryTagsDB = async () => {
    let conn;

    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const tagsSql = `
            SELECT 
                t.tag_id, 
                t.tag_name,
                t.description
            FROM forum_tags t
        `;

        const tags  = await conn.execute(tagsSql);

        await conn.commit();

        return tags[0] || {};

    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in getSummaryTagsDB:", error);
        throw new Error("Failed to retrieve tag summaries");
    } finally {
        if (conn) conn.release();
    }
};

const getSummaryLittleTagsDB = async () => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const tagsSql = `
            SELECT 
                t.tag_id, 
                t.tag_name,
                COUNT(DISTINCT tm.post_id) AS post_count
            FROM forum_tags t
            LEFT JOIN forum_tags_mapping tm ON t.tag_id = tm.tag_id
            GROUP BY t.tag_id
            ORDER BY post_count DESC
            LIMIT 100
        `;

        const [tags] = await conn.execute(tagsSql);
        await conn.commit();

        return {
            tags: tags.map(tag => ({
                ...tag,
                post_count: Number(tag.post_count)
            }))
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in getSummaryLittleTagsDB:", error);
        throw new Error("Failed to retrieve popular tags");
    } finally {
        if (conn) conn.release();
    }
};

const getSummaryTagByIdDB = async (id) => {
    let conn;
    try {
        conn = await connection.getConnection();

        const sql = `
            SELECT 
                t.tag_id, 
                t.tag_name, 
                t.description,
                t.created_at,
                t.last_updated,
                COUNT(DISTINCT tm.post_id) AS post_count
            FROM forum_tags t
            LEFT JOIN forum_tags_mapping tm ON t.tag_id = tm.tag_id
            WHERE t.tag_id = ?
            GROUP BY t.tag_id
            LIMIT 1
        `;

        const [tags] = await conn.execute(sql, [id]);

        return tags[0] ? {
            ...tags[0],
            post_count: Number(tags[0].post_count)
        } : null;

    } catch (error) {
        console.error(`Database error fetching tag ID ${id}:`, error);

        if (error.message.includes("Invalid tag ID")) {
            throw error;
        }
        throw new Error("Failed to retrieve tag");
    } finally {
        if (conn) conn.release();
    }
};

const getTagByIdDB = async (tagId) => {
    let conn;
    try {
        conn = await connection.getConnection();

        const sql = `
            SELECT 
                t.tag_id, 
                t.tag_name, 
                t.description,
                t.usage_count, 
                t.last_used_at,
                t.created_at, 
                t.last_updated,
                u.username AS created_by,
                COUNT(DISTINCT tm.post_id) AS post_count,
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'post_id', p.post_id,
                            'title', p.title,
                            'created_at', p.created_at
                        )
                    )
                    FROM forum_posts p
                    JOIN forum_tags_mapping tm2 ON p.post_id = tm2.post_id
                    WHERE tm2.tag_id = t.tag_id
                    ORDER BY p.created_at DESC
                    LIMIT 5
                ) AS recent_posts
            FROM forum_tags t
            LEFT JOIN forum_tags_mapping tm ON t.tag_id = tm.tag_id
            LEFT JOIN users u ON t.user_id = u.user_id
            WHERE t.tag_id = ?
            GROUP BY t.tag_id
            LIMIT 1
        `;

        const [results] = await conn.execute(sql, [tagId]);
        return results[0] ? {
            ...results[0],
            usage_count: Number(results[0].usage_count),
            post_count: Number(results[0].post_count)
        } : null;
    } catch (error) {
        console.error(`Database error in getTagByIdDB for ID ${tagId}:`, error);

        if (error.message.includes("Valid numeric tag ID")) {
            throw error;
        }
        throw new Error("Failed to retrieve tag details");
    } finally {
        if (conn) conn.release();
    }
};

const getTagByNameDB = async (tagName) => {
    let conn;
    try {
        conn = await connection.getConnection();

        const sql = `
            SELECT 
                t.tag_id, 
                t.tag_name, 
                t.description,
                t.usage_count,
                t.last_used_at,
                t.created_at, 
                t.last_updated,
                u.username AS created_by,
                COUNT(DISTINCT tm.post_id) AS post_count,
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'post_id', p.post_id,
                            'title', p.title,
                            'created_at', p.created_at,
                            'author', u2.username
                        )
                    )
                    FROM forum_posts p
                    JOIN forum_tags_mapping tm2 ON p.post_id = tm2.post_id
                    JOIN users u2 ON p.user_id = u2.user_id
                    WHERE tm2.tag_id = t.tag_id
                    ORDER BY p.created_at DESC
                    LIMIT 3
                ) AS sample_posts
            FROM forum_tags t
            LEFT JOIN forum_tags_mapping tm ON t.tag_id = tm.tag_id
            LEFT JOIN users u ON t.user_id = u.user_id
            WHERE LOWER(t.tag_name) = LOWER(?)
            GROUP BY t.tag_id
            LIMIT 1
        `;

        const [results] = await conn.execute(sql, [tagName.trim()]);
        return results[0] ? {
            ...results[0],
            usage_count: Number(results[0].usage_count),
            post_count: Number(results[0].post_count)
        } : null;
    } catch (error) {
        console.error(`Database error in getTagByNameDB for name "${tagName}":`, error);

        if (error.message.includes("Valid tag name")) {
            throw error;
        }
        throw new Error("Failed to retrieve tag by name");
    } finally {
        if (conn) conn.release();
    }
};

const getPostsByTagDB = async (tagId, page = 1, limit = 10, author_id = null) => {
    let conn;
    const offset = (page - 1) * limit;

    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sqlTag = `
            SELECT 
                t.tag_id, 
                t.tag_name, 
                t.description,
                t.usage_count, 
                t.last_used_at,
                t.created_at, 
                t.last_updated,
                u.username AS created_by,
                COUNT(DISTINCT tm.post_id) AS post_count
                ${author_id ? ', (t.user_id = ?) AS is_owner' : ''}
            FROM forum_tags t
            LEFT JOIN forum_tags_mapping tm ON t.tag_id = tm.tag_id
            LEFT JOIN users u ON t.user_id = u.user_id
            WHERE t.tag_id = ?
            GROUP BY t.tag_id
            LIMIT 1
        `;

        const sqlPost = `
            SELECT 
                p.post_id, p.content, p.created_at, p.last_updated,
                u.username AS author,
                th.thread_name, th.thread_id,
                cat.category_name, cat.category_id,
                COUNT(DISTINCT l.like_id) AS like_count,
                COUNT(DISTINCT c.comment_id) AS comment_count
            FROM forum_posts p
            JOIN forum_tags_mapping tm ON p.post_id = tm.post_id
            JOIN forum_tags t ON tm.tag_id = t.tag_id
            JOIN users u ON p.user_id = u.user_id
            JOIN forum_threads th ON p.thread_id = th.thread_id
            JOIN forum_categories cat ON th.category_id = cat.category_id
            LEFT JOIN forum_likes l ON p.post_id = l.post_id
            LEFT JOIN forum_comments c ON p.post_id = c.post_id
            WHERE t.tag_id = ?
            GROUP BY p.post_id
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const sqlCount = `
            SELECT COUNT(DISTINCT p.post_id) AS total
            FROM forum_posts p
            JOIN forum_tags_mapping tm ON p.post_id = tm.post_id
            JOIN forum_tags t ON tm.tag_id = t.tag_id
            WHERE t.tag_id = ?
        `;

        const [[tagRows], [posts], [countRows]] = await Promise.all([
            conn.execute(sqlTag,  author_id ? [author_id, tagId] : [tagId]),
            conn.execute(sqlPost, [tagId, limit.toString(), offset.toString()]),
            conn.execute(sqlCount, [tagId])
        ]);

        const tag = tagRows[0];
        const totalPosts = countRows[0].total;

        if (!tag) {
            throw new Error("Tag not found");
        }

        await conn.commit();

        return {
            posts: posts.map(post => ({
                ...post,
                like_count: Number(post.like_count),
                comment_count: Number(post.comment_count)
            })),
            tag: {
                ...tag,
                usage_count: Number(tag.usage_count)
            },
            pagination: {
                totalItems: Number(totalPosts),
                currentPage: page,
                totalPages: Math.ceil(Number(totalPosts) / limit),
                itemsPerPage: limit
            }
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in getPostsByTagDB:", error);

        if (error.message.includes("Tag not found") || error.message.includes("Tag ID is required")) {
            throw error;
        }
        throw new Error("Failed to retrieve posts by tag");
    } finally {
        if (conn) conn.release();
    }
};

const getPopularTagsDB = async (limit = 10) => {
    let conn;
    try {
        conn = await connection.getConnection();

        const sql = `
            SELECT 
                t.tag_id, 
                t.tag_name, 
                t.description,
                t.usage_count, 
                t.last_used_at,
                t.created_at, 
                t.last_updated,
                u.username AS created_by,
                COUNT(DISTINCT tm.post_id) AS post_count
            FROM forum_tags t
            LEFT JOIN forum_tags_mapping tm ON t.tag_id = tm.tag_id
            LEFT JOIN users u ON t.user_id = u.user_id
            GROUP BY t.tag_id
            ORDER BY 
                t.usage_count DESC, 
                t.last_used_at DESC,
                post_count DESC
            LIMIT ?
        `;

        const [tags] = await conn.execute(sql, [limit.toString()]);
        return tags.map(tag => ({
            ...tag,
            usage_count: Number(tag.usage_count),
            post_count: Number(tag.post_count)
        }));
    } catch (error) {
        console.error("Database error in getPopularTagsDB:", error);

        if (error.message.includes("Limit must be")) {
            throw error;
        }
        throw new Error("Failed to retrieve popular tags");
    } finally {
        if (conn) conn.release();
    }
};

const getTagsForPostDB = async (postId) => {
    let conn;
    try {
        if (!postId || !Number.isInteger(Number(postId))) {
            throw new Error("Valid numeric post ID is required");
        }

        conn = await connection.getConnection();

        const sql = `
            SELECT 
                t.tag_id, 
                t.tag_name, 
                t.description,
                t.created_at, 
                t.last_updated,
                t.usage_count,
                u.username AS created_by,
                (
                    SELECT COUNT(*) 
                    FROM forum_tags_mapping 
                    WHERE tag_id = t.tag_id
                ) AS total_usage
            FROM forum_tags t
            JOIN forum_tags_mapping tm ON t.tag_id = tm.tag_id
            LEFT JOIN users u ON t.user_id = u.user_id
            WHERE tm.post_id = ?
            ORDER BY t.tag_name ASC
        `;

        const [tags] = await conn.execute(sql, [postId]);
        return tags.map(tag => ({
            ...tag,
            usage_count: Number(tag.usage_count),
            total_usage: Number(tag.total_usage)
        }));
    } catch (error) {
        console.error(`Database error in getTagsForPostDB for post ${postId}:`, error);

        if (error.message.includes("Valid numeric post ID")) {
            throw error;
        }
        throw new Error("Failed to retrieve tags for post");
    } finally {
        if (conn) conn.release();
    }
};

const getTagsByUserDB = async (username) => {
    let conn;
    try {
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
            WHERE p.username = ?
            GROUP BY t.tag_id
            ORDER BY post_count DESC
        `;
        const [tags] = await conn.execute(sql, [username]);
        await conn.commit();
        return tags.map(tag => ({
            ...tag,
            post_count: Number(tag.post_count)
        }));
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting tags by user:", error);

        if (error.message.includes("User ID is required")) {
            throw error;
        }
        throw new Error("Failed to retrieve tags by user");
    } finally {
        if (conn) conn.release();
    }
};

const createTagDB = async (tagName, description = null, userId) => {
    let conn;
    try {
        if (!tagName || !userId) {
            throw new Error("Tag name and user ID are required");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            INSERT INTO forum_tags (tag_name, description, user_id, created_at)
            VALUES (?, ?, ?, NOW())
        `;
        const [result] = await conn.execute(sql, [
            tagName.trim(),
            description?.trim() || null,
            userId
        ]);

        const tagId = result.insertId;

        const [userResult] = await conn.execute(
            "SELECT username FROM users WHERE user_id = ?",
            [userId]
        );

        await conn.commit();

        return {
            tagId,
            username: userResult[0]?.username || null,
            message: "Tag created successfully"
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error creating tag:", error);

        if (error.message.includes("Tag already exists") ||
            error.message.includes("Tag name and user ID")) {
            throw error;
        }
        throw new Error("Failed to create tag");
    } finally {
        if (conn) conn.release();
    }
};

const updateTagDB = async (tagId, tagName, description = null, userId) => {
    let conn;
    try {
        if (!tagId || !userId) {
            throw new Error("Tag ID and user ID are required");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            UPDATE forum_tags
            SET 
                tag_name = COALESCE(?, tag_name),
                description = COALESCE(?, description),
                last_updated = CURRENT_TIMESTAMP
            WHERE tag_id = ?
        `;
        await conn.execute(sql, [
            tagName?.trim() || null,
            description?.trim() || null,
            tagId
        ]);

        await conn.commit();
        return {
            success: true,
            message: "Tag updated successfully",
            tagId
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error updating tag:", error);

        if (error.message.includes("Unauthorized") ||
            error.message.includes("Tag name already exists") ||
            error.message.includes("Tag ID and user ID")) {
            throw error;
        }
        throw new Error("Failed to update tag");
    } finally {
        if (conn) conn.release();
    }
};

const deleteTagDB = async (tagId, userId) => {
    let conn;
    try {
        if (!tagId || !userId) {
            throw new Error("Tag ID and user ID are required");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        await conn.execute("DELETE FROM forum_tags_mapping WHERE tag_id = ?", [tagId]);
        await conn.execute("DELETE FROM forum_tags WHERE tag_id = ?", [tagId]);

        await conn.commit();
        return {
            success: true,
            message: "Tag deleted successfully",
            tagId
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error deleting tag:", error);

        if (error.message.includes("Unauthorized") ||
            error.message.includes("Tag not found") ||
            error.message.includes("Tag ID and user ID")) {
            throw error;
        }
        throw new Error("Failed to delete tag");
    } finally {
        if (conn) conn.release();
    }
};

const getTagsOfPostDB = async (postId) => {
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
                COUNT(DISTINCT tm.post_id) as usage_count
            FROM forum_tags t
            JOIN forum_tags_mapping tm ON t.tag_id = tm.tag_id
            WHERE tm.post_id = ?
            GROUP BY t.tag_id
            ORDER BY t.tag_name ASC
        `;
        const [tags] = await conn.execute(sql, [postId]);
        await conn.commit();
        return tags.map(tag => ({
            ...tag,
            usage_count: Number(tag.usage_count)
        }));
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting tags of post:", error);

        if (error.message.includes("Post ID is required")) {
            throw error;
        }
        throw new Error("Failed to retrieve tags for post");
    } finally {
        if (conn) conn.release();
    }
};

const getTagOfPostByIdDB = async (postId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT 
                t.tag_id,
                t.tag_name,
                t.description,
                t.created_at,
                t.last_updated,
                COUNT(DISTINCT tm.post_id) as usage_count
            FROM forum_tags t
            JOIN forum_tags_mapping tm ON t.tag_id = tm.tag_id
            WHERE tm.post_id = ?
            GROUP BY t.tag_id
            LIMIT 1
        `;
        const [tags] = await conn.execute(sql, [postId]);
        await conn.commit();
        return tags[0] ? {
            ...tags[0],
            usage_count: Number(tags[0].usage_count)
        } : null;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting tag of post by ID:", error);

        if (error.message.includes("Post ID and Tag ID")) {
            throw error;
        }
        throw new Error("Failed to retrieve tag for post");
    } finally {
        if (conn) conn.release();
    }
};

const addTagsToPostDB = async (postId, tagIds, userId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const values = tagIds.map(tagId => [postId, tagId]);
        await conn.execute(
            "INSERT IGNORE INTO forum_tags_mapping (post_id, tag_id) VALUES ?",
            [values]
        );

        await conn.execute(
            `UPDATE forum_tags 
             SET usage_count = usage_count + 1, 
                 last_used_at = CURRENT_TIMESTAMP 
             WHERE tag_id IN (?)`,
            [tagIds]
        );

        await conn.commit();
        return {
            success: true,
            message: "Tags added to post successfully",
            postId,
            addedTags: tagIds
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error adding tags to post:", error);

        if (error.message.includes("Unauthorized") ||
            error.message.includes("Post not found") ||
            error.message.includes("One or more tags not found") ||
            error.message.includes("Post ID, tag IDs, and user ID")) {
            throw error;
        }
        throw new Error("Failed to add tags to post");
    } finally {
        if (conn) conn.release();
    }
};

const removeTagFromPostDB = async (postId, tagId, userId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

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
        return {
            success: true,
            message: "Tag removed from post successfully",
            postId,
            removedTagId: tagId
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error removing tag from post:", error);

        if (error.message.includes("Unauthorized") ||
            error.message.includes("Post not found") ||
            error.message.includes("Tag not found on post") ||
            error.message.includes("Post ID, tag ID, and user ID")) {
            throw error;
        }
        throw new Error("Failed to remove tag from post");
    } finally {
        if (conn) conn.release();
    }
};

export default {
    getAllTagsDB,
    getSummaryTagsDB,
    getSummaryLittleTagsDB,
    getSummaryTagByIdDB,
    getTagByIdDB,
    getTagByNameDB,
    getPostsByTagDB,
    getPopularTagsDB,
    getTagsForPostDB,
    getTagsByUserDB,
    createTagDB,
    updateTagDB,
    deleteTagDB,
    getTagsOfPostDB,
    getTagOfPostByIdDB,
    addTagsToPostDB,
    removeTagFromPostDB
};