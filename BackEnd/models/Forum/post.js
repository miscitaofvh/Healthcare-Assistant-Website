import connection from '../../config/connection.js';

export const getAllPostsDB = async (
    page = 1,
    limit = 20,
    search = '',
    sortBy = 'created_at',
    sortOrder = 'DESC',
    categoryId = null,
    tagId = null
) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const offset = (page - 1) * limit;

        const conditions = [];
        const params = [];

        if (search) {
            conditions.push(`(p.title LIKE ? OR p.content LIKE ?)`);
            params.push(`%${search}%`, `%${search}%`).toString();
        }

        if (categoryId) {
            conditions.push(`c.category_id = ?`);
            params.push(categoryId).toString();
        }

        if (tagId) {
            conditions.push(`ft.tag_id = ?`);
            params.push(tagId).toString();
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : '';

        const sql = `
            SELECT 
                SQL_CALC_FOUND_ROWS
                u.username AS author, 
                c.category_id, 
                c.category_name,
                t.thread_id, 
                t.thread_name,
                p.post_id, 
                p.content,  
                p.title, 
                p.created_at, 
                p.last_updated,
                IFNULL(l.like_count, 0) AS like_count,
                JSON_ARRAYAGG(
                    CASE 
                        WHEN ft.tag_id IS NOT NULL THEN JSON_OBJECT('tag_id', ft.tag_id, 'tag_name', ft.tag_name)
                        ELSE NULL
                    END
                ) AS tags
            FROM forum_posts p
            JOIN users u ON p.user_id = u.user_id
            JOIN forum_threads t ON p.thread_id = t.thread_id
            JOIN forum_categories c ON t.category_id = c.category_id
            LEFT JOIN (
                SELECT post_id, COUNT(*) AS like_count
                FROM forum_likes
                GROUP BY post_id
            ) l ON p.post_id = l.post_id
            LEFT JOIN forum_tags_mapping ftm ON p.post_id = ftm.post_id
            LEFT JOIN forum_tags ft ON ftm.tag_id = ft.tag_id
            ${whereClause}
            GROUP BY 
                p.post_id, p.content, p.title, p.created_at, p.last_updated,
                u.username,
                c.category_id, c.category_name,
                t.thread_id, t.thread_name,
                l.like_count
            ORDER BY p.${sortBy} ${sortOrder}
            LIMIT ? OFFSET ?
        `;

        params.push(limit.toString(), offset.toString());

        const [posts] = await conn.execute(sql, params);
        const [[{ 'FOUND_ROWS()': totalPosts }]] = await conn.query('SELECT FOUND_ROWS()');

        await conn.commit();

        const cleanPosts = posts.map(post => ({
            ...post,
            like_count: Number(post.like_count),
            tags: (!post.tags || (post.tags.length === 1 && post.tags[0] === null)) ? [] : post.tags
        }));

        return {
            posts: cleanPosts,
            totalPosts
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Database error in getAllPostsDB:", error);
        throw new Error("Failed to retrieve posts from database");
    } finally {
        if (conn) conn.release();
    }
};

