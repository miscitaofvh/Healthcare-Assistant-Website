import { useState, useCallback } from 'react';
import { streamChat } from '../utils/service/chatStreamService';
import { uploadSkinImage } from '../utils/api/chatbotApi';
import { Message } from '../types/chat';

/**
 * Custom hook to manage chatbot state and logic
 */
export default function useChatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingIndex, setCurrentStreamingIndex] = useState<number | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [error, setError] = useState<string | null>(null);

  const initializeChat = useCallback(() => {
    setMessages([{
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý y tế của bạn. Tôi có thể giúp gì cho bạn hôm nay?'
    }]);
    setConversationId(null);
    setError(null);
  }, []);


  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || isStreaming) return;
    
    try {
      setError(null);
      
      const updatedMessages = [...messages, { role: 'user' as const, content: userMessage }];
      setMessages(updatedMessages);
      
      setIsStreaming(true);
      
      // Add empty message for assistant to prepare for streaming
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      setCurrentStreamingIndex(updatedMessages.length);
      
      // Only send conversation ID when it's not a new conversation
      const shouldSendConversationId = conversationId && messages.length > 1;
      
      await streamChat(
        userMessage,
        messages,
        shouldSendConversationId ? conversationId : null,
        (chunk) => {
          setMessages(prevMessages => {
            const newMessages = [...prevMessages];
            // Update content for the latest assistant message
            if (newMessages.length > 0) {
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage.role === 'assistant') {
                lastMessage.content += chunk;
              }
            }
            return newMessages;
          });
        },
        // When stream completes
        (newConversationId) => {
          if (newConversationId) {
            setConversationId(current => current || newConversationId);
          }
          
          setIsStreaming(false);
          setCurrentStreamingIndex(null);
        }
      );
    } catch (err) {
      console.error('Lỗi khi giao tiếp với chatbot:', err);
      setError('Có lỗi xảy ra khi giao tiếp với chatbot');
      setIsStreaming(false);
      setCurrentStreamingIndex(null);
      
      // Add error message if an error occurs
      setMessages(prev => {
        const filteredMessages = prev.filter(msg => msg.content !== '');
        return [...filteredMessages, {
          role: 'assistant',
          content: 'Xin lỗi, tôi đã gặp lỗi. Vui lòng thử lại sau.'
        }];
      });
    }
  }, [messages, isStreaming, conversationId]);  const uploadImage = useCallback(async (imageFile: File) => {
    if (!imageFile || isStreaming || isUploading) return;
    
    try {
      setError(null);
      setIsUploading(true);
      
      // Call the upload API directly to get the image URL and analysis results
      const uploadResponse = await uploadSkinImage(imageFile, conversationId);
      
      if (!uploadResponse.success) {
        throw new Error(uploadResponse.error || 'Lỗi khi tải lên hình ảnh');
      }      // Extract image URL and conversation ID from response  
      const imageUrl = (uploadResponse as any).imageUrl;
      const newConversationId = (uploadResponse as any).conversationId;
      const userMessage = `Tôi đã tải lên một hình ảnh da để phân tích`;
      
      // Update conversation ID if a new one was created
      if (newConversationId && !conversationId) {
        setConversationId(newConversationId);
      }
      
      // Add user message with image URL
      const updatedMessages = [...messages, { 
        role: 'user' as const, 
        content: userMessage,
        image_url: imageUrl
      }];
      setMessages(updatedMessages);
        // Add assistant response from the classification
      if (uploadResponse.message && typeof uploadResponse.message === 'string') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: uploadResponse.message as string
        }]);
      }
      
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setError(error.message || 'Lỗi khi tải lên và phân tích hình ảnh');
      
      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Xin lỗi, tôi đã gặp lỗi khi phân tích hình ảnh. Có thể do định dạng ảnh không được hỗ trợ hoặc chất lượng ảnh không đủ tốt. Vui lòng thử tải lên một ảnh khác rõ ràng hơn.'
      }]);
    } finally {
      setIsUploading(false);
      setCurrentStreamingIndex(null);
    }
  }, [messages, isStreaming, conversationId, isUploading]);
  return {
    messages,
    isStreaming,
    isUploading,
    currentStreamingIndex,
    error,
    conversationId,
    initializeChat,
    sendMessage,
    uploadImage,
    resetChat: initializeChat
  };
}