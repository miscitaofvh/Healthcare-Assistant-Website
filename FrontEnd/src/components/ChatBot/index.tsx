import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import './ChatBot.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faTimes } from '@fortawesome/free-solid-svg-icons';
import mainLogo from '../../assets/images/Logo/main_logo.png';
import ReactMarkdown from 'react-markdown';
import useChatbot from '../../hooks/useChatbot';
import { Message } from '../../types/chat';

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  
  const {
    messages,
    isStreaming,
    currentStreamingIndex,
    error,
    initializeChat,
    sendMessage
  } = useChatbot();

  // Danh sách đường dẫn không hiển thị chatbot
  const excludedPaths = ['/test', '/verify-pending', '/verify', '/error'];
  const isChatbotAllowed = !excludedPaths.some(path => location.pathname.startsWith(path));

  // Cuộn xuống dưới khi có tin nhắn mới
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    
    // Khởi tạo chat khi mở lần đầu
    if (!isOpen && messages.length === 0) {
      initializeChat();
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
    if (!inputMessage.trim() || isStreaming) return;
    
    const message = inputMessage;
    setInputMessage('');
    await sendMessage(message);
  };

  // Không hiển thị nếu không được phép trên trang này
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
            <div className="header-buttons">
              <button onClick={toggleChat} className="close-button" title="Đóng">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>
          
          <div className="chatbot-messages">
            {messages.map((msg: Message, index: number) => (
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
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
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