export const getSummaryPostsDB = async () => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT 
                u.username AS author,
                p.post_id, p.title,
                LEFT(p.content, 100) AS content,  -- Truncate content to 100 characters
                p.created_at, p.last_updated,
                COUNT(DISTINCT l.like_id) AS like_count,
                GROUP_CONCAT(DISTINCT ft.tag_name) AS tags  -- Add tags as a concatenated string
            FROM forum_posts p
            JOIN users u ON p.user_id = u.user_id
            LEFT JOIN forum_likes l ON p.post_id = l.post_id
            LEFT JOIN forum_tags_mapping ftm ON p.post_id = ftm.post_id
            LEFT JOIN forum_tags ft ON ftm.tag_id = ft.tag_id
            GROUP BY p.post_id
            ORDER BY p.created_at DESC;
        `;

        const [posts] = await conn.execute(sql);
        await conn.commit();

        // Process the posts to return tags as an array
        const postsWithTags = posts.map(post => {
            return {
                ...post,
                tags: post.tags ? post.tags.split(',') : []  // Split the tags string into an array
            };
        });

        return postsWithTags;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting summary of posts:", error);
        throw new Error("Failed to get summary of posts");
    } finally {
        if (conn) conn.release();
    }
};

export const getPostByIdDB = async (postId, options = {}, author_id = null) => {
    const {
        includeComments = false,
        includeAuthor = true,
        includeStats = false,
        includeCommentReplies = false
    } = options;
    
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Main post query
        const postSql = `
        SELECT 
            p.post_id, p.title, p.content, 
            p.created_at, p.last_updated, p.user_id AS author_id,
            t.thread_id, t.thread_name, 
            c.category_id, c.category_name,
            ${includeAuthor ? 'u.username AS author,' : ''}
            ${includeStats ? 'COUNT(DISTINCT l.like_id) AS like_count,' : '0 AS like_count,'}
            ${author_id ? `EXISTS(
                SELECT 1 FROM forum_likes 
                WHERE post_id = p.post_id AND user_id = ?
            ) AS is_liked,` : 'false AS is_liked,'}
            ${author_id ? `p.user_id = ? AS is_owner` : 'false AS is_owner'},
            GROUP_CONCAT(DISTINCT CONCAT(ft.tag_id, ':', ft.tag_name)) AS tags
        FROM forum_posts p
        JOIN forum_threads t ON p.thread_id = t.thread_id
        JOIN forum_categories c ON t.category_id = c.category_id
        ${includeAuthor ? 'JOIN users u ON p.user_id = u.user_id' : ''}
        ${includeStats ? 'LEFT JOIN forum_likes l ON p.post_id = l.post_id' : ''}
        LEFT JOIN forum_tags_mapping ftm ON p.post_id = ftm.post_id
        LEFT JOIN forum_tags ft ON ftm.tag_id = ft.tag_id
        WHERE p.post_id = ?
        GROUP BY p.post_id;
        `;

        const postParams = author_id ? [author_id, author_id, postId] : [postId];
        const [postRows] = await conn.execute(postSql, postParams);

        if (!postRows[0]) {
            throw new Error("Post not found");
        }

        const post = postRows[0];
        post.tags = post.tags
            ? post.tags.split(',').map(tag => {
                const [tag_id, tag_name] = tag.split(':');
                return { tag_id: parseInt(tag_id), tag_name };
            })
            : [];

        // Comments handling
        let comments = [];
        if (includeComments) {
            const commentSql = `
                SELECT 
                    c.post_id,
                    c.comment_id, c.content, 
                    c.created_at, c.last_updated,
                    c.parent_comment_id, c.depth, c.thread_path,
                    u.username, u.user_id AS author_id,
                    COUNT(DISTINCT cl.like_id) AS like_count,
                    ${author_id ? `EXISTS(
                        SELECT 1 FROM forum_comment_likes 
                        WHERE comment_id = c.comment_id AND user_id = ?
                    ) AS is_liked,` : 'false AS is_liked,'}
                    ${author_id ? `c.user_id = ? AS is_owner` : 'false AS is_owner'}
                FROM forum_comments c
                JOIN users u ON c.user_id = u.user_id
                LEFT JOIN forum_comment_likes cl ON c.comment_id = cl.comment_id
                WHERE c.post_id = ?
                GROUP BY c.comment_id
                ORDER BY c.thread_path, c.created_at;
            `;

            const commentParams = author_id ? [author_id, author_id, postId] : [postId];
            const [commentRows] = await conn.execute(commentSql, commentParams);

            // Convert flat comments to hierarchical structure
            const buildCommentTree = (parentId = null) => {
                return commentRows
                    .filter(comment => comment.parent_comment_id === parentId)
                    .map(comment => ({
                        ...comment,
                        replies: includeCommentReplies ? buildCommentTree(comment.comment_id) : []
                    }));
            };

            comments = includeCommentReplies 
                ? buildCommentTree()
                : commentRows;
        }

        await conn.commit();
        return {
            ...post,
            comments
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error in getPostByIdDB:", error.message);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const getPostsByUserDB = async (username) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT 
                u.username AS author,
                p.post_id, p.content, p.created_at, p.last_updated,
                c.category_id, c.category_name, 
                t.thread_id, t.thread_name, 
                COUNT(DISTINCT l.like_id) AS like_count,
                GROUP_CONCAT(DISTINCT ft.tag_name) AS tags
            FROM forum_posts p
            JOIN users u ON p.user_id = u.user_id
            JOIN forum_threads t ON p.thread_id = t.thread_id
            JOIN forum_categories c ON t.category_id = c.category_id
            LEFT JOIN forum_likes l ON p.post_id = l.post_id
            LEFT JOIN forum_tags_mapping ftm ON p.post_id = ftm.post_id
            LEFT JOIN forum_tags ft ON ftm.tag_id = ft.tag_id
            WHERE u.username = ?
            GROUP BY p.post_id
            ORDER BY p.created_at DESC
        `;

        const [posts] = await conn.execute(sql, [username]);
        await conn.commit();

        const postsWithTags = posts.map(post => {
            return {
                ...post,
                tags: post.tags ? post.tags.split(',') : []  // Split the tags string into an array
            };
        });

        return postsWithTags;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting user's posts:", error);
        throw new Error("Failed to get posts by user");
    } finally {
        if (conn) conn.release();
    }
};

