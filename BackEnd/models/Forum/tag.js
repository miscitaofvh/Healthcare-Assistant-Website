import connection from '../../config/connection.js';

export const getAllTagsDB = async (page = 1, limit = 20, search = '', sortBy = 'usage_count', sortOrder = 'DESC') => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const offset = (page - 1) * limit;

        let baseQuery = `
            SELECT 
                t.tag_id, 
                t.tag_name, 
                t.description,
                t.usage_count, 
                t.last_used_at,
                t.created_at, 
                t.last_updated,
                u.username AS created_by
            FROM forum_tags t
            LEFT JOIN forum_tags_mapping tm ON t.tag_id = tm.tag_id
            LEFT JOIN users u ON t.user_id = u.user_id
            WHERE t.tag_name LIKE ?
            GROUP BY t.tag_id
        `;

        const orderByClause = `ORDER BY ${sortBy} ${sortOrder}`;

        const tagsQuery = `${baseQuery} ${orderByClause} LIMIT ? OFFSET ?`;
        const [tags] = await conn.execute(tagsQuery, [`%${search}%`, limit.toString(), offset.toString()]);

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM (
                SELECT t.tag_id
                FROM forum_tags t
                LEFT JOIN forum_tags_mapping tm ON t.tag_id = tm.tag_id
                WHERE t.tag_name LIKE ?
                GROUP BY t.tag_id
            ) AS filtered_tags
        `;
        const [countResult] = await conn.execute(countQuery, [`%${search}%`]);
        const totalTags = countResult[0].total;

        await conn.commit();

        return { tags, totalTags };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in getAllTagsDB:", error);

        const enhancedError = new Error(`Failed to fetch tags: ${error.message}`);
        enhancedError.statusCode = 500;
        enhancedError.originalError = error;
        throw enhancedError;
    } finally {
        if (conn) conn.release();
    }
};

export const getSummaryTagsDB = async (page = 1, limit = 20, search = '', sortBy = 'tag_name', sortOrder = 'DESC') => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const offset = (page - 1) * limit;

        const tagsQuery = `
            SELECT 
                t.tag_id, 
                t.tag_name, 
                t.description,
                COUNT(*) OVER() AS total_count
            FROM forum_tags t
            WHERE t.tag_name LIKE ?
            ORDER BY ${sortBy} ${sortOrder}
            LIMIT ? OFFSET ?
        `;
        const [tags] = await conn.execute(tagsQuery, [`%${search}%`, limit.toString(), offset.toString()]);

        const totalTags = tags.length > 0 ? tags[0].total_count : 0;

        const cleanTags = tags.map(({ total_count, ...rest }) => rest);

        await conn.commit();

        return { tags: cleanTags, totalTags };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in getSummaryTagsDB:", error);

        const enhancedError = new Error(`Failed to fetch summary tags: ${error.message}`);
        enhancedError.statusCode = 500;
        enhancedError.originalError = error;
        throw enhancedError;
    } finally {
        if (conn) conn.release();
    }
};
export const getSummaryLittleTagsDB = async () => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();


        const tagsQuery = `
            SELECT 
                t.tag_id, 
                t.tag_name
            FROM forum_tags t
        `;
        const [tags] = await conn.execute(tagsQuery);

        const totalTags = tags.length > 0 ? tags[0].total_count : 0;

        const cleanTags = tags.map(({ total_count, ...rest }) => rest);

        await conn.commit();

        return { tags: cleanTags, totalTags };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in getSummaryTagsDB:", error);

        const enhancedError = new Error(`Failed to fetch summary tags: ${error.message}`);
        enhancedError.statusCode = 500;
        enhancedError.originalError = error;
        throw enhancedError;
    } finally {
        if (conn) conn.release();
    }
};

export const getSummaryTagByIdDB = async (id) => {
    let conn;
    try {
        if (!Number.isInteger(id) || id <= 0) {
            const error = new Error("Invalid tag ID");
            error.name = "ValidationError";
            error.details = {
                expected: "Positive integer",
                received: id
            };
            throw error;
        }

        conn = await connection.getConnection();
        
        const sql = `
            SELECT 
                t.tag_id, 
                t.tag_name, 
                t.description,
                t.created_at,
                t.last_updated
            FROM forum_tags t
            WHERE t.tag_id = ?
            LIMIT 1
        `;
        
        const [tags] = await conn.execute(sql, [id]);
        
        return tags[0] || null;

    } catch (error) {
        console.error(`Database error fetching tag ID ${id}:`, error);
        
        const dbError = new Error(error.message || "Database operation failed");
        dbError.name = "DatabaseError";
        dbError.statusCode = 500;
        dbError.details = {
            operation: "getSummaryTagByIdDB",
            parameters: { id },
            ...(error.details && { originalDetails: error.details })
        };
        
        throw dbError;
    } finally {
        if (conn) {
            try {
                await conn.release();
            } catch (releaseError) {
                console.error("Error releasing database connection:", releaseError);
            }
        }
    }
};

export const getTagByIdDB = async (tagId) => {
    let conn;
    try {
        if (!tagId || isNaN(tagId)) {
            const error = new Error("Valid numeric tag ID is required");
            error.errorCode = "INVALID_TAG_ID";
            error.statusCode = 400;
            throw error;
        }

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
                u.username AS created_by
            FROM forum_tags t
            LEFT JOIN users u ON t.user_id = u.user_id
            WHERE t.tag_id = ?
            GROUP BY t.tag_id
        `;
        
        const [results] = await conn.execute(sql, [tagId]);
        return results[0] || null;
    } catch (error) {
        console.error(`Database error in getTagByIdDB for ID ${tagId}:`, error);
        
        const dbError = new Error(error.message || "Failed to fetch tag from database");
        dbError.errorCode = "DB_ERROR";
        dbError.statusCode = 500;
        dbError.originalError = error;
        throw dbError;
    } finally {
        if (conn) conn.release();
    }
};

