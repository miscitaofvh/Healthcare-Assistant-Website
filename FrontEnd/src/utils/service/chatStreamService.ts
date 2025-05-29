import { streamChat as apiStreamChat, uploadSkinImage as apiUploadSkinImage } from '../api/chatbotApi';
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

/**
 * Service for handling image analysis for skin disease detection
 * @param imageFile Image file to analyze
 * @param history Chat history
 * @param conversationId Conversation ID (if available)
 * @param onChunk Callback when receiving each chunk from stream
 * @param onComplete Callback when analysis is complete
 */
export async function analyzeImage(
  imageFile: File,
  _history: Message[],
  conversationId: string | null = null,
  onChunk: (chunk: string) => void,
  onComplete: (newConversationId?: string) => void
) {
  try {
    const response = await apiUploadSkinImage(imageFile, conversationId);
    
    if (response.success && response.message) {
      // Simulate streaming for the analysis result
      const message = response.message;
      const chunks = message.split(' ');
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = (i === 0 ? chunks[i] : ' ' + chunks[i]);
        onChunk(chunk);
        
        // Add a small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      onComplete(conversationId || undefined);
    } else {
      throw new Error(response.error || 'Lỗi khi phân tích hình ảnh');
    }
  } catch (error) {
    console.error('Lỗi trong analyzeImage:', error);
    throw error;
  }
}