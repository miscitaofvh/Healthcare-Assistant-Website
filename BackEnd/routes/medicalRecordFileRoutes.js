import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { processMedicalRecordFile } from '../controllers/medicalRecordFileController.js';
import { authenticateUser } from '../security/authMiddleware.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Define __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../temp'));
    },
    filename: (req, file, cb) => {
        // Generate a unique filename with original extension
        const fileExt = path.extname(file.originalname);
        cb(null, `${uuidv4()}${fileExt}`);
    }
});

// File filter to accept only specific file types
const fileFilter = (req, file, cb) => {
    // Define allowed file types
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/bmp', 'image/tiff',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
        'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Unsupported file type. Please upload an image, PDF, DOCX, or TXT file.'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter
});

// Route to handle medical record file processing
router.post('/upload', authenticateUser, upload.single('file'), processMedicalRecordFile);

export default router;
