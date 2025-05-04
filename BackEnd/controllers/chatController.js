import ollama from 'ollama';
import connection from '../config/connection.js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

// Get chat history for the authenticated user
export const getChatHistory = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const conn = await connection.getConnection();

		// Query to get all conversations for a user
		const query = `
      SELECT 
        conversation_id, 
        title, 
        created_at, 
        updated_at,
        is_active
      FROM chatbot_conversations
      WHERE user_id = ?
      ORDER BY updated_at DESC
    `;

		const [results] = await conn.execute(query, [userId]);
		conn.release();
		
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
		const conn = await connection.getConnection();

		// First check if conversation exists and belongs to user
		const conversationQuery = `
      SELECT conversation_id, title, user_id
      FROM chatbot_conversations
      WHERE conversation_id = ? AND user_id = ?
    `;

		const [conversations] = await conn.execute(conversationQuery, [chatId, userId]);

		if (!conversations || conversations.length === 0) {
			conn.release();
			return res.status(404).json({
				success: false,
				message: 'Conversation not found'
			});
		}

		// Get all messages for this conversation
		const messagesQuery = `
        SELECT 
          message_id,
          sender_type,
          sender_id,
          message_text as content,
          created_at
        FROM chatbot_messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC
      `;

		const [messages] = await conn.execute(messagesQuery, [chatId]);
		conn.release();

		// Format messages for frontend
		const formattedMessages = messages.map(msg => ({
			role: msg.sender_type === 'user' ? 'user' : 'assistant',
			content: msg.content,
			timestamp: msg.created_at
		}));

		const formattedConversation = {
			conversation_id: conversations[0].conversation_id,
			title: conversations[0].title,
			messages: formattedMessages,
			createdAt: conversations[0].created_at,
			updatedAt: conversations[0].updated_at
		};

		res.status(200).json({ success: true, data: formattedConversation });
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Error retrieving chat',
			error: error.message
		});
	}
};

// Delete a chat conversation
export const deleteChat = async (req, res) => {
	try {
		const { chatId } = req.params;
		const userId = req.user.user_id;
		const conn = await connection.getConnection();

		const query = `
      DELETE FROM chatbot_conversations
      WHERE conversation_id = ? AND user_id = ?
    `;

		const [result] = await conn.execute(query, [chatId, userId]);
		conn.release();

		if (result.affectedRows === 0) {
			return res.status(404).json({
				success: false,
				message: 'Chat not found or already deleted'
			});
		}

		res.status(200).json({
			success: true,
			message: 'Chat deleted successfully'
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Error deleting chat',
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

		// Sử dụng connection pool thay vì db
		const conn = await connection.getConnection();
		try {
			await conn.beginTransaction();
			
			// Create a new conversation
			const conversationId = uuidv4();
			const conversationQuery = `
				INSERT INTO chatbot_conversations (
					conversation_id,
					user_id,
					title
				) VALUES (?, ?, ?)
			`;

			await conn.execute(conversationQuery, [conversationId, userId, title]);
			
			// Insert all messages
			const messageQueries = [];
			const messageParams = [];

			messages.forEach(message => {
				const messageId = uuidv4();
				const senderType = message.role === 'user' ? 'user' : 'bot';
				const senderId = message.role === 'user' ? userId : null;

				messageQueries.push(`(?, ?, ?, ?, ?)`);
				messageParams.push(
					messageId,
					conversationId,
					senderType,
					senderId,
					message.content
				);
			});

			const messagesQuery = `
				INSERT INTO chatbot_messages (
					message_id, 
					conversation_id,
					sender_type,
					sender_id,
					message_text
				) VALUES ${messageQueries.join(', ')}
			`;

			await conn.execute(messagesQuery, messageParams);
			
			// Commit the transaction
			await conn.commit();
			
			res.status(201).json({
				success: true,
				message: 'Chat history saved successfully',
				data: {
					conversationId,
					title
				}
			});
		} catch (error) {
			await conn.rollback();
			throw error;
		} finally {
			conn.release();
		}
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
		const conn = await connection.getConnection();

		if (!title || title.trim() === '') {
			conn.release();
			return res.status(400).json({
				success: false,
				message: 'Title is required'
			});
		}

		const query = `
      UPDATE chatbot_conversations
      SET title = ?
      WHERE conversation_id = ? AND user_id = ?
    `;

		const [result] = await conn.execute(query, [title, chatId, userId]);
		conn.release();

		if (result.affectedRows === 0) {
			return res.status(404).json({
				success: false,
				message: 'Chat not found or not authorized'
			});
		}

		res.status(200).json({
			success: true,
			message: 'Chat title updated successfully'
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Error updating chat title',
			error: error.message
		});
	}
};
