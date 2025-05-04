import React, { useState, useEffect, ErrorInfo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getChatById } from '../../utils/service/chat';
import Navbar from '../../components/Navbar';
import ReactMarkdown from 'react-markdown';
import './ChatDetail.css';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Interface này phản ánh cấu trúc dữ liệu thực tế từ API
interface ChatDetailData {
  conversation_id: string;
  title: string;
  messages: ChatMessage[];
}

// Component xử lý lỗi
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ChatDetail error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Đã xảy ra lỗi khi hiển thị cuộc trò chuyện.</h2>
          <button onClick={() => window.location.href = '/user/chat-history'}>
            Quay lại danh sách chat
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const ChatDetail = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const [chatData, setChatData] = useState<ChatDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChatDetail = async () => {
      if (!user || !chatId) {
        navigate('/user/chat-history');
        return;
      }

      try {
        setLoading(true);
        const data = await getChatById(chatId);
        
        // Kiểm tra dữ liệu trước khi set state
        if (!data || !data.messages || !Array.isArray(data.messages)) {
          throw new Error('Dữ liệu chat không hợp lệ');
        }
        
        setChatData(data);
      } catch (err) {
        console.error('Error fetching chat details:', err);
        setError('Không thể tải nội dung cuộc trò chuyện. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchChatDetail();
  }, [chatId, user, navigate]);

  // Format ngày tháng
  const formatDate = (dateString: string) => {
    if (!dateString) {
      return 'Không có thông tin';
    }
    
    try {
      const date = new Date(dateString);
      
      // Kiểm tra ngày hợp lệ
      if (isNaN(date.getTime())) {
        return 'Không có thông tin';
      }
      
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(date);
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Không có thông tin';
    }
  };
  
  // Lấy thời gian tạo và cập nhật từ các tin nhắn
  const getCreatedDate = () => {
    if (!chatData || !chatData.messages || chatData.messages.length === 0) {
      return 'Không có thông tin';
    }
    // Lấy timestamp từ tin nhắn đầu tiên làm thời gian tạo
    const firstMessage = chatData.messages[0];
    return formatDate(firstMessage.timestamp);
  };

  const getUpdatedDate = () => {
    if (!chatData || !chatData.messages || chatData.messages.length === 0) {
      return 'Không có thông tin';
    }
    // Lấy timestamp từ tin nhắn cuối cùng làm thời gian cập nhật
    const lastMessage = chatData.messages[chatData.messages.length - 1];
    return formatDate(lastMessage.timestamp);
  };

  if (!user) {
    return null;
  }

  return (
    <ErrorBoundary>
      <Navbar />
      <div className="chat-detail-container">
        <div className="chat-detail-header">
          <Link to="/user/chat-history" className="back-button">
            &larr; Quay lại lịch sử
          </Link>
          
          {!loading && chatData && (
            <h1>{chatData.title || 'Cuộc trò chuyện không có tiêu đề'}</h1>
          )}
        </div>

        {loading && <p className="loading">Đang tải cuộc trò chuyện...</p>}
        
        {error && <p className="error">{error}</p>}
        
        {!loading && chatData && (
          <>
            <div className="chat-meta">
              <p>Tạo lúc: {getCreatedDate()}</p>
              <p>Cập nhật lần cuối: {getUpdatedDate()}</p>
            </div>
            
            <div className="chat-messages">
              {chatData.messages && Array.isArray(chatData.messages) && chatData.messages.map((msg, index) => (
                <div 
                  key={index}
                  className={`chat-message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}
                >
                  <div className="message-content">
                    <ReactMarkdown>{msg.content || ''}</ReactMarkdown>
                  </div>
                  <div className="message-time">
                    {msg.timestamp ? formatDate(msg.timestamp) : ''}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default ChatDetail;