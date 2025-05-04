import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getChatHistory, deleteChat, updateConversationTitle, getChatById } from '../../utils/service/chat';
import Navbar from '../../components/Navbar';
import ReactMarkdown from 'react-markdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faComments } from '@fortawesome/free-solid-svg-icons';
import styles from './ChatHistory.module.css';

// Interface for conversation list items
interface Conversation {
  conversation_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

// Interface for chat message
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Interface for chat detail data
interface ChatDetailData {
  conversation_id: string;
  title: string;
  messages: ChatMessage[];
}

const ChatHistory = () => {
  // State for the conversation list
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for currently selected conversation
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [chatData, setChatData] = useState<ChatDetailData | null>(null);
  const [loadingChat, setLoadingChat] = useState<boolean>(false);
  
  // State for editing conversation titles
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch conversation list on component mount
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        const history = await getChatHistory();
        setConversations(history || []);
        
        // If there are conversations, select the first one by default
        if (history && history.length > 0) {
          setSelectedConversation(history[0].conversation_id);
          fetchChatDetail(history[0].conversation_id);
        }
      } catch (err) {
        console.error('Error fetching chat history:', err);
        setError('Không thể tải lịch sử chat. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchChatHistory();
  }, [user, navigate]);

  // Fetch chat details when a conversation is selected
  const fetchChatDetail = async (conversationId: string) => {
    if (!conversationId) return;
    
    try {
      setLoadingChat(true);
      const data = await getChatById(conversationId);
      
      // Check data validity
      if (!data || !data.messages || !Array.isArray(data.messages)) {
        throw new Error('Dữ liệu chat không hợp lệ');
      }
      
      setChatData(data);
    } catch (err) {
      console.error('Error fetching chat details:', err);
      setError('Không thể tải nội dung cuộc trò chuyện. Vui lòng thử lại sau.');
    } finally {
      setLoadingChat(false);
    }
  };

  // Handle conversation selection
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    fetchChatDetail(conversationId);
  };

  // Handle delete conversation
  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation(); // Prevent selecting the conversation
    
    if (window.confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này?')) {
      try {
        await deleteChat(conversationId);
        
        // Remove from conversation list
        setConversations(conversations.filter(
          conv => conv.conversation_id !== conversationId
        ));
        
        // If currently selected conversation was deleted
        if (selectedConversation === conversationId) {
          setSelectedConversation(null);
          setChatData(null);
        }
      } catch (err) {
        console.error('Error deleting conversation:', err);
        setError('Không thể xóa cuộc trò chuyện. Vui lòng thử lại sau.');
      }
    }
  };

  // Open edit title modal
  const openEditModal = (e: React.MouseEvent, conversationId: string, currentTitle: string) => {
    e.stopPropagation(); // Prevent selecting the conversation
    setEditingId(conversationId);
    setEditingTitle(currentTitle);
    setIsEditModalOpen(true);
  };

  // Close edit title modal
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingId(null);
    setEditingTitle("");
  };

  // Save edited title
  const saveTitle = async () => {
    if (!editingId || editingTitle.trim() === '') return;
    
    try {
      await updateConversationTitle(editingId, editingTitle);
      
      // Update conversation list
      setConversations(conversations.map(conv => 
        conv.conversation_id === editingId 
          ? { ...conv, title: editingTitle } 
          : conv
      ));
      
      // Update current chat data if this is the selected conversation
      if (chatData && chatData.conversation_id === editingId) {
        setChatData({
          ...chatData,
          title: editingTitle
        });
      }
      
      closeEditModal();
    } catch (err) {
      console.error('Error updating title:', err);
      setError('Không thể cập nhật tiêu đề. Vui lòng thử lại sau.');
    }
  };

  // Format date
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

  // Check if user is logged in
  if (!user) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        {/* Left Sidebar - Conversation List */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Lịch sử trò chuyện</h2>
            <Link to="/" className={styles.newChatButton}>
              Cuộc trò chuyện mới
            </Link>
          </div>
          
          {loading && <p className={styles.loading}>Đang tải...</p>}
          {error && <p className={styles.error}>{error}</p>}
          
          {!loading && conversations.length === 0 && (
            <div className={styles.emptyState}>
              <FontAwesomeIcon icon={faComments} className={styles.emptyIcon} />
              <h3>Chưa có cuộc trò chuyện</h3>
              <p>Bắt đầu trò chuyện mới để nhận hỗ trợ y tế.</p>
            </div>
          )}
          
          {!loading && conversations.length > 0 && (
            <div className={styles.conversationList}>
              {conversations.map((conversation) => (
                <div 
                  key={conversation.conversation_id}
                  className={`${styles.conversationItem} ${selectedConversation === conversation.conversation_id ? styles.activeConversation : ''}`}
                  onClick={() => handleSelectConversation(conversation.conversation_id)}
                >
                  <h3 className={styles.conversationTitle}>
                    {conversation.title || 'Cuộc trò chuyện không có tiêu đề'}
                  </h3>
                  
                  <div className={styles.conversationMeta}>
                    <span>{formatDate(conversation.updated_at)}</span>
                  </div>
                  
                  <div className={styles.conversationActions}>
                    <button 
                      className={`${styles.actionButton} ${styles.editButton}`}
                      onClick={(e) => openEditModal(e, conversation.conversation_id, conversation.title)}
                      title="Đổi tiêu đề"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button 
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      onClick={(e) => handleDeleteConversation(e, conversation.conversation_id)}
                      title="Xóa cuộc trò chuyện"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Main Content - Chat Display */}
        <div className={styles.main}>
          {!selectedConversation && (
            <div className={styles.emptyState}>
              <FontAwesomeIcon icon={faComments} className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>Chọn một cuộc trò chuyện</h3>
              <p className={styles.emptyText}>
                Chọn một cuộc trò chuyện từ danh sách bên trái để xem nội dung chi tiết.
              </p>
            </div>
          )}
          
          {selectedConversation && loadingChat && (
            <div className={styles.loading}>Đang tải cuộc trò chuyện...</div>
          )}
          
          {selectedConversation && !loadingChat && chatData && (
            <>
              <div className={styles.chatHeader}>
                <h2 className={styles.chatTitle}>{chatData.title || 'Cuộc trò chuyện không có tiêu đề'}</h2>
                <div className={styles.chatInfo}>
                  Cập nhật: {formatDate(chatData.messages[chatData.messages.length - 1]?.timestamp || '')}
                </div>
              </div>
              
              <div className={styles.chatContent}>
                {chatData.messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`${styles.message} ${message.role === 'user' ? styles.userMessage : styles.assistantMessage}`}
                  >
                    <div 
                      className={`${styles.messageBubble} ${
                        message.role === 'user' ? styles.userMessageBubble : styles.assistantMessageBubble
                      }`}
                    >
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                    <div 
                      className={`${styles.messageTime} ${
                        message.role === 'user' ? styles.userMessageTime : styles.assistantMessageTime
                      }`}
                    >
                      {formatDate(message.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Edit Title Modal */}
      {isEditModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalHeader}>Đổi tiêu đề cuộc trò chuyện</h3>
            <form className={styles.modalForm} onSubmit={(e) => { e.preventDefault(); saveTitle(); }}>
              <input
                type="text"
                className={styles.modalInput}
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                placeholder="Nhập tiêu đề mới"
                autoFocus
              />
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className={`${styles.modalButton} ${styles.cancelButton}`}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`${styles.modalButton} ${styles.saveButton}`}
                  disabled={editingTitle.trim() === ''}
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatHistory;