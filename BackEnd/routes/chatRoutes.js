const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Chat routes
router.post('/send', chatController.sendMessage);
router.get('/history', chatController.getChatHistory);
router.get('/health', chatController.checkHealth);

module.exports = router;
