import { v4 as uuidv4 } from 'uuid';
import {
  getChatHistoryQuery,
  getConversationByIdQuery,
  createConversationQuery,
  deleteChatQuery,
  updateConversationTitleQuery,
  checkConversationExistsQuery
} from '../queries/chatQueries.js';
import { formatMessagesForFrontend } from './ChatMessage.js';

/**
 * Lấy lịch sử chat của người dùng
 * 
 * @param {string} userId - ID của người dùng
 * @returns {Promise<Array>} Danh sách các cuộc trò chuyện
 */
export const getChatHistoryDB = async (userId) => {
  try {
    return await getChatHistoryQuery(userId);
  } catch (error) {
    console.error('Error retrieving chat history:', error);
    throw new Error('Failed to retrieve chat history');
  }
};

/**
 * Lấy thông tin chi tiết về một cuộc trò chuyện theo ID
 * 
 * @param {string} chatId - ID cuộc trò chuyện
 * @param {string} userId - ID người dùng
 * @returns {Promise<Object>} Thông tin chi tiết về cuộc trò chuyện
 */
export const getChatByIdDB = async (chatId, userId) => {
  try {
    // Kiểm tra cuộc trò chuyện tồn tại và thuộc về người dùng
    const conversation = await getConversationByIdQuery(chatId, userId);
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    // Lấy tin nhắn và format
    const messages = await formatMessagesForFrontend(chatId);
    
    // Ghép thông tin cuộc trò chuyện và tin nhắn
    return {
      conversation_id: conversation.conversation_id,
      title: conversation.title,
      messages: messages,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at
    };
  } catch (error) {
    console.error('Error retrieving chat details:', error);
    throw error;
  }
};

/**
 * Xóa một cuộc trò chuyện
 * 
 * @param {string} chatId - ID cuộc trò chuyện
 * @param {string} userId - ID người dùng
 * @returns {Promise<boolean>} True nếu xóa thành công
 */
export const deleteChatDB = async (chatId, userId) => {
  try {
    const deleted = await deleteChatQuery(chatId, userId);
    
    if (!deleted) {
      throw new Error('Chat not found or already deleted');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw error;
  }
};

/**
 * Tạo cuộc hội thoại mới
 * 
 * @param {string} userId - ID người dùng
 * @param {string} title - Tiêu đề cuộc trò chuyện
 * @returns {Promise<string>} ID cuộc trò chuyện mới
 */
export const createConversationDB = async (userId, title) => {
  try {
    // Tạo và xác minh UUID là duy nhất
    let isUnique = false;
    let conversationId;
    
    while (!isUnique) {
      conversationId = uuidv4();
      isUnique = !(await checkConversationExistsQuery(conversationId));
    }
    
    await createConversationQuery(conversationId, userId, title);
    return conversationId;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw new Error('Failed to create conversation');
  }
};

/**
 * Cập nhật tiêu đề cuộc trò chuyện
 * 
 * @param {string} title - Tiêu đề mới
 * @param {string} chatId - ID cuộc trò chuyện
 * @param {string} userId - ID người dùng
 * @returns {Promise<boolean>} True nếu cập nhật thành công
 */
export const updateConversationTitleDB = async (title, chatId, userId) => {
  try {
    const updated = await updateConversationTitleQuery(title, chatId, userId);
    
    if (!updated) {
      throw new Error('Chat not found or not authorized');
    }
    
    return true;
  } catch (error) {
    console.error('Error updating chat title:', error);
    throw error;
  }
};