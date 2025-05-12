import connection from "../../config/connection.js";

const getAllActivitiesDB = async (limit = 20, offset = 0) => {
    let conn;
    try {
        conn = await connection.getConnection();
        const sql = `
            SELECT 
                id, 
                user_id, 
                activity_type, 
                target_type, 
                target_id, 
                activity_timestamp
            FROM forum_activities
            ORDER BY activity_timestamp DESC
            LIMIT ? OFFSET ?
        `;
        const [activities] = await conn.execute(sql, [limit, offset]);
        return activities;
    } catch (error) {
        console.error("Error fetching all activities from DB:", error);
        throw new Error("Failed to fetch activities");
    } finally {
        if (conn) conn.release();
    }
};

// Get all activities by user
const getForumActivityByUserDB = async (userId, limit = 20, offset = 0) => {
    if (!userId) throw new Error("User ID is required");
    
    let conn;
    try {
        conn = await connection.getConnection();
        const sql = `
            SELECT 
                id, 
                user_id, 
                activity_type, 
                target_type, 
                target_id, 
                activity_timestamp
            FROM forum_activities
            WHERE user_id = ? 
            ORDER BY activity_timestamp DESC
            LIMIT ? OFFSET ?
        `;
        const [activities] = await conn.execute(sql, [userId, limit, offset]);
        return activities;
    } catch (error) {
        console.error("Error fetching activities by user:", error);
        throw new Error("Failed to fetch activities by user");
    } finally {
        if (conn) conn.release();
    }
};

// Get activities by user ID
const getActivitiesByUserIdDB = async (userId, limit = 20, offset = 0) => {
    if (!userId) throw new Error("User ID is required");
    
    let conn;
    try {
        conn = await connection.getConnection();
        const sql = `
            SELECT 
                id, 
                activity_type, 
                target_type, 
                target_id, 
                activity_timestamp 
            FROM forum_activities
            WHERE user_id = ? 
            ORDER BY activity_timestamp DESC
            LIMIT ? OFFSET ?
        `;
        const [activities] = await conn.execute(sql, [userId, limit, offset]);
        return activities;
    } catch (error) {
        console.error("Error fetching activities by user ID:", error);
        throw new Error("Failed to fetch activities by user ID");
    } finally {
        if (conn) conn.release();
    }
};

// Get activities by user and type
const getActivitiesByUserAndTypeDB = async (userId, type, limit = 20, offset = 0) => {
    if (!userId) throw new Error("User ID is required");
    if (!type) throw new Error("Activity type is required");
    
    let conn;
    try {
        conn = await connection.getConnection();
        const sql = `
            SELECT 
                id, 
                activity_type, 
                target_type, 
                target_id, 
                activity_timestamp 
            FROM forum_activities
            WHERE user_id = ? AND activity_type = ? 
            ORDER BY activity_timestamp DESC
            LIMIT ? OFFSET ?
        `;
        const [activities] = await conn.execute(sql, [userId, type, limit, offset]);
        return activities;
    } catch (error) {
        console.error("Error fetching activities by user and type:", error);
        throw new Error("Failed to fetch activities by user and type");
    } finally {
        if (conn) conn.release();
    }
};

// Get activities by type (for all users)
const getActivitiesByTypeDB = async (type, limit = 20, offset = 0) => {
    if (!type) throw new Error("Activity type is required");
    
    let conn;
    try {
        conn = await connection.getConnection();
        const sql = `
            SELECT 
                id, 
                user_id, 
                activity_type, 
                target_type, 
                target_id, 
                activity_timestamp 
            FROM forum_activities
            WHERE activity_type = ? 
            ORDER BY activity_timestamp DESC
            LIMIT ? OFFSET ?
        `;
        const [activities] = await conn.execute(sql, [type, limit, offset]);
        return activities;
    } catch (error) {
        console.error("Error fetching activities by type:", error);
        throw new Error("Failed to fetch activities by type");
    } finally {
        if (conn) conn.release();
    }
};

