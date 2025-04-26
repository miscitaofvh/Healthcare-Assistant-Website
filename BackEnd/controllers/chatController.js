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