export const createPostDB = async (user_id, thread_id, title, content, tag_names = []) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const [threadCheck] = await conn.execute(
            `SELECT thread_id, category_id FROM forum_threads WHERE thread_id = ?`,
            [thread_id]
        );
        if (threadCheck.length === 0) {
            throw new Error("Thread not found");
        }
        const category_id = threadCheck[0].category_id;

        const insertPostQuery = `
            INSERT INTO forum_posts (thread_id, user_id, title, content, created_at)
            VALUES (?, ?, ?, ?, NOW())
        `;
        const [postResult] = await conn.execute(insertPostQuery, [
            thread_id,
            user_id,
            title,
            content
        ]);

        const post_id = postResult.insertId;
        if (!post_id) {
            throw new Error("Failed to create post");
        }

        if (Array.isArray(tag_names) && tag_names.length > 0) {
            for (const tag of tag_names.map(t => t.trim()).filter(Boolean)) {
                let tag_id;
                const [tagResult] = await conn.execute(
                    "SELECT tag_id FROM forum_tags WHERE tag_name = ?",
                    [tag]
                );

                if (tagResult.length > 0) {
                    tag_id = tagResult[0].tag_id;
                    await conn.execute(
                        "UPDATE forum_tags SET usage_count = usage_count + 1, last_used_at = NOW() WHERE tag_id = ?",
                        [tag_id]
                    );
                } else {
                    const [insertTagResult] = await conn.execute(
                        "INSERT INTO forum_tags (tag_name, user_id) VALUES (?, ?)",
                        [tag, user_id]
                    );
                    tag_id = insertTagResult.insertId;
                }

                await conn.execute(
                    "INSERT INTO forum_tags_mapping (post_id, tag_id) VALUES (?, ?)",
                    [post_id, tag_id]
                );
            }
        }

        await conn.execute(
            "INSERT INTO forum (user_id, category_id, thread_id, post_id, created_at) VALUES (?, ?, ?, ?, NOW())",
            [user_id, category_id, thread_id, post_id]
        );

        await conn.commit();

        return {
            post_id,
            thread_id,
            created_at: new Date().toISOString()
        };

    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error in createPostDB:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const updatePostDB = async (postId, user_id, title, content, tags = []) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const [post] = await conn.execute(
            "SELECT user_id FROM forum_posts WHERE post_id = ?",
            [postId]
        );

        if (!post[0]) {
            throw new Error("Post not found");
        }

        if (post[0].user_id !== user_id) {
            throw new Error("Unauthorized to update this post");
        }

        const normalizedTags = tags.map(tag =>
            typeof tag === 'string' ? tag :
                (tag?.tag_name ? tag.tag_name : null)
        ).filter(tag => tag !== null);
        if (normalizedTags.some(tag => typeof tag !== 'string')) {
            throw new Error("Invalid tags format");
        }

        const updateSql = `
            UPDATE forum_posts
            SET title = ?, content = ?, last_updated = CURRENT_TIMESTAMP
            WHERE post_id = ?
        `;
        await conn.execute(updateSql, [title, content, postId]);

        await conn.execute(
            "DELETE FROM forum_tags_mapping WHERE post_id = ?",
            [postId]
        );

        if (normalizedTags.length > 0) {
            const tagPlaceholders = normalizedTags.map(() => '?').join(',');
            const [existingTags] = await conn.execute(
                `SELECT tag_id, tag_name FROM forum_tags WHERE tag_name IN (${tagPlaceholders})`,
                normalizedTags
            );

            const tagMap = {};
            existingTags.forEach(tag => {
                tagMap[tag.tag_name] = tag.tag_id;
            });

            for (const tagName of normalizedTags) {
                let tagId = tagMap[tagName];

                if (!tagId) {
                    const [insertResult] = await conn.execute(
                        "INSERT INTO forum_tags (tag_name, user_id) VALUES (?, ?)",
                        [tagName, user_id]
                    );
                    tagId = insertResult.insertId;
                }

                await conn.execute(
                    "INSERT INTO forum_tags_mapping (post_id, tag_id) VALUES (?, ?)",
                    [postId, tagId]
                );

                await conn.execute(
                    "UPDATE forum_tags SET usage_count = usage_count + 1, last_used_at = CURRENT_TIMESTAMP WHERE tag_id = ?",
                    [tagId]
                );
            }
        }

        await conn.commit();

        const [updatedPost] = await conn.execute(
            "SELECT last_updated FROM forum_posts WHERE post_id = ?",
            [postId]
        );

        return {
            updated_at: updatedPost[0].last_updated,
            edit_count: 1
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error updating post:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const deletePostDB = async (postId, user_id) => {
    let conn;
    try {
        if (!postId || !user_id) {
            throw new Error("Missing required fields");
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

        if (post[0].user_id !== user_id) {
            throw new Error("Unauthorized to delete this post");
        }

        // Delete post and related data
        await conn.execute("DELETE FROM forum_tags_mapping WHERE post_id = ?", [postId]);
        await conn.execute("DELETE FROM forum_likes WHERE post_id = ?", [postId]);
        await conn.execute("DELETE FROM forum_posts WHERE post_id = ?", [postId]);

        await conn.commit();
        return "Post deleted successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error deleting post:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};