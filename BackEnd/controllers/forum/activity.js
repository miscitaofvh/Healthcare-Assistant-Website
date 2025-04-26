import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import {
} from "../../models/Forum/activity.js";

dotenv.config();



export const getForumActivityByUser = async (req, res) => {
    try {
        const { user_id } = req.params; // user_id
        const activity = await getForumActivityByUserDB(user_id);
        res.status(200).json(activity);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching forum activity by user" });
    }
}


export const getForumPostActivityUnmapByPostId = async (req, res) => {
    try {
        const { id } = req.params; // post_id
        const activity = await getForumPostActivityUnmapByPostIdDB(id);
        res.status(200).json(activity);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching forum post activity" });
    }
}

export const getForumPostActivityByPostId = async (req, res) => {
    try {
        const { id } = req.params; // post_id
        const activity = await getForumPostActivityByPostIdDB(id);
        res.status(200).json(activity);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching forum post activity" });
    }
}

export const deleteForumPostActivityByPostId = async (req, res) => {
    try {
        const { id } = req.params; // post_id
        const result = await deleteForumPostActivityByPostIdDB(id);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting forum post activity" });
    }
}

export const getForumPostActivityByUser = async (req, res) => {
    try {
        const { user_id } = req.params; // user_id
        const activity = await getForumPostActivityByUserDB(user_id);
        res.status(200).json(activity);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching forum post activity by user" });
    }
}

export const updateForumPostActivityByPostId = async (req, res) => {
    try {
        const { id } = req.params; // post_id
        const { activity } = req.body;
        const result = await updateForumPostActivityByPostIdDB(id, activity);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating forum post activity" });
    }
}