import { streamChat as apiStreamChat } from '../api/chatbotApi';
import { Message } from '../../types/chat';

/**
 * Service for handling streaming chat with the API
 * @param message User message
 * @param history Chat history
 * @param conversationId Conversation ID (if available)
 * @param onChunk Callback when receiving each chunk from stream
 * @param onComplete Callback when stream is complete
 */
export async function streamChat(
  message: string,
  history: Message[],
  conversationId: string | null = null,
  onChunk: (chunk: string) => void,
  onComplete: (newConversationId?: string) => void
) {
  try {
    const response = await apiStreamChat(message, history, conversationId);

    if (!response.body) {
      throw new Error('ReadableStream không được hỗ trợ trên trình duyệt này.');
    }

    const headerConversationId = response.headers.get('X-Conversation-Id');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    // Read stream
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Process text chunk
      const text = decoder.decode(value);
      onChunk(text);
    }

    // Pass new conversation ID to callback if different from current
    if (headerConversationId && headerConversationId !== conversationId) {
      onComplete(headerConversationId);
    } else {
      onComplete(undefined);
    }
  } catch (error) {
    console.error('Lỗi trong streamChat:', error);
    throw error;
  }
}