// Create a new activity (post, comment, like, etc.)
const createActivityDB = async (userId, type, targetType, targetId) => {
    if (!userId || !type || !targetType || !targetId) {
        throw new Error("Missing required parameters");
    }
    
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            INSERT INTO forum_activities (
                user_id, 
                activity_type, 
                target_type, 
                target_id
            ) VALUES (?, ?, ?, ?)
        `;
        const [result] = await conn.execute(sql, [userId, type, targetType, targetId]);

        await conn.commit();
        return result.insertId;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error creating activity:", error);
        throw new Error("Failed to create activity");
    } finally {
        if (conn) conn.release();
    }
};

// Delete an activity by its ID
const deleteActivityByIdDB = async (activityId) => {
    if (!activityId) throw new Error("Activity ID is required");
    
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `
            DELETE FROM forum_activities
            WHERE id = ?
        `;
        await conn.execute(sql, [activityId]);

        await conn.commit();
        return true;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Error deleting activity:", error);
        throw new Error("Failed to delete activity");
    } finally {
        if (conn) conn.release();
    }
};

// Get activities for a specific target (e.g., a post or comment)
const getActivitiesByTargetDB = async (targetType, targetId, limit = 20, offset = 0) => {
    if (!targetType || !targetId) {
        throw new Error("Target type and ID are required");
    }
    
    let conn;
    try {
        conn = await connection.getConnection();
        const sql = `
            SELECT 
                id, 
                user_id, 
                activity_type, 
                activity_timestamp
            FROM forum_activities
            WHERE target_type = ? AND target_id = ?
            ORDER BY activity_timestamp DESC
            LIMIT ? OFFSET ?
        `;
        const [activities] = await conn.execute(sql, [targetType, targetId, limit, offset]);
        return activities;
    } catch (error) {
        console.error("Error fetching activities by target:", error);
        throw new Error("Failed to fetch activities by target");
    } finally {
        if (conn) conn.release();
    }
};

// Get activity stats (total posts, comments, likes, reports) by user ID
const getActivityStatsByUserIdDB = async (userId) => {
    if (!userId) throw new Error("User ID is required");
    
    let conn;
    try {
        conn = await connection.getConnection();
        const sql = `
            SELECT
                COUNT(CASE WHEN activity_type = 'post' THEN 1 END) AS posts,
                COUNT(CASE WHEN activity_type = 'comment' THEN 1 END) AS comments,
                COUNT(CASE WHEN activity_type = 'like' THEN 1 END) AS likes,
                COUNT(CASE WHEN activity_type = 'report' THEN 1 END) AS reports,
                MAX(activity_timestamp) AS last_activity
            FROM forum_activities
            WHERE user_id = ?
        `;
        const [stats] = await conn.execute(sql, [userId]);
        return stats[0];
    } catch (error) {
        console.error("Error fetching activity stats by user ID:", error);
        throw new Error("Failed to fetch activity stats by user ID");
    } finally {
        if (conn) conn.release();
    }
};

const getActivityCountDB = async (filters = {}) => {
    let conn;
    try {
        conn = await connection.getConnection();
        let sql = "SELECT COUNT(*) as total FROM forum_activities WHERE 1=1";
        const params = [];

        if (filters.userId) {
            sql += " AND user_id = ?";
            params.push(filters.userId);
        }

        if (filters.type) {
            sql += " AND activity_type = ?";
            params.push(filters.type);
        }

        if (filters.targetType) {
            sql += " AND target_type = ?";
            params.push(filters.targetType);
        }

        if (filters.targetId) {
            sql += " AND target_id = ?";
            params.push(filters.targetId);
        }

        const [result] = await conn.execute(sql, params);
        return result[0].total;
    } catch (error) {
        console.error("Error fetching activity count:", error);
        throw new Error("Failed to fetch activity count");
    } finally {
        if (conn) conn.release();
    }
};


export default {
    getAllActivitiesDB,
    getForumActivityByUserDB,
    getActivitiesByUserIdDB,
    getActivitiesByUserAndTypeDB,
    getActivitiesByTypeDB,
    createActivityDB,
    deleteActivityByIdDB,
    getActivitiesByTargetDB,
    getActivityStatsByUserIdDB,
    getActivityCountDB
}