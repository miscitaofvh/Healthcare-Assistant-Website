import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getChatHistory, deleteChat, updateConversationTitle } from '../../utils/service/chat';
import Navbar from '../../components/Navbar';
import './ChatHistory.css';

// Định nghĩa kiểu dữ liệu cho cuộc trò chuyện
interface Conversation {
  conversation_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const ChatHistory = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState<string>("");
  const { user } = useAuth();
  const navigate = useNavigate();

  // Lấy lịch sử chat khi component được tải
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!user) {
        navigate('/');
        return;
      }

      try {
        setLoading(true);
        const history = await getChatHistory();
        setConversations(history || []);
      } catch (err) {
        console.error('Error fetching chat history:', err);
        setError('Không thể tải lịch sử chat. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchChatHistory();
  }, [user, navigate]);

  // Xử lý xóa cuộc hội thoại
  const handleDeleteConversation = async (conversationId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này?')) {
      try {
        await deleteChat(conversationId);
        setConversations(conversations.filter(
          conv => conv.conversation_id !== conversationId
        ));
      } catch (err) {
        console.error('Error deleting conversation:', err);
        setError('Không thể xóa cuộc trò chuyện. Vui lòng thử lại sau.');
      }
    }
  };

  // Bắt đầu chỉnh sửa tiêu đề
  const startEditing = (conversationId: string, currentTitle: string) => {
    setEditingTitle(conversationId);
    setNewTitle(currentTitle);
  };

  // Lưu tiêu đề mới
  const saveNewTitle = async (conversationId: string) => {
    if (newTitle.trim() === '') return;
    
    try {
      await updateConversationTitle(conversationId, newTitle);
      
      setConversations(conversations.map(conv => 
        conv.conversation_id === conversationId 
          ? { ...conv, title: newTitle } 
          : conv
      ));
      
      setEditingTitle(null);
    } catch (err) {
      console.error('Error updating title:', err);
      setError('Không thể cập nhật tiêu đề. Vui lòng thử lại sau.');
    }
  };

  // Format ngày tháng
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Navbar />
      <div className="chat-history-container">
        <h1>Lịch sử trò chuyện</h1>
        
        {loading && <p className="loading">Đang tải lịch sử...</p>}
        
        {error && <p className="error">{error}</p>}
        
        {!loading && conversations.length === 0 && (
          <div className="empty-history">
            <p>Bạn chưa có cuộc trò chuyện nào được lưu.</p>
            <Link to="/" className="new-chat-button">Bắt đầu cuộc trò chuyện mới</Link>
          </div>
        )}
        
        {!loading && conversations.length > 0 && (
          <div className="conversation-list">
            {conversations.map((conversation) => (
              <div key={conversation.conversation_id} className="conversation-item">
                <div className="conversation-header">
                  {editingTitle === conversation.conversation_id ? (
                    <div className="edit-title">
                      <input 
                        type="text" 
                        value={newTitle} 
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveNewTitle(conversation.conversation_id)}
                        autoFocus
                      />
                      <button onClick={() => saveNewTitle(conversation.conversation_id)}>Lưu</button>
                      <button onClick={() => setEditingTitle(null)}>Hủy</button>
                    </div>
                  ) : (
                    <h3 onClick={() => startEditing(conversation.conversation_id, conversation.title)}>
                      {conversation.title}
                      <span className="edit-icon">✏️</span>
                    </h3>
                  )}
                  
                  <div className="conversation-actions">
                    <Link 
                      to={`/user/chat/${conversation.conversation_id}`} 
                      className="view-button"
                    >
                      Xem
                    </Link>
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteConversation(conversation.conversation_id)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
                
                <div className="conversation-meta">
                  <span>Tạo lúc: {formatDate(conversation.created_at)}</span>
                  <span>Cập nhật: {formatDate(conversation.updated_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ChatHistory;