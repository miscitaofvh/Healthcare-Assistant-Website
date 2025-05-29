import ollama from 'ollama';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { createConversationDB } from '../models/Chat.js';
import { addUserMessage, addAssistantMessage, addUserMessageWithImage } from '../models/ChatMessage.js';
import { checkConversationExistsQuery } from '../queries/chatQueries.js';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import ImageKit from 'imagekit';

const execPromise = promisify(exec);

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

dotenv.config();

export const handleStreamingChat = async (req, res) => {
  try {
    const { message, history, conversationId } = req.body;
    let responseConversationId = conversationId;
    let isNewConversation = false;

    if (!message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required' 
      });
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Expose-Headers', 'X-Conversation-Id');
    
    // Format history for the AI model
    const formattedHistory = history ? history.map(msg => ({
      role: msg.role,
      content: msg.content
    })) : [];

    formattedHistory.push({
      role: 'user',
      content: message
    });

    // Create new conversation if needed
    if (req.user && !conversationId) {
      try {
        const title = message.length > 30 ? message.substring(0, 30) + '...' : message;
        responseConversationId = await createConversationDB(req.user.user_id, title);
        isNewConversation = true;
        await addUserMessage(responseConversationId, req.user.user_id, message);
      } catch (error) {
        console.error('Error creating conversation:', error);
      }
    }
    
    // Save message to existing conversation
    if (req.user && conversationId && !isNewConversation) {
      try {
        const conversationExists = await checkConversationExistsQuery(conversationId);
        if (conversationExists) {
          await addUserMessage(conversationId, req.user.user_id, message);
        }
      } catch (error) {
        console.error('Error saving user message:', error);
      }
    }

    // Send conversation ID in header
    if (responseConversationId) {
      res.setHeader('X-Conversation-Id', responseConversationId);
    }

    // Process Ollama stream
    const stream = await ollama.chat({
      model: process.env.AI_MODEL_NAME || 'AMH_chatbot',
      messages: formattedHistory,
      stream: true
    });

    let assistantResponse = '';

    for await (const part of stream) {
      if (part.message?.content) {
        assistantResponse += part.message.content;
        res.write(part.message.content);
      }
    }
    
    // Save assistant response
    if (req.user && (responseConversationId || conversationId)) {
      try {
        const chatId = responseConversationId || conversationId;
        await addAssistantMessage(chatId, assistantResponse);
      } catch (error) {
        console.error('Error saving assistant response:', error);
      }
    }
    
    res.end();
  } catch (error) {
    console.error('Streaming chat API error:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: 'Failed to process streaming chat request'
      });
    } else {
      res.write('\n\nXin lỗi, đã xảy ra lỗi khi tạo câu trả lời.');
      res.end();
    }
  }
};

