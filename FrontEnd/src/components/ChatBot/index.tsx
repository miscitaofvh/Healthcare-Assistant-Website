import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './ChatBot.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPaperPlane, faSave } from '@fortawesome/free-solid-svg-icons';
import mainLogo from '../../assets/images/Logo/main_logo.png';
import ReactMarkdown from 'react-markdown';
import { streamChatMessage, saveChatHistory } from '../../utils/service/chat';

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
  const [showTitleDialog, setShowTitleDialog] = useState<boolean>(false);
  const [conversationTitle, setConversationTitle] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { user } = useAuth();

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
          content: 'Xin lỗi, tôi đã gặp lỗi. Vui lòng thử lại sau.'
        }
      ]);
      setIsStreaming(false);
      setCurrentStreamingIndex(null);
    }
  };

  const handleSaveChat = () => {
    if (!user) {
      alert('Bạn cần đăng nhập để lưu lịch sử trò chuyện.');
      return;
    }
    
    // Generate default title from first user message
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    const defaultTitle = firstUserMessage 
      ? firstUserMessage.content.substring(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '') 
      : 'Cuộc trò chuyện mới';
    
    setConversationTitle(defaultTitle);
    setShowTitleDialog(true);
  };

  // Add new method to handle actual saving with title
  const handleSaveWithTitle = async () => {
    if (!conversationTitle.trim()) {
      alert('Vui lòng nhập tiêu đề cho cuộc trò chuyện.');
      return;
    }

    setIsSaving(true);
    try {
      await saveChatHistory(messages, conversationTitle);
      setShowTitleDialog(false);
      setIsSaving(false);
      alert('Lịch sử trò chuyện đã được lưu thành công!');
    } catch (error) {
      console.error('Error saving chat history:', error);
      setIsSaving(false);
      alert('Không thể lưu lịch sử trò chuyện. Vui lòng thử lại sau.');
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
            <div className="header-buttons">
              {user && (
                <button className="save-button" onClick={handleSaveChat} title="Save chat">
                  <FontAwesomeIcon icon={faSave} />
                </button>
              )}
              <button className="close-button" onClick={toggleChat}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
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
      
      {/* Title Dialog */}
      {showTitleDialog && (
        <div className="chatbot-title-dialog">
          <div className="title-dialog-content">
            <h3>Lưu cuộc trò chuyện</h3>
            <p>Nhập tiêu đề cho cuộc trò chuyện:</p>
            <input 
              type="text" 
              value={conversationTitle}
              onChange={(e) => setConversationTitle(e.target.value)}
              placeholder="Nhập tiêu đề..."
              maxLength={255}
            />
            <div className="title-dialog-buttons">
              <button 
                onClick={() => setShowTitleDialog(false)}
                disabled={isSaving}
                className="cancel-button"
              >
                Hủy
              </button>
              <button 
                onClick={handleSaveWithTitle}
                disabled={!conversationTitle.trim() || isSaving}
                className="save-button"
              >
                {isSaving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
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
