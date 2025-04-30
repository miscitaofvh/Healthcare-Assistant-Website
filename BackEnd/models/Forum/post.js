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
                p.image_url, 
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
                p.post_id, p.content, p.title, p.image_url, p.created_at, p.last_updated,
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
                p.image_url,
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

export const getPostByIdDB = async (postId, options = {}) => {
    const {
        includeComments = false,
        includeAuthor = true,
        includeStats = false
    } = options;

    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const postSql = `
        SELECT 
            p.post_id, p.title, p.content, p.image_url, 
            p.created_at, p.last_updated,
            t.thread_id, t.thread_name, 
            c.category_id, c.category_name,
            ${includeAuthor ? 'u.username AS author,' : ''}
            ${includeStats ? 'COUNT(DISTINCT l.like_id) AS like_count,' : '0 AS like_count,'}
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


        const [postRows] = await conn.execute(postSql, [postId]);

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

        let comments = [];
        if (includeComments) {
            const commentSql = `
                SELECT 
                    c.post_id,
                    c.comment_id, c.content, 
                    c.created_at, c.last_updated,
                    u.username
                FROM forum_comments c
                JOIN users u ON c.user_id = u.user_id
                WHERE c.post_id = ?
                ORDER BY c.created_at;
            `;
            const [commentRows] = await conn.execute(commentSql, [postId]);
            comments = commentRows.map(c => ({
                post_id: c.post_id,
                comment_id: c.comment_id,
                username: c.username,
                content: c.content,
                created_at: c.created_at,
                last_updated: c.last_updated
            }));
        }

        await conn.commit();

        return {
            ...post,
            comments
        };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error in getPostByIdDB:", error.message);
        throw new Error(error.message || "Failed to get post");
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
                p.post_id, p.content, p.image_url, p.created_at, p.last_updated,
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


export const createPostDB = async (user_id, category_name, thread_name, content, tag_name = [], image_url = null) => {
    let conn;
    try {
        if (!user_id || !category_name || !thread_name || !content) {
            throw new Error("Missing required fields");
        }

        if (content.length > 10000) {
            throw new Error("Content must be less than 10000 characters");
        }

        conn = await connection.getConnection();
        await conn.beginTransaction();

        // Get or create category
        const [categoryResult] = await conn.execute(
            "SELECT category_id FROM forum_categories WHERE category_name = ?",
            [category_name]
        );

        let category_id;
        if (categoryResult.length > 0) {
            category_id = categoryResult[0].category_id;
        } else {
            const [insertCategoryResult] = await conn.execute(
                "INSERT INTO forum_categories (category_name, user_id) VALUES (?, ?)",
                [category_name, user_id]
            );
            category_id = insertCategoryResult.insertId;
        }

        // Get or create thread
        const [threadResult] = await conn.execute(
            "SELECT thread_id FROM forum_threads WHERE thread_name = ? AND category_id = ?",
            [thread_name, category_id]
        );

        let thread_id;
        if (threadResult.length > 0) {
            thread_id = threadResult[0].thread_id;
        } else {
            const [insertThreadResult] = await conn.execute(
                "INSERT INTO forum_threads (thread_name, category_id, user_id, description) VALUES (?, ?, ?, ?)",
                [thread_name, category_id, user_id, content.slice(0, 100)]
            );
            thread_id = insertThreadResult.insertId;
        }

        // Create post
        const insertForumPostQuery = `
            INSERT INTO forum_posts (thread_id, thread_name, user_id, content, image_url, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        `;
        const [forumPostResult] = await conn.execute(insertForumPostQuery, [
            thread_id,
            thread_name,
            user_id,
            content,
            image_url || null
        ]);

        const post_id = forumPostResult.insertId;

        if (!forumPostResult) {
            throw new Error("Failed to create post");
        }

        // Handle tags
        if (Array.isArray(tag_name) && tag_name.length > 0) {
            for (const tag of tag_name.map(t => t.trim())) {
                if (!tag) continue;

                const [tagResult] = await conn.execute(
                    "SELECT tag_id FROM forum_tags WHERE tag_name = ?",
                    [tag]
                );

                let tag_id;
                if (tagResult.length > 0) {
                    tag_id = tagResult[0].tag_id;
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

        // Create forum entry
        await conn.execute(
            "INSERT INTO forum (user_id, category_id, thread_id, post_id, created_at) VALUES (?, ?, ?, ?, NOW())",
            [user_id, category_id, thread_id, post_id]
        );

        await conn.commit();
        return { post_id };

    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error creating post:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const updatePostDB = async (postId, user_id, content, image_url = null) => {
    let conn;
    try {
        if (!postId || !user_id || !content) {
            throw new Error("Missing required fields");
        }

        if (content.length > 10000) {
            throw new Error("Content must be less than 10000 characters");
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
            throw new Error("Unauthorized to update this post");
        }

        const sql = `
            UPDATE forum_posts
            SET content = ?, image_url = ?, last_updated = CURRENT_TIMESTAMP
            WHERE post_id = ?
        `;
        await conn.execute(sql, [content, image_url, postId]);
        await conn.commit();
        return "Post updated successfully";
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