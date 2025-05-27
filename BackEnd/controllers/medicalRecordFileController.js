// Controller for handling medical record file processing
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../temp');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Process an uploaded medical record file using OCR and chatbot
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const processMedicalRecordFile = async (req, res) => {
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file was uploaded'
            });
        }        // Get the uploaded file path
        const filePath = req.file.path;
        
        // Get processing mode from request or use default
        const processMode = req.body.processMode || 'processed';
        
        // Create a temporary file for output
        const outputFilePath = `${filePath}_output.json`;
        
        // Run the Python script to process the file
        const pythonScript = path.join(__dirname, '../config/chatbot/processMedicalRecord.py');
        
        const pythonProcess = spawn('python', [
            pythonScript,
            '--file', filePath,
            '--mode', processMode,
            '--output', outputFilePath
        ], {
            env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
        });
        
        let errorData = '';
        
        // Collect stderr data only - for error handling
        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString('utf8');
            console.error(`Python error: ${data.toString('utf8')}`);
        });
          // Handle process completion
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Python process exited with code ${code}`);
                console.error(`Error output: ${errorData}`);
                
                return res.status(500).json({
                    success: false,
                    message: 'Error processing file',
                    error: errorData
                });
            }
            
            try {
                // Read the output file
                if (!fs.existsSync(outputFilePath)) {
                    throw new Error('Output file was not created by Python script');
                }
                
                const outputContent = fs.readFileSync(outputFilePath, 'utf8');
                
                // Check if output contains any content
                if (!outputContent || outputContent.trim().length === 0) {
                    throw new Error('Python script returned empty output');
                }
                
                // Parse the JSON output from Python
                const outputJson = JSON.parse(outputContent);
                
                // Clean up the files
                fs.unlink(filePath, err => {
                    if (err) console.error(`Error deleting input file: ${err}`);
                });
                
                fs.unlink(outputFilePath, err => {
                    if (err) console.error(`Error deleting output file: ${err}`);
                });
                
                res.json(outputJson);
            } catch (parseError) {
                console.error('Error processing output file:', parseError);
                
                res.status(500).json({
                    success: false,
                    message: 'Error parsing processing result',
                    error: parseError.message
                });
            }
        });
        
    } catch (error) {
        console.error('Error processing medical record file:', error);
        res.status(500).json({
            success: false,
            message: 'Server error processing file',
            error: error.message
        });
    }
};
