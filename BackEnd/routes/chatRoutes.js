import express from 'express';
import { 
  handleStreamingChat 
} from '../controllers/publicChatController.js';

import { 
  getChatHistory, 
  getChatById, 
  deleteChat, 
  saveChatConversation,
  updateConversationTitle
} from '../controllers/chatController.js';

import { validateChatRequest, validateSaveChatRequest } from '../middleware/chatMiddleware.js';
import { authenticateUser, decodeTokenIfExists } from '../security/authMiddleware.js';

const router = express.Router();

// Public chat routes (optional authentication)
router.post('/stream', decodeTokenIfExists, validateChatRequest, handleStreamingChat);

// Routes requiring authentication
router.get('/history', authenticateUser, getChatHistory);
router.get('/:chatId', authenticateUser, getChatById);
router.delete('/:chatId', authenticateUser, deleteChat);
router.post('/save', authenticateUser, validateSaveChatRequest, saveChatConversation);
router.put('/:chatId/title', authenticateUser, updateConversationTitle);

export default router;