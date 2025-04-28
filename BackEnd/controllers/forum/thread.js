import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import {
    getAllThreadsDB,
    getSummaryThreadsDB,
    getThreadByIdDB,
    getThreadNameDB,
    getPostsByThreadDB,
    getAllThreadsByUserDB,
    createThreadDB,
    updateThreadDB,
    deleteThreadDB
} from "../../models/Forum/thread.js";

dotenv.config();

export const getAllThreads = async (req, res) => {
    try {
        const threads = await getAllThreadsDB();
        res.status(200).json(threads);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching threads" });
    }
};

export const getSummaryThreads = async (req, res) => {
    try {
        const threads = await getSummaryThreadsDB();
        res.status(200).json(threads);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching threads" });
    }
};

export const getThreadById = async (req, res) => {
    try {
        const { id } = req.params;
        const thread = await getThreadByIdDB(id);
        if (!thread) {
            return res.status(404).json({ message: "Thread not found" });
        }
        res.status(200).json(thread);
    } catch (error) {
        console.error(error);
        if (error.message === "Invalid thread ID") {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Error fetching thread" });
    }
};

export const getThreadName = async (req, res) => {
    try {
        const { name } = req.params;
        const threadId = await getThreadNameDB(name);
        if (!threadId) {
            return res.status(404).json({ message: "Thread not found" });
        }
        res.status(200).json({ threadId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching thread" });
    }
};

export const getPostsByThread = async (req, res) => {
    try {
        const { id } = req.params;
        const threads = await getPostsByThreadDB(id);
        res.status(200).json(threads);
    } catch (error) {
        console.error(error);
        if (error.message === "Invalid post ID") {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Error fetching threads by post" });
    }
};

export const getThreadsByUser = async (req, res) => {
    try {
        const { user_id } = req.params;
        const threads = await getAllThreadsByUserDB(user_id);
        res.status(200).json(threads);
    } catch (error) {
        console.error(error);
        if (error.message === "Invalid user ID") {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Error fetching threads by user" });
    }
};

export const createThread = async (req, res) => {
    try {
        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const author_id = decoded.user_id;

        if (!author_id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { category_id, thread_name, description } = req.body;
        const result = await createThreadDB(author_id, category_id, thread_name, description);
        res.status(201).json({ message: "Thread created successfully", threadId: result });
    } catch (error) {
        console.error(error);
        if (error.message === "Thread name already exists") {
            return res.status(409).json({ message: error.message });
        }
        if (error.message === "Category does not exist") {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === "Thread name is required" || 
            error.message === "Invalid category ID") {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Error creating thread" });
    }
};

export const updateThread = async (req, res) => {
    try {
        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const author_id = decoded.user_id;

        if (!author_id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { id } = req.params;
        const { thread_name, description } = req.body;
        const result = await updateThreadDB(author_id, id, thread_name, description);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        if (error.message === "Thread not found or unauthorized") {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === "Thread name already exists") {
            return res.status(409).json({ message: error.message });
        }
        if (error.message === "Invalid thread ID" || 
            error.message === "No fields to update provided") {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Error updating thread" });
    }
};

export const deleteThread = async (req, res) => {
    try {
        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const author_id = decoded.user_id;

        if (!author_id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { id } = req.params;
        const result = await deleteThreadDB(author_id, id);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        if (error.message === "Thread not found or unauthorized") {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === "Cannot delete thread with existing posts") {
            return res.status(409).json({ message: error.message });
        }
        if (error.message === "Invalid thread ID") {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Error deleting thread" });
    }
};