export const handleSkinDiseaseImageUpload = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded'
      });
    }

    // Extract conversation details
    const { conversationId } = req.body;
    
    // Check file type to ensure it's an image
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Only JPG, JPEG, and PNG images are allowed.'
      });
    }    // Build the path to the Python script and model
    const scriptPath = path.join(process.cwd(), 'config', 'chatbot', 'process_skin_image.py');
    const imagePath = req.file.path;
    
    // Upload image to ImageKit first
    let imageUrl = null;
    try {
      // Read file buffer
      const fileBuffer = fs.readFileSync(imagePath);
      
      // Generate unique filename
      const fileName = `skin-analysis-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      
      // Upload to ImageKit
      const uploadResponse = await imagekit.upload({
        file: fileBuffer,
        fileName: fileName,
        folder: '/medical/skin-analysis',
        useUniqueFileName: true,
        tags: ['skin-analysis', 'medical', 'chatbot']
      });
      
      imageUrl = uploadResponse.url;
    } catch (uploadError) {
      console.error('Error uploading image to ImageKit:', uploadError);
      // Continue with analysis even if upload fails
    }
      // Execute Python script to process the image with stderr suppressed
    const { stdout, stderr } = await execPromise(`python "${scriptPath}" "${imagePath}" 2>nul`);
    
    // Only log stderr if it contains actual errors (not TensorFlow warnings)
    if (stderr && stderr.trim() && !stderr.includes('tensorflow') && !stderr.includes('XLA') && !stderr.includes('absl')) {
      console.log('Python script error:', stderr);
    }
    
    // Parse results from the Python script
    let classificationResult;
    try {
      classificationResult = JSON.parse(stdout);
    } catch (parseError) {
      console.error('Error parsing Python script output:', parseError);
      console.error('Raw stdout:', stdout);
      return res.status(500).json({
        success: false,
        error: 'Error parsing classification results'
      });
    }
    
    if (!classificationResult.success) {
      return res.status(500).json({
        success: false,
        error: classificationResult.error || 'Unknown error processing image'
      });
    }
    
    // Save conversation if user is authenticated
    let responseMessage = '';
      // Format the response message in Vietnamese
    responseMessage = `**🔬 Kết quả phân tích bệnh da:**\n\n`;
    responseMessage += `**Bệnh được phát hiện:** ${classificationResult.topDiseaseVietnamese || classificationResult.topDisease}\n`;
    responseMessage += `*Tên tiếng Anh: ${classificationResult.topDisease}*\n`;
    responseMessage += `**Độ tin cậy:** ${classificationResult.topProbability.toFixed(2)}%\n\n`;
    
    responseMessage += "**🔍 Các khả năng khác:**\n";
    // Add top 3 other possibilities if they exist
    const otherPredictions = classificationResult.allPredictions.slice(1, 4);
    otherPredictions.forEach(pred => {
      const vietnameseName = pred.vietnameseName || pred.disease;
      responseMessage += `• ${vietnameseName} (*${pred.disease}*): ${pred.probability.toFixed(2)}%\n`;
    });
    
    responseMessage += `\n**⚠️ LƯU Ý QUAN TRỌNG:** Đây chỉ là đánh giá dựa trên AI và không thể thay thế cho việc khám bệnh trực tiếp. Bạn nên tham khảo ý kiến bác sĩ da liễu để có chẩn đoán chính xác.\n\n`;
    responseMessage += `**💬 Bạn có muốn tôi phân tích chi tiết về bệnh "${classificationResult.topDiseaseVietnamese || classificationResult.topDisease}" và đưa ra các khuyến nghị điều trị không?**`;
    
    responseMessage += `\n\n*Hãy trả lời "Có" hoặc "Phân tích chi tiết" nếu bạn muốn biết thêm thông tin về bệnh này.*`;    // Add message to conversation history if user is authenticated
    let finalConversationId = conversationId;
    
    if (req.user) {
      try {
        // If no conversationId provided, create a new conversation
        if (!conversationId) {
          const title = 'Phân tích bệnh da';
          finalConversationId = await createConversationDB(req.user.user_id, title);
        } else {
          // Check if existing conversation exists
          const conversationExists = await checkConversationExistsQuery(conversationId);
          if (!conversationExists) {
            // If conversation doesn't exist, create a new one
            const title = 'Phân tích bệnh da';
            finalConversationId = await createConversationDB(req.user.user_id, title);
          }
        }
        
        // Add user message with image URL first
        await addUserMessageWithImage(finalConversationId, req.user.user_id, 'Tôi đã tải lên một hình ảnh da để phân tích bệnh', imageUrl);
        
        // Then add AI response with classification results
        await addAssistantMessage(finalConversationId, responseMessage);
        
      } catch (error) {
        console.error('Error saving classification message to conversation:', error);
      }
    }    // Return results
    return res.json({
      success: true,
      message: responseMessage,
      imageUrl: imageUrl, // Include image URL in response
      conversationId: finalConversationId, // Include conversation ID for frontend
      results: classificationResult
    });
    
  } catch (error) {
    console.error('Image upload and classification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process uploaded image'
    });  } finally {
    // Optionally clean up the uploaded image after processing
    // If you want to keep it, comment this out
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
    }
  }
};
