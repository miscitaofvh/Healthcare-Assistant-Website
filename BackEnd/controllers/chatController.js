import ollama from 'ollama';
import db from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

// Get chat history for the authenticated user
export const getChatHistory = async (req, res) => {
	try {
		const userId = req.user.id;

		// Query to get all chat history for a user, grouped by creation date
		const query = `
      SELECT id, question_text as title, answer_text as lastMessage, created_at as createdAt, answered_at as updatedAt
      FROM chat_history
      WHERE user_id = ?
      ORDER BY created_at DESC
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
		const userId = req.user.id;

		const query = `
      SELECT 
        id, 
        user_id, 
        question_text, 
        answer_text,
        is_ai,
        created_at,
        answered_at
      FROM chat_history
      WHERE id = ? AND user_id = ?
    `;

		db.query(query, [chatId, userId], (err, results) => {
			if (err) {
				return res.status(500).json({
					success: false,
					message: 'Error retrieving chat',
					error: err.message
				});
			}

			if (!results || results.length === 0) {
				return res.status(404).json({
					success: false,
					message: 'Chat not found'
				});
			}

			// Format the chat to include messages array for client compatibility
			const chat = results[0];
			const formattedChat = {
				_id: chat.id,
				user: chat.user_id,
				messages: [
					{ role: 'user', content: chat.question_text },
					{ role: 'assistant', content: chat.answer_text }
				],
				createdAt: chat.created_at,
				updatedAt: chat.answered_at
			};

			res.status(200).json({ success: true, data: formattedChat });
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Error retrieving chat',
			error: error.message
		});
	}
};

// Send a message and get AI response
export const sendMessage = async (req, res) => {
	try {
		const { message, chatId } = req.body;
		const userId = req.user.id;

		if (!message) {
			return res.status(400).json({
				success: false,
				message: 'Message is required'
			});
		}

		let previousMessages = [];
		let chatEntry = null;

		// If chatId is provided, get the existing chat to use as context
		if (chatId) {
			const query = `
        SELECT question_text, answer_text 
        FROM chat_history 
        WHERE id = ? AND user_id = ?
      `;

			const results = await new Promise((resolve, reject) => {
				db.query(query, [chatId, userId], (err, results) => {
					if (err) reject(err);
					resolve(results);
				});
			});

			if (results.length === 0) {
				return res.status(404).json({
					success: false,
					message: 'Chat not found'
				});
			}

			// Add previous conversation as context
			chatEntry = results[0];
			previousMessages = [
				{ role: 'user', content: chatEntry.question_text },
				{ role: 'assistant', content: chatEntry.answer_text }
			];
		}

		// Add user message to context
		const userMessage = { role: 'user', content: message };
		const chatContext = [...previousMessages, userMessage];

		// Get response from Ollama using the environment variable
		const response = await ollama.chat({
			model: process.env.AI_MODEL_NAME || 'AMH_chatbot', // Fallback to AMH_chatbot if env var is not set
			messages: chatContext
		});

		// Extract assistant response
		const assistantMessage = {
			role: 'assistant',
			content: response.message.content
		};

		// Determine if we're creating a new chat or just returning context
		if (!chatId) {
			// Insert new chat into database
			const insertQuery = `
        INSERT INTO chat_history 
        (user_id, question_text, answer_text, is_ai, status)
        VALUES (?, ?, ?, true, 'answered')
      `;

			db.query(
				insertQuery,
				[userId, message, response.message.content],
				(err, result) => {
					if (err) {
						return res.status(500).json({
							success: false,
							message: 'Error saving chat',
							error: err.message
						});
					}

					// Return the chat data with the new ID
					res.status(200).json({
						success: true,
						data: {
							chatId: result.insertId,
							userMessage,
							assistantMessage
						}
					});
				}
			);
		} else {
			// Just return the context-aware response without modifying the database
			res.status(200).json({
				success: true,
				data: {
					chatId,
					userMessage,
					assistantMessage,
					isContextOnly: true
				}
			});
		}
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Error processing message',
			error: error.message
		});
	}
};

// Delete a chat conversation
export const deleteChat = async (req, res) => {
	try {
		const { chatId } = req.params;
		const userId = req.user.id;

		const query = `
      DELETE FROM chat_history
      WHERE id = ? AND user_id = ?
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
