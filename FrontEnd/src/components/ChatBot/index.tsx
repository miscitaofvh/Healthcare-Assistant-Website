import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useLocation } from 'react-router-dom';
import './ChatBot.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faTimes, faImage } from '@fortawesome/free-solid-svg-icons';
import mainLogo from '../../assets/images/Logo/main_logo.png';
import ReactMarkdown from 'react-markdown';
import useChatbot from '../../hooks/useChatbot';
import { Message } from '../../types/chat';

const ChatBot: React.FC = () => {  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
    const {
    messages,
    isStreaming,
    isUploading,
    currentStreamingIndex,
    error,
    initializeChat,
    sendMessage,
    uploadImage
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
    if (!inputMessage.trim() || isStreaming || isUploading) return;
    
    const message = inputMessage;
    setInputMessage('');
    await sendMessage(message);
  };
  
  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || isStreaming || isUploading) return;
    
    const file = e.target.files[0];
    
    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      alert('Chỉ chấp nhận file ảnh JPG, JPEG và PNG');
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 5MB');
      return;
    }    try {
      // Upload the skin image
      await uploadImage(file);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Lỗi khi tải lên ảnh:', error);
    }
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
          </div>            <div className="chatbot-messages">
            {messages.map((msg: Message, index: number) => (
              <div 
                key={index} 
                className={`message ${msg.role === 'user' ? 'user-message' : 'bot-message'} 
                           ${index === currentStreamingIndex ? 'streaming' : ''}`}
              >
                <div className="message-content">
                  {msg.image_url && (
                    <div className="message-image">
                      <img 
                        src={msg.image_url} 
                        alt="Uploaded image" 
                        className="uploaded-image"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  {index === currentStreamingIndex && <span className="streaming-cursor"></span>}
                </div>
              </div>
            ))}
            
            {/* Loading message during image processing */}
            {isUploading && (
              <div className="loading-message">
                <div className="loading-content">
                  <div className="loading-spinner"></div>
                  <span className="loading-text">Đang phân tích hình ảnh da của bạn...</span>
                </div>
              </div>
            )}
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>            <form onSubmit={handleSubmit} className="chatbot-input">
            {/* Upload progress indicator */}
            {isUploading && <div className="upload-progress"></div>}
            
            <input
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={isUploading ? "Đang xử lý hình ảnh..." : "Nhập câu hỏi của bạn..."}
              disabled={isStreaming || isUploading}
            />            <button 
              type="button"
              onClick={handleImageUploadClick}
              disabled={isStreaming || isUploading}
              className={`upload-button ${isUploading ? 'uploading' : ''}`}
              title={isUploading ? "Đang tải lên..." : "Tải lên ảnh da để phân tích"}
            >
              <FontAwesomeIcon icon={faImage} />
            </button>
            <button 
              type="submit" 
              disabled={isStreaming || isUploading || !inputMessage.trim()}
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/jpg,image/png" 
              style={{ display: 'none' }}
            />
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
