import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import {
  getChatHistoryDB,
  getChatByIdDB,
  deleteChatDB,
  updateConversationTitleDB,
  createConversationDB
} from '../models/Chat.js';
import { addMultipleMessages } from '../models/ChatMessage.js';

dotenv.config();

// Get chat history for the authenticated user
export const getChatHistory = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const results = await getChatHistoryDB(userId);
		
		res.status(200).json({ success: true, data: results });
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Error retrieving chat history',
			error: error.message
		});
	}
};

// Get a single chat by ID
export const getChatById = async (req, res) => {
	try {
		const { chatId } = req.params;
		const userId = req.user.user_id;
		
		const formattedConversation = await getChatByIdDB(chatId, userId);
		res.status(200).json({ success: true, data: formattedConversation });
	} catch (error) {
		const statusCode = error.message === 'Conversation not found' ? 404 : 500;
		
		res.status(statusCode).json({
			success: false,
			message: statusCode === 404 ? 'Conversation not found' : 'Error retrieving chat',
			error: error.message
		});
	}
};

// Delete a chat conversation
export const deleteChat = async (req, res) => {
	try {
		const { chatId } = req.params;
		const userId = req.user.user_id;

		await deleteChatDB(chatId, userId);
		
		res.status(200).json({
			success: true,
			message: 'Chat deleted successfully'
		});
	} catch (error) {
		const statusCode = error.message === 'Chat not found or already deleted' ? 404 : 500;
		
		res.status(statusCode).json({
			success: false,
			message: error.message,
			error: error.message
		});
	}
};

// Save chat conversation
export const saveChatConversation = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const { messages, title } = req.body;

		if (!messages || !Array.isArray(messages) || messages.length < 2) {
			return res.status(400).json({
				success: false,
				message: 'Invalid chat data. Need at least one user message and one assistant response.'
			});
		}

		if (!title || title.trim() === '') {
			return res.status(400).json({
				success: false,
				message: 'Conversation title is required'
			});
		}

		// Tạo cuộc trò chuyện mới
		const conversationId = await createConversationDB(userId, title);
		
		// Thêm tất cả tin nhắn
		await addMultipleMessages(conversationId, userId, messages);
		
		res.status(201).json({
			success: true,
			message: 'Chat history saved successfully',
			data: {
				conversationId,
				title
			}
		});
	} catch (error) {
		console.error('Error saving chat history:', error);
		res.status(500).json({
			success: false,
			message: 'Error saving chat history',
			error: error.message
		});
	}
};

// Update conversation title
export const updateConversationTitle = async (req, res) => {
	try {
		const { chatId } = req.params;
		const { title } = req.body;
		const userId = req.user.user_id;

		if (!title || title.trim() === '') {
			return res.status(400).json({
				success: false,
				message: 'Title is required'
			});
		}

		await updateConversationTitleDB(title, chatId, userId);

		res.status(200).json({
			success: true,
			message: 'Chat title updated successfully'
		});
	} catch (error) {
		const statusCode = error.message === 'Chat not found or not authorized' ? 404 : 500;
		
		res.status(statusCode).json({
			success: false,
			message: error.message,
			error: error.message
		});
	}
};
