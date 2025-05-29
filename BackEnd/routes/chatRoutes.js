import express from 'express';
import multer from 'multer';
import path from 'path';
import { 
  handleStreamingChat,
  handleSkinDiseaseImageUpload
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

// Configure multer storage for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'temp'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'skin-image-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file format. Only JPEG, JPG, and PNG are allowed.'), false);
  }
};

// Initialize multer upload
const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

const router = express.Router();

// Public chat routes (optional authentication)
router.post('/stream', decodeTokenIfExists, validateChatRequest, handleStreamingChat);
router.post('/upload-skin-image', decodeTokenIfExists, upload.single('image'), handleSkinDiseaseImageUpload);

// Routes requiring authentication
router.get('/history', authenticateUser, getChatHistory);
router.get('/:chatId', authenticateUser, getChatById);
router.delete('/:chatId', authenticateUser, deleteChat);
router.post('/save', authenticateUser, validateSaveChatRequest, saveChatConversation);
router.put('/:chatId/title', authenticateUser, updateConversationTitle);

export default router;