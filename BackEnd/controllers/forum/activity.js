import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import {
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
} from "../../models/Forum/activity.js";

dotenv.config();

export const getAllActivities = async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;
        const activities = await getAllActivitiesDB(parseInt(limit), parseInt(offset));
        const total = await getActivityCountDB();

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
export const getForumActivityByUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        const activities = await getForumActivityByUserDB(id, parseInt(limit), parseInt(offset));
        const total = await getActivityCountDB({ id });

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
export const getActivitiesByid = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        const activities = await getActivitiesByUserIdDB(id, parseInt(limit), parseInt(offset));
        const total = await getActivityCountDB({ id });

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
export const getActivitiesByUserAndType = async (req, res) => {
    try {
        const { id, type } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        if (!id || !type) {
            return res.status(400).json({
                success: false,
                message: "User ID and activity type are required"
            });
        }

        const activities = await getActivitiesByUserAndTypeDB(id, type, parseInt(limit), parseInt(offset));
        const total = await getActivityCountDB({ id, type });

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
export const getActivitiesByType = async (req, res) => {
    try {
        const { type } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        if (!type) {
            return res.status(400).json({
                success: false,
                message: "Activity type is required"
            });
        }

        const activities = await getActivitiesByTypeDB(type, parseInt(limit), parseInt(offset));
        const total = await getActivityCountDB({ type });

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
export const createActivity = async (req, res) => {
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

        const activityId = await createActivityDB(id, type, targetType, targetId);
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
export const deleteActivityById = async (req, res) => {
    try {
        const { activityId } = req.params;
        if (!activityId) {
            return res.status(400).json({
                success: false,
                message: "Activity ID is required"
            });
        }

        await deleteActivityByIdDB(activityId);
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
export const getActivitiesByTarget = async (req, res) => {
    try {
        const { targetType, targetId } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        if (!targetType || !targetId) {
            return res.status(400).json({
                success: false,
                message: "Target type and ID are required"
            });
        }

        const activities = await getActivitiesByTargetDB(targetType, targetId, parseInt(limit), parseInt(offset));
        const total = await getActivityCountDB({ targetType, targetId });

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
export const getActivityStatsByid = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        const stats = await getActivityStatsByUserIdDB(id);
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
