import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import ActivityDB from "../../models/Forum/activity.js";

dotenv.config();

const getAllActivities = async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;
        const activities = await ActivityDB.getAllActivitiesDB(parseInt(limit), parseInt(offset));
        const total = await ActivityDB.getActivityCountDB();

        res.status(200).json({
            success: true,
            data: activities,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error("Error fetching all activities:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching activities",
            error: error.message
        });
    }
};

// Get all activities by user (full info)
const getForumActivityByUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        const activities = await ActivityDB.getForumActivityByUserDB(id, parseInt(limit), parseInt(offset));
        const total = await ActivityDB.getActivityCountDB({ id });

        res.status(200).json({
            success: true,
            data: activities,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error("Error fetching forum activities by user:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching forum activities by user",
            error: error.message
        });
    }
};

// Get only basic activities by user (id, type, timestamp)
const getActivitiesByid = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        const activities = await ActivityDB.getActivitiesByUserIdDB(id, parseInt(limit), parseInt(offset));
        const total = await ActivityDB.getActivityCountDB({ id });

        res.status(200).json({
            success: true,
            data: activities,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error("Error fetching activities by user:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching activities by user",
            error: error.message
        });
    }
};

// Get activities by user and type (ex: likes, comments, posts)
const getActivitiesByUserAndType = async (req, res) => {
    try {
        const { id, type } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        if (!id || !type) {
            return res.status(400).json({
                success: false,
                message: "User ID and activity type are required"
            });
        }

        const activities = await ActivityDB.getActivitiesByUserAndTypeDB(id, type, parseInt(limit), parseInt(offset));
        const total = await ActivityDB.getActivityCountDB({ id, type });

        res.status(200).json({
            success: true,
            data: activities,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error("Error fetching activities by user and type:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching activities by user and type",
            error: error.message
        });
    }
};

// Get activities by type (all users)
const getActivitiesByType = async (req, res) => {
    try {
        const { type } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        if (!type) {
            return res.status(400).json({
                success: false,
                message: "Activity type is required"
            });
        }

        const activities = await ActivityDB.getActivitiesByTypeDB(type, parseInt(limit), parseInt(offset));
        const total = await ActivityDB.getActivityCountDB({ type });

        res.status(200).json({
            success: true,
            data: activities,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error("Error fetching activities by type:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching activities by type",
            error: error.message
        });
    }
};

// Create a new activity (post, comment, like, report, etc.)
const createActivity = async (req, res) => {
    try {
        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const id = decoded.user_id;

        const { type, targetType, targetId } = req.body;
        if (!type || !targetType || !targetId) {
            return res.status(400).json({
                success: false,
                message: "Missing required activity data"
            });
        }

        const activityId = await ActivityDB.createActivityDB(id, type, targetType, targetId);
        res.status(201).json({
            success: true,
            message: "Activity created successfully",
            data: { activityId }
        });
    } catch (error) {
        console.error("Error creating activity:", error);
        res.status(500).json({
            success: false,
            message: "Error creating activity",
            error: error.message
        });
    }
};

// Delete an activity by its ID
const deleteActivityById = async (req, res) => {
    try {
        const { activityId } = req.params;
        if (!activityId) {
            return res.status(400).json({
                success: false,
                message: "Activity ID is required"
            });
        }

        await ActivityDB.deleteActivityByIdDB(activityId);
        res.status(200).json({
            success: true,
            message: "Activity deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting activity:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting activity",
            error: error.message
        });
    }
};

// Get activities for a specific target (post, comment, etc.)
const getActivitiesByTarget = async (req, res) => {
    try {
        const { targetType, targetId } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        if (!targetType || !targetId) {
            return res.status(400).json({
                success: false,
                message: "Target type and ID are required"
            });
        }

        const activities = await ActivityDB.getActivitiesByTargetDB(targetType, targetId, parseInt(limit), parseInt(offset));
        const total = await ActivityDB.getActivityCountDB({ targetType, targetId });

        res.status(200).json({
            success: true,
            data: activities,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error("Error fetching activities by target:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching activities by target",
            error: error.message
        });
    }
};

// Get stats (total posts, comments, likes, reports) by user
const getActivityStatsByid = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        const stats = await ActivityDB.getActivityStatsByUserIdDB(id);
        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error("Error fetching activity stats:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching activity stats",
            error: error.message
        });
    }
};

export default {
    getAllActivities,
    getForumActivityByUser,
    getActivitiesByid,
    getActivitiesByUserAndType,
    getActivitiesByType,
    createActivity,
    deleteActivityById,
    getActivitiesByTarget,
    getActivityStatsByid
}