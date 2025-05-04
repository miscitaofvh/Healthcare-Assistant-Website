import ollama from 'ollama';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { createConversationDB } from '../models/Chat.js';
import { addUserMessage, addAssistantMessage } from '../models/ChatMessage.js';
import { checkConversationExistsQuery } from '../queries/chatQueries.js';

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
    
    // Format the conversation history for the AI model
    const formattedHistory = history ? history.map(msg => ({
      role: msg.role,
      content: msg.content
    })) : [];

    // Add the current message
    formattedHistory.push({
      role: 'user',
      content: message
    });

    // Nếu người dùng đã đăng nhập và không có conversationId, tạo cuộc trò chuyện mới
    if (req.user && !conversationId) {
      try {
        // Tạo tiêu đề từ tin nhắn đầu tiên
        const title = message.length > 30 ? message.substring(0, 30) + '...' : message;
        
        // Tạo cuộc hội thoại mới và lưu tin nhắn đầu tiên
        responseConversationId = await createConversationDB(req.user.user_id, title);
        isNewConversation = true;
        
        // Lưu tin nhắn người dùng
        await addUserMessage(responseConversationId, req.user.user_id, message);
      } catch (error) {
        console.error('Error creating conversation:', error);
        // Tiếp tục chat ngay cả khi lưu không thành công
      }
    }
    
    // Lưu tin nhắn của người dùng nếu cuộc trò chuyện đã tồn tại
    if (req.user && conversationId && !isNewConversation) {
      try {
        // Kiểm tra conversationId có hợp lệ không
        const conversationExists = await checkConversationExistsQuery(conversationId);
        if (conversationExists) {
          await addUserMessage(conversationId, req.user.user_id, message);
        }
      } catch (error) {
        console.error('Error saving user message:', error);
        // Tiếp tục chat ngay cả khi lưu không thành công
      }
    }

    // Nếu đây là cuộc trò chuyện mới, gửi ID trong header
    if (isNewConversation) {
      res.setHeader('X-Conversation-Id', responseConversationId);
      
      // Gửi ID cuộc trò chuyện như một thông điệp đặc biệt khi bắt đầu stream
      res.write(`CONVERSATION_ID:${responseConversationId}\n\n`);
    }

    // Stream phản hồi từ mô hình Ollama
    const stream = await ollama.chat({
      model: process.env.AI_MODEL_NAME || 'AMH_chatbot',
      messages: formattedHistory,
      stream: true
    });

    let assistantResponse = '';

    // Xử lý stream
    for await (const part of stream) {
      if (part.message?.content) {
        assistantResponse += part.message.content;
        res.write(part.message.content);
      }
    }
    
    // Lưu phản hồi của trợ lý nếu người dùng đã đăng nhập
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
      res.write('\n\nSorry, an error occurred while generating the response.');
      res.end();
    }
  }
};
