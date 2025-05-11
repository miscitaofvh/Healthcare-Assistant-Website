import connection from '../../config/connection.js';

const getAllPostsDB = async (page, limit, orderByField, orderDirection) => {
    let conn;
    const offset = (page - 1) * limit;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT 
                p.post_id, 
                p.title, 
                p.content,
                p.created_at,
                p.last_updated,
                p.thread_id,
                t.thread_name,
                t.category_id,
                c.category_name,
                u.username AS created_by,
                COUNT(DISTINCT l.like_id) AS like_count,
                COUNT(DISTINCT cm.comment_id) AS comment_count,
                (
                    SELECT GROUP_CONCAT(DISTINCT ft2.tag_name)
                    FROM forum_tags_mapping ftm2
                    JOIN forum_tags ft2 ON ftm2.tag_id = ft2.tag_id
                    WHERE ftm2.post_id = p.post_id
                ) AS tags
            FROM forum_posts p
            JOIN forum_threads t ON p.thread_id = t.thread_id
            JOIN forum_categories c ON t.category_id = c.category_id
            JOIN users u ON p.user_id = u.user_id
            LEFT JOIN forum_likes l ON p.post_id = l.post_id
            LEFT JOIN forum_comments cm ON p.post_id = cm.post_id
            GROUP BY p.post_id
            ORDER BY ${conn.escapeId(orderByField)} ${orderDirection === 'ASC' ? 'ASC' : 'DESC'}
            LIMIT ? OFFSET ?
        `;

        const [posts] = await conn.execute(sql, [limit.toString(), offset.toString()]);

        await conn.commit();

        return {
            posts: posts.map(post => ({
                ...post,
                like_count: Number(post.like_count),
                comment_count: Number(post.comment_count),
                tags: post.tags ? post.tags.split(',') : []
            })),
            pagination: {
                totalItems: posts.length,
                currentPage: page,
                totalPages: Math.ceil(posts.length / limit),
                itemsPerPage: limit,
                limit: limit,
                sortBy: orderByField,
                sortOrder: orderDirection
            }
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Database error in getAllPostsDB:', error);
        throw new Error('Failed to retrieve posts from database');
    } finally {
        if (conn) conn.release();
    }
};

const getPostByIdDB = async (postId, options = {}) => {
    const {
        includeComments = false,
        includeCommentReplies = true,
        includeStats = true,
        includeTags = true,
        includeAuthor = true,
        includeThread = true,
        includeCategory = true,
        currentUserId = null
    } = options;

    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Main post query
        const postSql = `
            SELECT 
                p.*,
                ${includeAuthor ? `
                u.user_id AS author_id,
                u.username AS author_name,
                u.join_date AS author_join_date,
                ` : ''}
                ${includeThread ? `
                t.thread_id,
                t.thread_name,
                t.description AS thread_description,
                ` : ''}
                ${includeCategory ? `
                c.category_id,
                c.category_name,
                ` : ''}
                ${includeStats ? `
                COUNT(DISTINCT l.like_id) AS like_count,
                COUNT(DISTINCT cm.comment_id) AS comment_count,
                ` : ''}
                ${currentUserId ? `
                EXISTS(
                    SELECT 1 FROM forum_likes 
                    WHERE post_id = p.post_id AND user_id = ?
                ) AS is_liked,
                ` : 'false AS is_liked,'}
                ${currentUserId ? `p.user_id = ? AS is_owner` : 'false AS is_owner'}
            FROM forum_posts p
            ${includeAuthor ? 'JOIN users u ON p.user_id = u.user_id' : ''}
            ${includeThread ? 'JOIN forum_threads t ON p.thread_id = t.thread_id' : ''}
            ${includeCategory ? 'JOIN forum_categories c ON t.category_id = c.category_id' : ''}
            ${includeStats ? 'LEFT JOIN forum_likes l ON p.post_id = l.post_id' : ''}
            ${includeStats ? 'LEFT JOIN forum_comments cm ON p.post_id = cm.post_id' : ''}
            WHERE p.post_id = ?
            GROUP BY p.post_id
        `;

        const postParams = currentUserId ? [currentUserId, currentUserId, postId] : [postId];
        const [postRows] = await conn.execute(postSql, postParams);

        if (postRows.length === 0) {
            throw new Error('Post not found');
        }

        const post = postRows[0];

        // Get tags if requested
        if (includeTags) {
            const [tags] = await conn.execute(`
                SELECT ft.tag_id, ft.tag_name
                FROM forum_tags_mapping ftm
                JOIN forum_tags ft ON ftm.tag_id = ft.tag_id
                WHERE ftm.post_id = ?
            `, [postId]);
            post.tags = tags;
        }

        // Get comments if requested
        if (includeComments) {
            const commentsSql = `
                SELECT 
                    c.*,
                    u.user_id AS author_id,
                    u.username AS author_name,
                    COUNT(DISTINCT cl.like_id) AS like_count,
                    ${currentUserId ? `
                    EXISTS(
                        SELECT 1 FROM forum_comment_likes 
                        WHERE comment_id = c.comment_id AND user_id = ?
                    ) AS is_liked,
                    ` : 'false AS is_liked,'}
                    ${currentUserId ? `c.user_id = ? AS is_owner` : 'false AS is_owner'}
                FROM forum_comments c
                JOIN users u ON c.user_id = u.user_id
                LEFT JOIN forum_comment_likes cl ON c.comment_id = cl.comment_id
                WHERE c.post_id = ?
                GROUP BY c.comment_id
                ORDER BY c.thread_path, c.created_at
            `;

            const commentsParams = currentUserId ? [currentUserId, currentUserId, postId] : [postId];
            const [comments] = await conn.execute(commentsSql, commentsParams);

            if (includeCommentReplies) {
                // Convert flat comments to hierarchical structure
                const buildCommentTree = (parentId = null) => {
                    return comments
                        .filter(comment => comment.parent_comment_id === parentId)
                        .map(comment => ({
                            ...comment,
                            replies: buildCommentTree(comment.comment_id)
                        }));
                };
                post.comments = buildCommentTree();
            } else {
                post.comments = comments;
            }
        }

        await conn.commit();
        return post;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Error in getPostByIdDB:', error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

const createPostDB = async (userId, threadId, title, content, tags = []) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Verify thread exists and get category
        const [thread] = await conn.execute(`
            SELECT thread_id, category_id 
            FROM forum_threads 
            WHERE thread_id = ?
        `, [threadId]);

        if (thread.length === 0) {
            throw new Error('Thread not found');
        }

        const categoryId = thread[0].category_id;

        // Insert the post
        const [postResult] = await conn.execute(`
            INSERT INTO forum_posts (
                thread_id, 
                user_id, 
                title, 
                content
            ) VALUES (?, ?, ?, ?)
        `, [threadId, userId, title, content]);

        const postId = postResult.insertId;

        // Process tags if provided
        if (tags && tags.length > 0) {
            // Get existing tags
            const [existingTags] = await conn.execute(`
                SELECT tag_id, tag_name 
                FROM forum_tags 
                WHERE tag_name IN (?)
            `, [tags]);

            const tagMap = new Map(existingTags.map(tag => [tag.tag_name.toLowerCase(), tag.tag_id]));
            const tagsToInsert = tags.filter(tag => !tagMap.has(tag.toLowerCase()));

            // Insert new tags
            if (tagsToInsert.length > 0) {
                const tagInsertValues = tagsToInsert.map(tag => [tag, userId]).flat();
                const placeholders = tagsToInsert.map(() => '(?, ?)').join(', ');

                const [insertResult] = await conn.execute(`
                    INSERT INTO forum_tags (tag_name, user_id) 
                    VALUES ${placeholders}
                `, tagInsertValues);

                // Add new tags to the map
                for (let i = 0; i < tagsToInsert.length; i++) {
                    tagMap.set(
                        tagsToInsert[i].toLowerCase(),
                        insertResult.insertId + i
                    );
                }
            }

            // Create tag mappings
            const tagMappingValues = tags.map(tag => [postId, tagMap.get(tag.toLowerCase())]);
            await conn.query(`
                INSERT INTO forum_tags_mapping (post_id, tag_id) 
                VALUES ?
            `, [tagMappingValues]);

            // Update tag usage counts
            await conn.execute(`
                UPDATE forum_tags 
                SET usage_count = usage_count + 1, 
                    last_used_at = NOW() 
                WHERE tag_id IN (?)
            `, [Array.from(tagMap.values())]);
        }

        // Record activity
        await conn.execute(`
            INSERT INTO forum_activities (
                user_id, 
                activity_type, 
                target_type, 
                target_id
            ) VALUES (?, 'post', 'post', ?)
        `, [userId, postId]);

        await conn.commit();

        return {
            postId,
            threadId,
            categoryId,
            createdAt: new Date().toISOString()
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Error in createPostDB:', error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

const updatePostDB = async (postId, userId, updateData) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Verify post exists and belongs to user (unless admin)
        const [post] = await conn.execute(`
            SELECT user_id 
            FROM forum_posts 
            WHERE post_id = ?
        `, [postId]);

        if (post.length === 0) {
            throw new Error('Post not found');
        }

        if (post[0].user_id !== userId) {
            throw new Error('Unauthorized to update this post');
        }

        // Build dynamic update query
        const updates = [];
        const params = [];

        if (updateData.title !== undefined) {
            updates.push('title = ?');
            params.push(updateData.title);
        }

        if (updateData.content !== undefined) {
            updates.push('content = ?');
            params.push(updateData.content);
        }

        if (updateData.threadId !== undefined) {
            updates.push('thread_id = ?');
            params.push(updateData.threadId);
        }

        if (updates.length === 0) {
            throw new Error('No valid fields to update');
        }

        // Add postId to params
        params.push(postId);

        // Execute update
        await conn.execute(`
            UPDATE forum_posts 
            SET ${updates.join(', ')}, 
                last_updated = NOW() 
            WHERE post_id = ?
        `, params);

        // Handle tags if provided
        if (updateData.tags !== undefined) {
            // Remove existing tag mappings
            await conn.execute(`
                DELETE FROM forum_tags_mapping 
                WHERE post_id = ?
            `, [postId]);

            if (updateData.tags.length > 0) {
                // Process tags similar to createPostDB
                const [existingTags] = await conn.execute(`
                    SELECT tag_id, tag_name 
                    FROM forum_tags 
                    WHERE tag_name IN (?)
                `, [updateData.tags]);

                const tagMap = new Map(existingTags.map(tag => [tag.tag_name.toLowerCase(), tag.tag_id]));
                const tagsToInsert = updateData.tags.filter(tag => !tagMap.has(tag.toLowerCase()));

                // Insert new tags
                if (tagsToInsert.length > 0) {
                    const tagInsertValues = tagsToInsert.map(tag => [tag, userId]).flat();
                    const placeholders = tagsToInsert.map(() => '(?, ?)').join(', ');

                    const [insertResult] = await conn.execute(`
                        INSERT INTO forum_tags (tag_name, user_id) 
                        VALUES ${placeholders}
                    `, tagInsertValues);

                    // Add new tags to the map
                    for (let i = 0; i < tagsToInsert.length; i++) {
                        tagMap.set(
                            tagsToInsert[i].toLowerCase(),
                            insertResult.insertId + i
                        );
                    }
                }

                // Create tag mappings
                const tagMappingValues = updateData.tags.map(tag => [postId, tagMap.get(tag.toLowerCase())]);
                await conn.query(`
                    INSERT INTO forum_tags_mapping (post_id, tag_id) 
                    VALUES ?
                `, [tagMappingValues]);

                // Update tag usage counts
                await conn.execute(`
                    UPDATE forum_tags 
                    SET usage_count = usage_count + 1, 
                        last_used_at = NOW() 
                    WHERE tag_id IN (?)
                `, [Array.from(tagMap.values())]);
            }
        }

        // Record activity
        await conn.execute(`
            INSERT INTO forum_activities (
                user_id, 
                activity_type, 
                target_type, 
                target_id
            ) VALUES (?, 'post_update', 'post', ?)
        `, [userId, postId]);

        await conn.commit();

        // Return updated post
        return getPostByIdDB(postId, {
            includeComments: false,
            includeStats: true,
            includeTags: true
        });
    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Error in updatePostDB:', error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

const deletePostDB = async (postId, userId, isAdmin = false, reason = null) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Verify post exists
        const [post] = await conn.execute(`
            SELECT user_id 
            FROM forum_posts 
            WHERE post_id = ?
        `, [postId]);

        if (post.length === 0) {
            throw new Error('Post not found');
        }

        // Check authorization (owner or admin)
        if (post[0].user_id !== userId && !isAdmin) {
            throw new Error('Unauthorized to delete this post');
        }

        // Record deletion
        await conn.execute(`
            INSERT INTO forum_post_deletions (
                post_id, 
                deleted_by, 
                reason
            ) VALUES (?, ?, ?)
        `, [postId, userId, reason || null]);

        // Delete post (cascades to comments, likes, tags_mapping)
        await conn.execute(`
            DELETE FROM forum_posts 
            WHERE post_id = ?
        `, [postId]);

        // Record activity
        await conn.execute(`
            INSERT INTO forum_activities (
                user_id, 
                activity_type, 
                target_type, 
                target_id
            ) VALUES (?, 'post_delete', 'post', ?)
        `, [userId, postId]);

        await conn.commit();
        return { success: true, message: 'Post deleted successfully' };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Error in deletePostDB:', error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

const getPostsByUserDB = async (userId, page = 1, limit = 10) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const offset = (page - 1) * limit;

        const sql = `
            SELECT 
                SQL_CALC_FOUND_ROWS
                p.post_id,
                p.title,
                LEFT(p.content, 200) AS content_preview,
                p.created_at,
                p.last_updated,
                COUNT(DISTINCT l.like_id) AS like_count,
                COUNT(DISTINCT cm.comment_id) AS comment_count,
                t.thread_id,
                t.thread_name,
                c.category_id,
                c.category_name
            FROM forum_posts p
            JOIN forum_threads t ON p.thread_id = t.thread_id
            JOIN forum_categories c ON t.category_id = c.category_id
            LEFT JOIN forum_likes l ON p.post_id = l.post_id
            LEFT JOIN forum_comments cm ON p.post_id = cm.post_id
            WHERE p.user_id = ?
            GROUP BY p.post_id
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [posts] = await conn.execute(sql, [userId, limit.toString(), offset.toString()]);
        const [[{ 'FOUND_ROWS()': totalCount }]] = await conn.query('SELECT FOUND_ROWS()');

        await conn.commit();

        return {
            posts: posts.map(post => ({
                ...post,
                like_count: Number(post.like_count),
                comment_count: Number(post.comment_count)
            })),
            pagination: {
                totalItems: Number(totalCount),
                currentPage: page,
                totalPages: Math.ceil(Number(totalCount) / limit),
                itemsPerPage: limit
            }
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Error in getPostsByUserDB:', error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

const likePostDB = async (postId, userId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Check if post exists
        const [post] = await conn.execute(`
            SELECT post_id 
            FROM forum_posts 
            WHERE post_id = ?
        `, [postId]);

        if (post.length === 0) {
            throw new Error('Post not found');
        }

        // Check if already liked
        const [existingLike] = await conn.execute(`
            SELECT like_id 
            FROM forum_likes 
            WHERE post_id = ? AND user_id = ?
        `, [postId, userId]);

        if (existingLike.length > 0) {
            throw new Error('Post already liked by user');
        }

        // Add like
        await conn.execute(`
            INSERT INTO forum_likes (
                post_id, 
                user_id
            ) VALUES (?, ?)
        `, [postId, userId]);

        // Update post like count
        await conn.execute(`
            UPDATE forum_posts 
            SET like_count = like_count + 1 
            WHERE post_id = ?
        `, [postId]);

        // Record activity
        await conn.execute(`
            INSERT INTO forum_activities (
                user_id, 
                activity_type, 
                target_type, 
                target_id
            ) VALUES (?, 'like', 'post', ?)
        `, [userId, postId]);

        await conn.commit();

        return { success: true, message: 'Post liked successfully' };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Error in likePostDB:', error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

const unlikePostDB = async (postId, userId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Remove like
        const [result] = await conn.execute(`
            DELETE FROM forum_likes 
            WHERE post_id = ? AND user_id = ?
        `, [postId, userId]);

        if (result.affectedRows === 0) {
            throw new Error('Like not found or already removed');
        }

        // Update post like count
        await conn.execute(`
            UPDATE forum_posts 
            SET like_count = GREATEST(0, like_count - 1) 
            WHERE post_id = ?
        `, [postId]);

        await conn.commit();

        return { success: true, message: 'Post unliked successfully' };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Error in unlikePostDB:', error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export default {
    getAllPostsDB,
    getPostByIdDB,
    createPostDB,
    updatePostDB,
    deletePostDB,
    getPostsByUserDB,
    likePostDB,
    unlikePostDB
};