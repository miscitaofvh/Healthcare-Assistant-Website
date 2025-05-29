import pool from '../config/connection.js';

/**
 * Lấy lịch sử chat của một người dùng
 * 
 * @param {string} userId - ID của người dùng
 * @returns {Promise<Array>} Danh sách các cuộc trò chuyện
 */
export const getChatHistoryQuery = async (userId) => {
  const query = `
    SELECT 
      conversation_id, 
      title, 
      created_at, 
      updated_at,
      is_active
    FROM chatbot_conversations
    WHERE user_id = ?
    ORDER BY updated_at DESC
  `;
  const [results] = await pool.execute(query, [userId]);
  return results;
};

/**
 * Lấy thông tin về một cuộc trò chuyện theo ID
 * 
 * @param {string} chatId - ID cuộc trò chuyện
 * @param {string} userId - ID người dùng
 * @returns {Promise<Object|null>} Thông tin cuộc trò chuyện hoặc null nếu không tìm thấy
 */
export const getConversationByIdQuery = async (chatId, userId) => {
  const query = `
    SELECT conversation_id, title, user_id, created_at, updated_at
    FROM chatbot_conversations
    WHERE conversation_id = ? AND user_id = ?
  `;
  const [results] = await pool.execute(query, [chatId, userId]);
  return results.length ? results[0] : null;
};

/**
 * Lấy tất cả tin nhắn của một cuộc trò chuyện
 * 
 * @param {string} chatId - ID cuộc trò chuyện
 * @returns {Promise<Array>} Danh sách tin nhắn
 */
export const getMessagesByChatIdQuery = async (chatId) => {
  const query = `
    SELECT 
      message_id,
      sender_type,
      sender_id,
      message_text as content,
      image_url,
      created_at
    FROM chatbot_messages
    WHERE conversation_id = ?
    ORDER BY created_at ASC
  `;
  const [messages] = await pool.execute(query, [chatId]);
  return messages;
};

/**
 * Xóa một cuộc trò chuyện
 * 
 * @param {string} chatId - ID cuộc trò chuyện
 * @param {string} userId - ID người dùng
 * @returns {Promise<boolean>} True nếu xóa thành công
 */
export const deleteChatQuery = async (chatId, userId) => {
  const query = `
    DELETE FROM chatbot_conversations
    WHERE conversation_id = ? AND user_id = ?
  `;
  const [result] = await pool.execute(query, [chatId, userId]);
  return result.affectedRows > 0;
};

/**
 * Tạo cuộc trò chuyện mới
 * 
 * @param {string} conversationId - ID cuộc trò chuyện
 * @param {string} userId - ID người dùng
 * @param {string} title - Tiêu đề cuộc trò chuyện
 * @returns {Promise<void>}
 */
export const createConversationQuery = async (conversationId, userId, title) => {
  const query = `
    INSERT INTO chatbot_conversations (
      conversation_id,
      user_id,
      title
    ) VALUES (?, ?, ?)
  `;
  await pool.execute(query, [conversationId, userId, title]);
};

/**
 * Thêm tin nhắn vào cuộc trò chuyện
 * 
 * @param {string} messageId - ID tin nhắn
 * @param {string} conversationId - ID cuộc trò chuyện
 * @param {string} senderType - Loại người gửi (user/bot)
 * @param {string|null} senderId - ID người gửi (null đối với bot)
 * @param {string} messageText - Nội dung tin nhắn
 * @returns {Promise<void>}
 */
export const addMessageQuery = async (messageId, conversationId, senderType, senderId, messageText) => {
  const query = `
    INSERT INTO chatbot_messages (
      message_id,
      conversation_id,
      sender_type,
      sender_id,
      message_text
    ) VALUES (?, ?, ?, ?, ?)
  `;
  await pool.execute(query, [messageId, conversationId, senderType, senderId, messageText]);
};

/**
 * Thêm nhiều tin nhắn cùng lúc
 * 
 * @param {Array} messageQueries - Mảng chứa các placeholder (?, ?, ?, ?, ?)
 * @param {Array} messageParams - Mảng chứa các giá trị tham số
 * @returns {Promise<void>}
 */
export const addBulkMessagesQuery = async (messageQueries, messageParams) => {
  const query = `
    INSERT INTO chatbot_messages (
      message_id,
      conversation_id,
      sender_type,
      sender_id,
      message_text
    ) VALUES ${messageQueries.join(', ')}
  `;
  await pool.execute(query, messageParams);
};

/**
 * Cập nhật tiêu đề cuộc trò chuyện
 * 
 * @param {string} title - Tiêu đề mới
 * @param {string} chatId - ID cuộc trò chuyện
 * @param {string} userId - ID người dùng
 * @returns {Promise<boolean>} True nếu cập nhật thành công
 */
export const updateConversationTitleQuery = async (title, chatId, userId) => {
  const query = `
    UPDATE chatbot_conversations
    SET title = ?
    WHERE conversation_id = ? AND user_id = ?
  `;
  const [result] = await pool.execute(query, [title, chatId, userId]);
  return result.affectedRows > 0;
};

/**
 * Kiểm tra xem ID cuộc trò chuyện có đã tồn tại chưa
 * 
 * @param {string} conversationId - ID cuộc trò chuyện cần kiểm tra
 * @returns {Promise<boolean>} True nếu ID đã tồn tại
 */
export const checkConversationExistsQuery = async (conversationId) => {
  const query = `
    SELECT conversation_id 
    FROM chatbot_conversations 
    WHERE conversation_id = ?
  `;
  const [existingConversations] = await pool.execute(query, [conversationId]);
  return existingConversations.length > 0;
};

/**
 * Thêm tin nhắn có hình ảnh vào cuộc trò chuyện
 * 
 * @param {string} messageId - ID tin nhắn
 * @param {string} conversationId - ID cuộc trò chuyện
 * @param {string} senderType - Loại người gửi (user/bot)
 * @param {string|null} senderId - ID người gửi (null đối với bot)
 * @param {string} messageText - Nội dung tin nhắn
 * @param {string} imageUrl - URL hình ảnh
 * @returns {Promise<void>}
 */
export const addMessageWithImageQuery = async (messageId, conversationId, senderType, senderId, messageText, imageUrl) => {
  const query = `
    INSERT INTO chatbot_messages (
      message_id,
      conversation_id,
      sender_type,
      sender_id,
      message_text,
      image_url
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;
  await pool.execute(query, [messageId, conversationId, senderType, senderId, messageText, imageUrl]);
};