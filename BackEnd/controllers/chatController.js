import ollama from 'ollama';
import db from '../config/db.js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

// Get chat history for the authenticated user
export const getChatHistory = async (req, res) => {
	try {
		const userId = req.user.user_id;

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

		db.query(query, [userId], (err, results) => {
			if (err) {
				return res.status(500).json({
					success: false,
					message: 'Error retrieving chat history',
					error: err.message
				});
			}

			res.status(200).json({ success: true, data: results });
		});
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

		// First check if conversation exists and belongs to user
		const conversationQuery = `
      SELECT conversation_id, title, user_id
      FROM chatbot_conversations
      WHERE conversation_id = ? AND user_id = ?
    `;

		db.query(conversationQuery, [chatId, userId], (err, conversations) => {
			if (err) {
				return res.status(500).json({
					success: false,
					message: 'Error retrieving conversation',
					error: err.message
				});
			}

			if (!conversations || conversations.length === 0) {
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

			db.query(messagesQuery, [chatId], (messagesErr, messages) => {
				if (messagesErr) {
					return res.status(500).json({
						success: false,
						message: 'Error retrieving messages',
						error: messagesErr.message
					});
				}

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
			});
		});
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

		const query = `
      DELETE FROM chatbot_conversations
      WHERE conversation_id = ? AND user_id = ?
    `;

		db.query(query, [chatId, userId], (err, result) => {
			if (err) {
				return res.status(500).json({
					success: false,
					message: 'Error deleting chat',
					error: err.message
				});
			}

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

		// Begin transaction
		db.beginTransaction(async (transErr) => {
			if (transErr) {
				return res.status(500).json({
					success: false,
					message: 'Database transaction error',
					error: transErr.message
				});
			}

			// Create a new conversation
			const conversationId = uuidv4();
			const conversationQuery = `
        INSERT INTO chatbot_conversations (
          conversation_id,
          user_id,
          title
        ) VALUES (?, ?, ?)
      `;

			db.query(conversationQuery, [conversationId, userId, title], (convErr, convResult) => {
				if (convErr) {
					return db.rollback(() => {
						res.status(500).json({
							success: false,
							message: 'Error creating conversation',
							error: convErr.message
						});
					});
				}

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

				db.query(messagesQuery, messageParams, (msgErr) => {
					if (msgErr) {
						return db.rollback(() => {
							res.status(500).json({
								success: false,
								message: 'Error saving messages',
								error: msgErr.message
							});
						});
					}

					// Commit the transaction
					db.commit(commitErr => {
						if (commitErr) {
							return db.rollback(() => {
								res.status(500).json({
									success: false,
									message: 'Error committing transaction',
									error: commitErr.message
								});
							});
						}

						res.status(201).json({
							success: true,
							message: 'Chat history saved successfully',
							data: {
								conversationId,
								title
							}
						});
					});
				});
			});
		});
	} catch (error) {
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

		const query = `
      UPDATE chatbot_conversations
      SET title = ?
      WHERE conversation_id = ? AND user_id = ?
    `;

		db.query(query, [title, chatId, userId], (err, result) => {
			if (err) {
				return res.status(500).json({
					success: false,
					message: 'Error updating chat title',
					error: err.message
				});
			}

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
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Error updating chat title',
			error: error.message
		});
	}
};
