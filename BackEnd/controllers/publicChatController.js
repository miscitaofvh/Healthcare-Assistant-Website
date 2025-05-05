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
