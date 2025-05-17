import connection from '../../config/connection.js';

const getAllPostsDB = async (page, limit, orderByField, orderDirection) => {
    let conn;
    const offset = (page - 1) * limit;
    try {
        conn = await connection.getConnection();

        const validCategoryColumns = [
            'created_at', 'last_updated',
            'view_count', 'like_count',
            'comment_count', 'title'
        ];

        if (!validCategoryColumns.includes(orderByField)) {
            orderByField = 'fc.created_at';
        }

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
                p.like_count AS like_count,
                p.comment_count AS comment_count,
                p.view_count as view_count,
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

const getSummaryPostsDB = async (limit = null) => {
    let conn;
    try {
        conn = await connection.getConnection();

        const sql = `
            SELECT 
                p.post_id,
                p.title,
                p.content,
                p.view_count,
                p.comment_count,
                p.like_count,
                p.created_at,
                p.last_updated,
                u.username as created_by,
                ft.thread_id,
                ft.thread_name,
                fc.category_id,
                fc.category_name,
                (
                    SELECT GROUP_CONCAT(DISTINCT ft2.tag_name)
                    FROM forum_tags_mapping ftm2
                    JOIN forum_tags ft2 ON ftm2.tag_id = ft2.tag_id
                    WHERE ftm2.post_id = p.post_id
                ) AS tags
            FROM forum_posts p
            JOIN users u ON p.user_id = u.user_id
            JOIN forum_threads ft ON p.thread_id = ft.thread_id
            JOIN forum_categories fc ON ft.category_id = fc.category_id
            GROUP BY p.post_id
            ORDER BY p.created_at DESC
            ${limit ? 'LIMIT ?' : 'LIMIT 6'}
        `;

        const [posts] = await conn.execute(sql, limit ? [limit.toString()] : []);

        if (!posts.length) {
            throw new Error("No posts found");
        }

        return posts.map(post => ({
            ...post,
            view_count: Number(post.view_count),
            comment_count: Number(post.comment_count),
            like_count: Number(post.like_count),
            tags: post.tags ? post.tags.split(',') : []
        }));
    } catch (error) {
        console.error("Database error in getSummaryPostsDB:", error);
        throw new Error(error.message || "Failed to retrieve post summaries");
    } finally {
        if (conn) conn.release();
    }
};

const getPopularPostsDB = async (limit = 6) => {
    let conn;

    if (!limit) {
        limit = 6;
    }
    
    try {
        conn = await connection.getConnection();

        const sql = `
            SELECT 
                p.post_id,
                p.title,
                p.content,
                p.view_count,
                p.comment_count,
                p.like_count,
                p.created_at,
                p.last_updated,
                u.username as created_by,
                ft.thread_id,
                ft.thread_name,
                fc.category_id,
                fc.category_name,
                (
                    SELECT GROUP_CONCAT(DISTINCT ft2.tag_name)
                    FROM forum_tags_mapping ftm2
                    JOIN forum_tags ft2 ON ftm2.tag_id = ft2.tag_id
                    WHERE ftm2.post_id = p.post_id
                ) AS tags
            FROM forum_posts p
            JOIN users u ON p.user_id = u.user_id
            JOIN forum_threads ft ON p.thread_id = ft.thread_id
            JOIN forum_categories fc ON ft.category_id = fc.category_id
            GROUP BY p.post_id
            ORDER BY p.view_count DESC, p.like_count DESC, p.comment_count DESC, p.created_at DESC
            LIMIT ?
        `;

        const [posts] = await conn.execute(sql, [limit.toString()]);

        if (!posts.length) {
            throw new Error("No posts found");
        }

        return posts.map(post => ({
            ...post,
            view_count: Number(post.view_count),
            comment_count: Number(post.comment_count),
            like_count: Number(post.like_count),
            tags: post.tags ? post.tags.split(',') : []
        }));
    } catch (error) {
        console.error("Database error in getPopularPostsDB:", error);
        throw new Error(error.message || "Failed to retrieve popular posts");
    } finally {
        if (conn) conn.release();
    }
};

const getPostByIdDB = async (postId, options = {}, author_id) => {
    const {
        includeComments = false,
        includeCommentReplies = false,
        includeStats = true,
        includeTags = true,
        includeAuthor = true,
        includeThread = true,
        includeCategory = true,
    } = options;

    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Main post query
        const postSql = `
            SELECT 
                p.post_id,
                p.title,
                p.content,
                p.created_at, p.last_updated,
                ${includeStats ? `
                p.view_count,
                p.like_count,
                p.comment_count,` : ''}
                ${includeAuthor ? `
                u.username AS created_by,
                ` : ''}
                p.thread_id,
                ${includeThread ? `
                t.thread_name,
                t.description AS thread_description,
                ` : ''}
                ${includeCategory ? `
                c.category_id,
                c.category_name,
                c.description as category_description,
                ` : ''}
                ${author_id ? `
                EXISTS(
                    SELECT 1 FROM forum_likes 
                    WHERE post_id = p.post_id AND user_id = ?
                ) AS is_liked,
                ` : 'false AS is_liked,'}
                ${author_id ? `p.user_id = ? AS is_owner` : 'false AS is_owner'}
            FROM forum_posts p
            ${includeAuthor ? 'JOIN users u ON p.user_id = u.user_id' : ''}
            ${includeThread ? 'JOIN forum_threads t ON p.thread_id = t.thread_id' : ''}
            ${includeCategory ? 'JOIN forum_categories c ON t.category_id = c.category_id' : ''}
            WHERE p.post_id = ?
            GROUP BY p.post_id
        `;

        const postParams = author_id ? [author_id, author_id, postId] : [postId];
        const [postRows] = await conn.execute(postSql, postParams);

        if (postRows.length === 0) {
            throw new Error('Post not found');
        }

        const post = postRows[0];

        if (includeTags) {
            const [tags] = await conn.execute(`
                SELECT ft.tag_id, ft.tag_name
                FROM forum_tags_mapping ftm
                JOIN forum_tags ft ON ftm.tag_id = ft.tag_id
                WHERE ftm.post_id = ?
            `, [postId]);
            post.tags = tags;
        }

        if (includeComments) {
            const commentsSql = `
                SELECT 
                    c.*,
                    u.user_id AS author_id,
                    u.username AS author_name,
                    COUNT(DISTINCT cl.like_id) AS like_count,
                    ${author_id ? `
                    EXISTS(
                        SELECT 1 FROM forum_comment_likes 
                        WHERE comment_id = c.comment_id AND user_id = ?
                    ) AS is_liked,
                    ` : 'false AS is_liked,'}
                    ${author_id ? `c.user_id = ? AS is_owner` : 'false AS is_owner'}
                FROM forum_comments c
                JOIN users u ON c.user_id = u.user_id
                LEFT JOIN forum_comment_likes cl ON c.comment_id = cl.comment_id
                WHERE c.post_id = ?
                GROUP BY c.comment_id
                ORDER BY c.thread_path, c.created_at
            `;

            const commentsParams = author_id ? [author_id, author_id, postId] : [postId];
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

        conn.execute(
            `
            UPDATE forum_posts
            SET 
                view_count = view_count + 1
            WHERE post_id = ?
            `, [postId]
        );

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

        const [thread] = await conn.execute(`
            SELECT thread_id, category_id 
            FROM forum_threads 
            WHERE thread_id = ?
        `, [threadId]);

        if (thread.length === 0) {
            throw new Error('Thread not found');
        }

        const categoryId = thread[0].category_id;
        const [postResult] = await conn.execute(`
            INSERT INTO forum_posts (
                thread_id, 
                user_id, 
                title, 
                content
            ) VALUES (?, ?, ?, ?)
        `, [threadId, userId, title, content]);

        const postId = postResult.insertId;

        if (tags && tags.length > 0) {
            const [existingTags] = await conn.query(`
                SELECT tag_id, tag_name 
                FROM forum_tags 
                WHERE tag_name IN (?)
            `, [tags]);

            const tagMap = new Map(existingTags.map(tag => [tag.tag_name, tag.tag_id]));
            const tagsToInsert = tags.filter(tag => !tagMap.has(tag));

            for (const tag of tagsToInsert) {
                try {
                    const [insertResult] = await conn.execute(`
                        INSERT INTO forum_tags (tag_name, user_id) 
                        VALUES (?, ?)
                    `, [tag, userId]);

                    tagMap.set(tag, insertResult.insertId);
                } catch (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        const [[existingTag]] = await conn.execute(`
                            SELECT tag_id FROM forum_tags WHERE tag_name = ?
                        `, [tag]);
                        tagMap.set(tag, existingTag.tag_id);
                    } else {
                        throw err;
                    }
                }
            }

            const tagMappingValues = tags.map(tag => [postId, tagMap.get(tag)]);
            const placeholders = tagMappingValues.map(() => '(?, ?)').join(', ');
            const flatValues = tagMappingValues.flat();

            await conn.query(`
                INSERT INTO forum_tags_mapping (post_id, tag_id) 
                VALUES ${placeholders}
            `, flatValues);
        }

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

const updatePostDB = async (postId, userId, title, content, tags = []) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const updates = [];
        const params = [];

        if (title !== undefined) {
            updates.push('title = ?');
            params.push(title);
        }

        if (content !== undefined) {
            updates.push('content = ?');
            params.push(content);
        }

        if (updates.length === 0) {
            throw new Error('No valid fields to update');
        }

        params.push(postId);

        await conn.execute(`
            UPDATE forum_posts 
            SET ${updates.join(', ')}, 
                last_updated = NOW() 
            WHERE post_id = ?
        `, params);

        if (tags) {
            await conn.execute(`
                DELETE FROM forum_tags_mapping 
                WHERE post_id = ?
            `, [postId]);

            if (tags.length > 0) {
                const [existingTags] = await conn.query(`
                    SELECT tag_id, tag_name 
                    FROM forum_tags 
                    WHERE tag_name IN (?)
                `, [tags]);

                const tagMap = new Map(existingTags.map(tag => [tag.tag_name, tag.tag_id]));
                const tagsToInsert = tags.filter(tag => !tagMap.has(tag));


                if (tagsToInsert.length > 0) {
                    const tagInsertValues = tagsToInsert.map(tag => [tag, userId]).flat();
                    const placeholders = tagsToInsert.map(() => '(?, ?)').join(', ');
                    const [insertResult] = await conn.execute(`
                        INSERT INTO forum_tags (tag_name, user_id) 
                        VALUES ${placeholders}
                    `, tagInsertValues);

                    for (let i = 0; i < tagsToInsert.length; i++) {
                        tagMap.set(
                            tagsToInsert[i],
                            insertResult.insertId + i
                        );
                    }
                }

                const tagMappingValues = tags.map(tag => [postId, tagMap.get(tag)]);
                const placeholders = tagMappingValues.map(() => '(?, ?)').join(', ');
                const flatValues = tagMappingValues.flat();
    
                await conn.query(`
                    INSERT INTO forum_tags_mapping (post_id, tag_id) 
                    VALUES ${placeholders}
                `, flatValues);
            }
        }

        await conn.commit();

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

const deletePostDB = async (postId, userId, reason = null) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        await conn.execute(`
            INSERT INTO forum_post_deletions (
                post_id, 
                deleted_by, 
                reason
            ) VALUES (?, ?, ?)
        `, [postId, userId, reason || null]);

        await conn.execute(`
            DELETE FROM forum_posts 
            WHERE post_id = ?
        `, [postId]);


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

export default {
    getAllPostsDB,
    getSummaryPostsDB,
    getPopularPostsDB,
    getPostByIdDB,
    createPostDB,
    updatePostDB,
    deletePostDB,
    getPostsByUserDB
};