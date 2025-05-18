import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import ReactMarkdown from 'react-markdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faComments, faChevronLeft, faList } from '@fortawesome/free-solid-svg-icons';
import styles from './ChatHistory.module.css';
import { 
  getChatHistory, 
  getChatById, 
  deleteChat, 
  updateConversationTitle 
} from '../../utils/api/chatbotApi';
import { ChatConversation, ChatDetailData } from '../../types/chat';

const ChatHistory = () => {
  // State cho danh sách cuộc trò chuyện
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State cho cuộc trò chuyện đang chọn
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [chatData, setChatData] = useState<ChatDetailData | null>(null);
  const [loadingChat, setLoadingChat] = useState<boolean>(false);
  
  // State cho việc chỉnh sửa tiêu đề
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // State cho Mobile View
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  // Lấy danh sách cuộc trò chuyện khi component mount
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!user) {
        navigate('/', { state: { from: '/user/chat-history' } });
        return;
      }

      try {
        setLoading(true);
        const history = await getChatHistory();
        setConversations(history || []);
        
        // Nếu có cuộc trò chuyện, chọn cuộc trò chuyện đầu tiên mặc định
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

  const fetchChatDetail = async (conversationId: string) => {
    if (!conversationId) return;
    
    try {
      setLoadingChat(true);
      const data = await getChatById(conversationId);
      
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
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    fetchChatDetail(conversationId);
    
    // On mobile, switch to chat view after selecting a conversation
    if (window.innerWidth <= 768) {
      setShowSidebar(false);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation(); 
    
    if (window.confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này?')) {
      try {
        await deleteChat(conversationId);
        
        setConversations(conversations.filter(
          conv => conv.conversation_id !== conversationId
        ));
        
        // Nếu đang xem cuộc trò chuyện đó, xóa khỏi view
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

  const openEditModal = (e: React.MouseEvent, conversationId: string, currentTitle: string) => {
    e.stopPropagation(); 
    setEditingId(conversationId);
    setEditingTitle(currentTitle);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingId(null);
    setEditingTitle("");
  };

  const saveTitle = async () => {
    if (!editingId || editingTitle.trim() === '') return;
    
    try {
      await updateConversationTitle(editingId, editingTitle);
      
      setConversations(conversations.map(conv => 
        conv.conversation_id === editingId 
          ? { ...conv, title: editingTitle } 
          : conv
      ));
      
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
    return <div>Đang chuyển hướng đến trang đăng nhập...</div>;
  }

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        {/* Mobile Navigation Toggle */}        
        <div className={styles.mobileNavToggle}>
          <button 
            className={styles.toggleButton}
            onClick={() => setShowSidebar(!showSidebar)}
          >
            {showSidebar ? (
              <>
                <FontAwesomeIcon icon={faComments} /> Xem cuộc trò chuyện
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faList} /> Danh sách trò chuyện
              </>
            )}
          </button>
        </div>
        
        {/* Sidebar bên trái - Danh sách cuộc trò chuyện */}
        <div className={`${styles.sidebar} ${!showSidebar ? styles.hiddenOnMobile : ''}`}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Lịch sử trò chuyện</h2>
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
        
        {/* Nội dung chính - Chi tiết cuộc trò chuyện */}
        <div className={`${styles.main} ${showSidebar ? styles.hiddenOnMobile : ''}`}>
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
              <div className={styles.chatHeader}>                <button 
                  className={styles.backButton}
                  onClick={() => setShowSidebar(true)}
                  title="Quay lại danh sách"
                  aria-label="Quay lại danh sách"
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                <div className={styles.chatHeaderContent}>
                  <h2 className={styles.chatTitle}>{chatData.title || 'Cuộc trò chuyện không có tiêu đề'}</h2>
                  <div className={styles.chatInfo}>
                    Cập nhật: {formatDate(chatData.messages[chatData.messages.length - 1]?.timestamp || '')}
                  </div>
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
      
      {/* Modal chỉnh sửa tiêu đề */}
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