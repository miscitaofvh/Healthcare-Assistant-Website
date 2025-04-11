import connection from '../config/connection.js';

// Get all posts
export const getPostsDB = async () => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = `
            SELECT 
                p.post_id, p.content, p.image_url, p.created_at, p.last_updated,
                u.username AS author, u.user_id,
                t.thread_name, t.thread_id,
                c.category_name, c.category_id,
                COUNT(DISTINCT l.like_id) AS like_count
            FROM forum_posts p
            JOIN users u ON p.user_id = u.user_id
            JOIN forum_threads t ON p.thread_id = t.thread_id
            JOIN forum_categories c ON t.category_id = c.category_id
            LEFT JOIN forum_likes l ON p.post_id = l.post_id
            GROUP BY p.post_id
            ORDER BY p.created_at DESC
        `;
        const [posts] = await conn.execute(sql);
        await conn.commit();
        return posts;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting posts:", error);
        throw new Error("Failed to get posts");
    } finally {
        if (conn) conn.release();
    }
};

// Get post by ID
export const getPostByIdDB = async (postId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = `
            SELECT 
                p.post_id, p.content, p.image_url, p.created_at, p.last_updated,
                u.username AS author, u.user_id,
                t.thread_name, t.thread_id,
                c.category_name, c.category_id,
                COUNT(DISTINCT l.like_id) AS like_count
            FROM forum_posts p
            JOIN users u ON p.user_id = u.user_id
            JOIN forum_threads t ON p.thread_id = t.thread_id
            JOIN forum_categories c ON t.category_id = c.category_id
            LEFT JOIN forum_likes l ON p.post_id = l.post_id
            WHERE p.post_id = ?
            GROUP BY p.post_id
        `;
        const [post] = await conn.execute(sql, [postId]);
        await conn.commit();
        return post[0] || null;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting post:", error);
        throw new Error("Failed to get post");
    } finally {
        if (conn) conn.release();
    }
};

// Check if category exists
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

// Create new category and return its ID
export const createCategoryDB = async (category_name) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = `
            INSERT INTO forum_categories (category_name) 
            VALUES (?)
        `;
        const [result] = await conn.execute(sql, [category_name.toLowerCase()]);
        await conn.commit();
        console.log(`Created new category: ${category_name} with ID: ${result.insertId}`);
        return result.insertId; 
    } catch (error) {
        if (conn) await conn.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            throw new Error("Category already exists");
        }
        console.error("Error creating category:", error);
        throw new Error("Failed to create category");
    } finally {
        if (conn) conn.release();
    }
};

// Check if thread exists
export const getThreadNameDB = async (thread_name) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = `
            SELECT thread_id 
            FROM forum_threads 
            WHERE thread_name = ?
        `;
        const [rows] = await conn.execute(sql, [thread_name.toLowerCase()]);
        await conn.commit();
        return rows[0]?.thread_id || null;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting thread:", error);
        throw new Error("Failed to get thread");
    } finally {
        if (conn) conn.release();
    }
};

// Get thread by ID
export const getThreadByIdDB = async (thread_id) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = `
            SELECT 
                t.thread_id, t.thread_name, t.description, t.created_at, t.last_updated,
                u.username AS author, u.user_id,
                c.category_name, c.category_id
            FROM forum_threads t
            JOIN users u ON t.user_id = u.user_id
            JOIN forum_categories c ON t.category_id = c.category_id
            WHERE t.thread_id = ?
        `;
        const [rows] = await conn.execute(sql, [thread_id]);
        await conn.commit();
        return rows[0] || null;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting thread:", error);
        throw new Error("Failed to get thread");
    } finally {
        if (conn) conn.release();
    }
};

