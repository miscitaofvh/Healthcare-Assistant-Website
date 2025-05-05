import { useState, useCallback } from 'react';
import { streamChat } from '../utils/service/chatStreamService';
import { Message } from '../types/chat';

/**
 * Custom hook to manage chatbot state and logic
 */
export default function useChatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingIndex, setCurrentStreamingIndex] = useState<number | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
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
  }, [messages, isStreaming, conversationId]);

  return {
    messages,
    isStreaming,
    currentStreamingIndex,
    error,
    initializeChat,
    sendMessage,
    resetChat: initializeChat
  };
}