export const getTagByNameDB = async (tagName) => {
    let conn;
    try {
        if (!tagName || typeof tagName !== 'string' || tagName.trim().length === 0) {
            const error = new Error("Valid tag name is required");
            error.errorCode = "INVALID_TAG_NAME";
            error.statusCode = 400;
            throw error;
        }

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
                    SELECT COUNT(*)
                    FROM forum_tags_mapping tm2
                    WHERE tm2.tag_id = t.tag_id
                ) AS total_posts,
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'post_id', p.post_id,
                            'title', p.title
                        )
                    )
                    FROM forum_posts p
                    JOIN forum_tags_mapping tm ON p.post_id = tm.post_id
                    WHERE tm.tag_id = t.tag_id
                    ORDER BY p.created_at DESC
                    LIMIT 3
                ) AS sample_posts
            FROM forum_tags t
            LEFT JOIN forum_tags_mapping tm ON t.tag_id = tm.tag_id
            LEFT JOIN users u ON t.user_id = u.user_id
            WHERE LOWER(t.tag_name) = LOWER(?)
            GROUP BY t.tag_id
        `;
        
        const [results] = await conn.execute(sql, [tagName.trim()]);
        return results[0] || null;
    } catch (error) {
        console.error(`Database error in getTagByNameDB for name "${tagName}":`, error);
        
        const dbError = new Error(error.message || "Failed to fetch tag from database");
        dbError.errorCode = "DB_ERROR";
        dbError.statusCode = 500;
        dbError.originalError = error;
        throw dbError;
    } finally {
        if (conn) conn.release();
    }
};

export const getPostsByTagDB = async (tagId, page = 1, limit = 10) => {
    let conn;
    try {
        if (!tagId) {
            const error = new Error("Tag ID is required");
            error.statusCode = 400;
            throw error;
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        const offset = (page - 1) * limit;

        const sqlTag = `
            SELECT 
                t.tag_id, t.tag_name, t.description,
                t.usage_count, t.last_used_at,
                t.created_at, t.last_updated,
                u.username AS created_by
            FROM forum_tags t
            LEFT JOIN forum_tags_mapping tm ON t.tag_id = tm.tag_id
            LEFT JOIN users u ON t.user_id = u.user_id
            WHERE t.tag_id = ?
            GROUP BY t.tag_id
        `;

        const [tagRows] = await conn.execute(sqlTag, [tagId]);
        const tag = tagRows[0];

        if (!tag) {
            const error = new Error("Tag not found");
            error.statusCode = 404;
            throw error;
        }

        const sqlPost = `
            SELECT 
                p.post_id, p.content, p.created_at, p.last_updated,
                u.username AS author,
                th.thread_name, th.thread_id,
                cat.category_name, cat.category_id,
                COUNT(DISTINCT l.like_id) AS like_count,
                COUNT(DISTINCT r.report_id) AS report_count
            FROM forum_posts p
            JOIN forum_tags_mapping tm ON p.post_id = tm.post_id
            JOIN forum_tags t ON tm.tag_id = t.tag_id
            JOIN users u ON p.user_id = u.user_id
            JOIN forum_threads th ON p.thread_id = th.thread_id
            JOIN forum_categories cat ON th.category_id = cat.category_id
            LEFT JOIN forum_likes l ON p.post_id = l.post_id
            LEFT JOIN forum_reports r ON p.post_id = r.post_id
            LEFT JOIN forum_comments com ON p.post_id = com.post_id
            WHERE t.tag_id = ?
            GROUP BY p.post_id
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [posts] = await conn.execute(sqlPost, [tagId.toString(), limit.toString(), offset.toString()]);

        // 3. Get total count of posts for pagination
        const sqlCount = `
            SELECT COUNT(DISTINCT p.post_id) AS total
            FROM forum_posts p
            JOIN forum_tags_mapping tm ON p.post_id = tm.post_id
            JOIN forum_tags t ON tm.tag_id = t.tag_id
            WHERE t.tag_id = ?
        `;
        const [countRows] = await conn.execute(sqlCount, [tagId]);
        const totalPosts = countRows[0].total;

        await conn.commit();

        return { posts, tag, totalPosts };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in getPostsByTagDB:", error);

        error.message = `Failed to fetch posts for tag ${tagId}: ${error.message}`;
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const getPopularTagsDB = async (limit = 10) => {
    let conn;
    try {
        if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
            throw new Error("Limit must be an integer between 1 and 100");
        }

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
                u.user_id AS created_by_id,
                COUNT(DISTINCT tm.post_id) AS post_count,
                (
                    SELECT COUNT(*) 
                    FROM forum_tags_mapping 
                    WHERE tag_id = t.tag_id
                ) AS total_usage
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
        return tags;
    } catch (error) {
        console.error("Database error in getPopularTagsDB:", error);
        
        const dbError = new Error(error.message || "Failed to retrieve popular tags");
        dbError.statusCode = 500;
        dbError.errorCode = "DB_POPULAR_TAGS_ERROR";
        dbError.originalError = error;
        throw dbError;
    } finally {
        if (conn) conn.release();
    }
};

export const getTagsForPostDB = async (postId) => {
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
                u.user_id AS created_by_id,
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
        return tags;
    } catch (error) {
        console.error(`Database error in getTagsForPostDB for post ${postId}:`, error);
        
        const dbError = new Error(error.message || "Failed to retrieve tags for post");
        dbError.statusCode = 500;
        dbError.errorCode = "DB_POST_TAGS_ERROR";
        dbError.originalError = error;
        throw dbError;
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
        conn = await connection.getConnection();
        await conn.beginTransaction();

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
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const [tag] = await conn.execute(
            "SELECT user_id FROM forum_tags WHERE tag_id = ?",
            [tagId]
        );
        if (!tag[0] || tag[0].user_id !== userId) {
            throw new Error("Unauthorized: You can only update your own tags");
        }

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
        return `Tag updated successfully`;
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