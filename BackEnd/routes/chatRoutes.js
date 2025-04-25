import { Router } from 'express';
import { getChatHistory, sendMessage, getChatById, deleteChat } from '../controllers/chatController.js';
import { handlePublicChat, handleStreamingChat } from '../controllers/publicChatController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { validateChatRequest } from '../middleware/chatMiddleware.js';

const router = Router();

// Public chat endpoints - không cần xác thực
router.post('/', handlePublicChat);
router.post('/stream', handleStreamingChat);

// Bảo vệ các route chat còn lại bằng middleware xác thực
router.use('/history', authenticateUser);
router.use('/message', authenticateUser);
router.use('/:chatId', authenticateUser);

// Các route cần xác thực
router.get('/history', getChatHistory);
router.post('/message', sendMessage);
router.get('/:chatId', getChatById);
router.delete('/:chatId', deleteChat);

export default router;