// Create new thread and return its ID
export const createThreadDB = async (thread_name, category_id, user_id, description = null) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            INSERT INTO forum_threads (thread_name, category_id, user_id, description) 
            VALUES (?, ?, ?, ?)
        `;
        console.log(`Creating thread with params:`, {
            thread_name: thread_name.toLowerCase(),
            category_id,
            user_id,
            description
        });
        const [result] = await conn.execute(sql, [
            thread_name.toLowerCase(),
            category_id,
            user_id,
            description
        ]);
        await conn.commit();
        console.log(`Created new thread: ${thread_name} with ID: ${result.insertId}`);
        return result.insertId;
    } catch (error) {
        if (conn) await conn.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            throw new Error("Thread name already exists");
        }
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            console.error(`Category ${category_id} does not exist when creating thread ${thread_name}`);
            throw new Error("Category does not exist");
        }
        console.error("Error creating thread:", error);
        throw new Error("Failed to create thread");
    } finally {
        if (conn) conn.release();
    }
};

// Create a post
export const createPostDB = async (thread_id, content, user_id, image_url = null) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = `
            INSERT INTO forum_posts (thread_id, content, user_id, image_url)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await conn.execute(sql, [thread_id, content, user_id, image_url]);
        await conn.commit();
        return result.insertId;
    } catch (error) {
        if (conn) await conn.rollback();
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            throw new Error("Thread does not exist. Cannot create post.");
        }
        console.error("Error creating post:", error);
        throw new Error("Failed to create post");
    } finally {
        if (conn) conn.release();
    }
};

// Update a post
export const updatePostDB = async (postId, content, image_url = null) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
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
        throw new Error("Failed to update post");
    } finally {
        if (conn) conn.release();
    }
};

// Delete a post
export const deletePostDB = async (postId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = "DELETE FROM forum_posts WHERE post_id = ?";
        await conn.execute(sql, [postId]);
        await conn.commit();
        return "Post deleted successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error deleting post:", error);
        throw new Error("Failed to delete post");
    } finally {
        if (conn) conn.release();
    }
};

// Like a post
export const likePostDB = async (postId, userId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = `
            INSERT INTO forum_likes (post_id, user_id)
            VALUES (?, ?)
        `;
        await conn.execute(sql, [postId, userId]);
        await conn.commit();
        return "Post liked successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            throw new Error("You have already liked this post");
        }
        console.error("Error liking post:", error);
        throw new Error("Failed to like post");
    } finally {
        if (conn) conn.release();
    }
};

// Unlike a post
export const unlikePostDB = async (postId, userId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = `
            DELETE FROM forum_likes
            WHERE post_id = ? AND user_id = ?
        `;
        const [result] = await conn.execute(sql, [postId, userId]);
        await conn.commit();
        if (result.affectedRows === 0) {
            throw new Error("You have not liked this post");
        }
        return "Post unliked successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error unliking post:", error);
        throw new Error("Failed to unlike post");
    } finally {
        if (conn) conn.release();
    }
};

// Report a post
export const reportPostDB = async (postId, userId, reason) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = `
            INSERT INTO forum_reports (post_id, reported_by, reason)
            VALUES (?, ?, ?)
        `;
        await conn.execute(sql, [postId, userId, reason]);
        await conn.commit();
        return "Post reported successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error reporting post:", error);
        throw new Error("Failed to report post");
    } finally {
        if (conn) conn.release();
    }
};

export const getCommentsDB = async (postId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            SELECT 
                c.comment_id, c.content, c.created_at, c.last_updated,
                u.username AS author, u.user_id
            FROM forum_comments c
            JOIN users u ON c.user_id = u.user_id
        `;  
        const [comments] = await conn.execute(sql, [postId]);
        await conn.commit();
        return comments;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error getting comments:", error);
        throw new Error("Failed to get comments");
    } finally {
        if (conn) conn.release();
    }
};

export const createCommentDB = async (postId, content, userId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            INSERT INTO forum_comments (post_id, content, user_id)
            VALUES (?, ?, ?)
        `;
        await conn.execute(sql, [postId, content, userId]);
        await conn.commit();
        return "Comment created successfully";      
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error creating comment:", error);
        throw new Error("Failed to create comment");
    } finally {
        if (conn) conn.release();
    }
};

export const deleteCommentDB = async (commentId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            DELETE FROM forum_comments
            WHERE comment_id = ?
        `;
        await conn.execute(sql, [commentId]);
        await conn.commit();
        return "Comment deleted successfully";
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error deleting comment:", error);
        throw new Error("Failed to delete comment");
    } finally {
        if (conn) conn.release();
    }
};

