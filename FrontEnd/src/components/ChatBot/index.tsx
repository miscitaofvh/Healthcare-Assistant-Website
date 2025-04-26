import React, { useState, useRef, useEffect } from 'react';
import './ChatBot.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router-dom';
import API from '../../utils/api/api';
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
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsStreaming(true); // Just use isStreaming
    
    try {
      // Create an empty assistant message that will be updated with streaming content
      setMessages(prevMessages => [
        ...prevMessages,
        {
          role: 'assistant',
          content: ''
        }
      ]);
      
      setCurrentStreamingIndex(messages.length + 1); // Set the index of streaming message
      
      // Use the streaming API
      await streamChatMessage(
        inputMessage,
        messages,
        // On each chunk received
        (chunk) => {
          setMessages(prevMessages => {
            const newMessages = [...prevMessages];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === 'assistant') {
              lastMessage.content += chunk;
            }
            return newMessages;
          });
          // Make sure we scroll as content comes in
          scrollToBottom();
        },
        // When streaming is complete
        () => {
          setIsStreaming(false);
          setCurrentStreamingIndex(null);
        }
      );
    } catch (error) {
      console.error('Error communicating with chatbot:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again later.'
        }
      ]);
      setIsStreaming(false);
      setCurrentStreamingIndex(null);
    }
  };

  // Don't render the component if it's on an excluded path
  if (!isChatbotAllowed) return null;

  return (
    <div className="chatbot-container">
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>AMH Healthcare Assistant</h3>
            <button className="close-button" onClick={toggleChat}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          
          <div className="chatbot-messages">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`message ${message.role === 'user' ? 'user-message' : 'bot-message'} ${
                  isStreaming && index === currentStreamingIndex ? 'streaming' : ''
                }`}
              >
                <div className="message-content">
                  {message.role === 'assistant' ? (
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  ) : (
                    message.content
                  )}
                  {isStreaming && index === currentStreamingIndex && (
                    <span className="streaming-cursor" aria-hidden="true"></span>
                  )}
                </div>
              </div>
            ))}
            
            <div ref={messagesEndRef} />
          </div>
          
          <form className="chatbot-input" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Type your message here..."
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              disabled={isStreaming}
            />
            <button type="submit" disabled={!inputMessage.trim() || isStreaming}>
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </form>
        </div>
      )}
      
      <button 
        className={`chatbot-toggle ${isOpen ? 'open' : ''}`} 
        onClick={toggleChat}
        aria-label="Toggle chat"
      >
        {isOpen ? (
          <FontAwesomeIcon icon={faTimes} />
        ) : (
          <img src={mainLogo} alt="Chat" className="chatbot-logo" />
        )}
      </button>
    </div>
  );
};

export default ChatBot;
