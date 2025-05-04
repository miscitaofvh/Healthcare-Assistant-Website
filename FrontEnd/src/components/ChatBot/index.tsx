import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import './ChatBot.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faTimes } from '@fortawesome/free-solid-svg-icons';
import mainLogo from '../../assets/images/Logo/main_logo.png';
import ReactMarkdown from 'react-markdown';
import { streamChatMessage } from '../../utils/service/chat';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [currentStreamingIndex, setCurrentStreamingIndex] = useState<number | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // List of paths where chatbot should NOT be available
  const excludedPaths = ['/test', '/verify-pending', '/verify', '/error'];

  // Check if current path is allowed
  const isChatbotAllowed = !excludedPaths.some(path => location.pathname.startsWith(path));

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    
    // Add welcome message when opening an empty chat
    if (!isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: 'Xin chào! Tôi là trợ lý y tế của bạn. Tôi có thể giúp gì cho bạn hôm nay?'
        }
      ]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && inputMessage.trim()) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: inputMessage
    };
    
    // Save current message for API call
    const currentInputMessage = inputMessage;
    const currentMessages = [...messages];
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsStreaming(true);
    
    try {
      // Create an empty assistant message that will be updated with streaming content
      setMessages(prevMessages => {
        const newMessages = [...prevMessages, {
          role: 'assistant' as const,
          content: ''
        }];
        
        // Set the streaming index to the last message (the assistant response)
        setCurrentStreamingIndex(newMessages.length - 1);
        
        return newMessages;
      });
      
      // Use the streaming API with current message state (not the updated one)
      await streamChatMessage(
        currentInputMessage,
        currentMessages,
        conversationId,
        // On each chunk received
        (chunk) => {
          setMessages(prevMessages => {
            const newMessages = [...prevMessages];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content += chunk;
            }
            return newMessages;
          });
          // Make sure we scroll as content comes in
          scrollToBottom();
        },
        // When streaming is complete
        (fullResponse, newConversationId) => {
          console.log('onComplete called with newConversationId:', newConversationId);
          console.log('Current conversationId state:', conversationId);
          setIsStreaming(false);
          setCurrentStreamingIndex(null);
          
          // If this is the first message and we got a new conversation ID back
          if (newConversationId && !conversationId) {
            setConversationId(newConversationId);
            console.log('Cuộc trò chuyện đã được tự động lưu với ID:', newConversationId);
          }
        }
      );
    } catch (error) {
      console.error('Error communicating with chatbot:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Xin lỗi, tôi đã gặp lỗi. Vui lòng thử lại sau.'
        }
      ]);
      setIsStreaming(false);
      setCurrentStreamingIndex(null);
    }
  };

  // Don't render if not allowed on this page
  if (!isChatbotAllowed) {
    return null;
  }

  return (
    <div className="chatbot-container">
      {!isOpen ? (
        <button onClick={toggleChat} className="chatbot-toggle">
          <img src={mainLogo} alt="Chat" className="chatbot-logo" />
        </button>
      ) : (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>Trợ lý Y tế AMH</h3>
            <button onClick={toggleChat} className="close-button">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`message ${msg.role === 'user' ? 'user-message' : 'bot-message'} 
                           ${index === currentStreamingIndex ? 'streaming' : ''}`}
              >
                <div className="message-content">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  {index === currentStreamingIndex && <span className="streaming-cursor"></span>}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSubmit} className="chatbot-input">
            <input
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Nhập câu hỏi của bạn..."
              disabled={isStreaming}
            />
            <button 
              type="submit" 
              disabled={isStreaming || !inputMessage.trim()}
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
