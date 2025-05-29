import { v4 as uuidv4 } from 'uuid';
import { addMessageQuery, addBulkMessagesQuery, getMessagesByChatIdQuery, addMessageWithImageQuery } from '../queries/chatQueries.js';

/**
 * Hàm lấy tin nhắn theo ID cuộc trò chuyện và format cho frontend
 * 
 * @param {string} chatId - ID cuộc trò chuyện 
 * @returns {Promise<Array>} - Danh sách tin nhắn đã được format
 */
export const formatMessagesForFrontend = async (chatId) => {
  try {
    const messages = await getMessagesByChatIdQuery(chatId);
      // Format tin nhắn cho frontend
    const formattedMessages = messages.map(msg => ({
      role: msg.sender_type === 'user' ? 'user' : 'assistant',
      content: msg.content,
      image_url: msg.image_url || undefined,
      timestamp: msg.created_at
    }));
    
    return formattedMessages;
  } catch (error) {
    console.error('Error formatting messages:', error);
    throw new Error('Failed to format chat messages');
  }
};

/**
 * Thêm tin nhắn người dùng vào cuộc trò chuyện
 * 
 * @param {string} conversationId - ID cuộc trò chuyện
 * @param {string} userId - ID người dùng
 * @param {string} message - Nội dung tin nhắn
 * @returns {Promise<string>} - ID tin nhắn đã thêm
 */
export const addUserMessage = async (conversationId, userId, message) => {
  try {
    const messageId = uuidv4();
    await addMessageQuery(messageId, conversationId, 'user', userId, message);
    return messageId;
  } catch (error) {
    console.error('Error adding user message:', error);
    throw new Error('Failed to add user message');
  }
};

/**
 * Thêm tin nhắn từ trợ lý vào cuộc trò chuyện
 * 
 * @param {string} conversationId - ID cuộc trò chuyện
 * @param {string} assistantResponse - Nội dung tin nhắn từ trợ lý
 * @returns {Promise<string>} - ID tin nhắn đã thêm
 */
export const addAssistantMessage = async (conversationId, assistantResponse) => {
  try {
    const messageId = uuidv4();
    await addMessageQuery(messageId, conversationId, 'bot', null, assistantResponse);
    return messageId;
  } catch (error) {
    console.error('Error adding assistant message:', error);
    throw new Error('Failed to add assistant message');
  }
};

/**
 * Thêm nhiều tin nhắn cùng một lúc (cho lưu cuộc trò chuyện)
 * 
 * @param {string} conversationId - ID cuộc trò chuyện
 * @param {string} userId - ID người dùng
 * @param {Array} messages - Mảng tin nhắn cần thêm
 * @returns {Promise<boolean>} - True nếu thành công
 */
export const addMultipleMessages = async (conversationId, userId, messages) => {
  try {
    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('Invalid messages format');
    }
    
    // Prepare message parameters
    const messageQueries = [];
    const messageParams = [];
    
    messages.forEach(message => {
      const messageId = uuidv4();
      const senderType = message.role === 'user' ? 'user' : 'bot';
      const senderId = message.role === 'user' ? userId : null;
      
      messageQueries.push(`(?, ?, ?, ?, ?)`);
      messageParams.push(
        messageId,
        conversationId,
        senderType,
        senderId,
        message.content
      );
    });
    
    // Insert all messages
    await addBulkMessagesQuery(messageQueries, messageParams);
    return true;
  } catch (error) {
    console.error('Error adding multiple messages:', error);
    throw new Error('Failed to add multiple messages');
  }
};

/**
 * Thêm tin nhắn người dùng có hình ảnh vào cuộc trò chuyện
 * 
 * @param {string} conversationId - ID cuộc trò chuyện
 * @param {string} userId - ID người dùng
 * @param {string} message - Nội dung tin nhắn
 * @param {string} imageUrl - URL hình ảnh
 * @returns {Promise<string>} - ID tin nhắn đã thêm
 */
export const addUserMessageWithImage = async (conversationId, userId, message, imageUrl) => {
  try {
    const messageId = uuidv4();
    await addMessageWithImageQuery(messageId, conversationId, 'user', userId, message, imageUrl);
    return messageId;
  } catch (error) {
    console.error('Error adding user message with image:', error);
    throw new Error('Failed to add user message with image');
  }
};

/**
 * Thêm tin nhắn từ trợ lý có hình ảnh vào cuộc trò chuyện
 * 
 * @param {string} conversationId - ID cuộc trò chuyện
 * @param {string} assistantResponse - Nội dung tin nhắn từ trợ lý
 * @param {string} imageUrl - URL hình ảnh (optional)
 * @returns {Promise<string>} - ID tin nhắn đã thêm
 */
export const addAssistantMessageWithImage = async (conversationId, assistantResponse, imageUrl = null) => {
  try {
    const messageId = uuidv4();
    await addMessageWithImageQuery(messageId, conversationId, 'bot', null, assistantResponse, imageUrl);
    return messageId;
  } catch (error) {
    console.error('Error adding assistant message with image:', error);
    throw new Error('Failed to add assistant message with image');
  }
};