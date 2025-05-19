import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHistory, FaPlus, FaSearch } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Navbar from '../../components/Navbar';
import MedicalRecordForm from './components/MedicalRecordForm';
import MedicalRecordList from './components/MedicalRecordList';

// Hooks & Services
import { useMedicalRecords } from '../../hooks/useMedicalRecords';
import { useAuth } from '../../contexts/AuthContext';

// Types
import { MedicalRecord, MedicalRecordFormData } from '../../types/medicalRecord';

// Utils
import { defaultFormData, validateMedicalRecordForm } from './medicalHistoryUtils';

// Styles
import styles from './MedicalHistory.module.css';

const MedicalHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();  const { 
    records, 
    loading, 
    error, 
    success, 
    pagination, 
    page, 
    setPage, 
    setError, 
    setSuccess,
    addRecord,
    updateRecord
  } = useMedicalRecords();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<MedicalRecord | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState<MedicalRecordFormData>(defaultFormData);
  const [searchQuery, setSearchQuery] = useState('');

  // Kiểm tra xác thực người dùng
  if (!user) {
    navigate('/');
    return null;
  }

  // Hàm mở modal thêm mới
  const openAddModal = useCallback(() => {
    setFormData(defaultFormData);
    setIsEditMode(false);
    setCurrentRecord(null);
    setIsModalOpen(true);
  }, []);

  // Hàm mở modal chỉnh sửa
  const openEditModal = useCallback((record: MedicalRecord) => {
    setFormData({
      record_date: record.record_date || '',
      diagnosis: record.diagnosis || '',
      symptoms: record.symptoms || '',
      treatments: record.treatments || '',
      medications: record.medications || '',
      doctor_name: record.doctor_name || '',
      hospital: record.hospital || '',
      notes: record.notes || '',
      record_type: record.record_type || 'checkup',
    });
    setIsEditMode(true);
    setCurrentRecord(record);
    setIsModalOpen(true);
  }, []);

  // Hàm đóng modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setFormData(defaultFormData);
    setError('');
    setSuccess('');
  }, [setError, setSuccess]);

  // Hàm xử lý submit form
  const handleSubmit = useCallback(async (e: React.FormEvent, formData: MedicalRecordFormData) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate form
    const validationError = validateMedicalRecordForm(formData);
    if (validationError) {
      toast.error(validationError);
      setError(validationError);
      return;
    }

    if (isEditMode && currentRecord) {
      // Cập nhật hồ sơ
      const success = await updateRecord(currentRecord.record_id || '', {
        ...currentRecord,
        ...formData
      });
      
      if (success) {
        closeModal();
        toast.success('Hồ sơ bệnh án đã được cập nhật thành công!');
      }
    } else {
      // Thêm hồ sơ mới
      const success = await addRecord(formData);
      
      if (success) {
        closeModal();
        toast.success('Hồ sơ bệnh án đã được thêm thành công!');
      }
    }
  }, [isEditMode, currentRecord, updateRecord, addRecord, closeModal, setError, setSuccess]);  // Note: Delete functionality has been removed as medical records should never be deleted

  // Lọc hồ sơ dựa theo loại và tìm kiếm
  const filteredRecords = records.filter(record => {
    // Lọc theo tab
    if (activeTab !== 'all' && record.record_type !== activeTab) {
      return false;
    }
    
    // Lọc theo tìm kiếm
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      return (
        (record.diagnosis && record.diagnosis.toLowerCase().includes(query)) ||
        (record.symptoms && record.symptoms.toLowerCase().includes(query)) ||
        (record.doctor_name && record.doctor_name.toLowerCase().includes(query)) ||
        (record.hospital && record.hospital.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  // Render các nút phân trang
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          className={`${styles.paginationButton} ${i === page ? styles.paginationActive : ''}`}
          onClick={() => setPage(i)}
        >
          {i}
        </button>
      );
    }
    
    return buttons;
  };
  return (
    <div>
      <Navbar />
      <div className={styles.container}>
        <ToastContainer position="top-right" autoClose={3000} />
        
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Lịch Sử Y Tế</h1>
            <p className={styles.pageSubtitle}>Quản lý và theo dõi hồ sơ bệnh án của bạn</p>
          </div>
        </div>
          {/* Tab navigation */}
        <div className={styles.tabs}>
          <div 
            className={`${styles.tab} ${activeTab === 'all' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <FaHistory className={styles.icon} /> Tất cả
          </div>
          <div 
            className={`${styles.tab} ${activeTab === 'checkup' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('checkup')}
          >
            Khám thông thường
          </div>
          <div 
            className={`${styles.tab} ${activeTab === 'hospitalization' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('hospitalization')}
          >
            Nhập viện
          </div>
          <div 
            className={`${styles.tab} ${activeTab === 'surgery' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('surgery')}
          >
            Phẫu thuật
          </div>
          <div 
            className={`${styles.tab} ${activeTab === 'other' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('other')}
          >
            Khác
          </div>
        </div>
        
        {/* Search and Add section */}        <div className={styles.contentSection}>
          <div className={styles.searchAddContainer}>
            <div className={styles.searchContainer}>
              <input 
                type="text" 
                placeholder="Tìm kiếm hồ sơ bệnh án..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              <FaSearch className={styles.searchIcon} />
            </div>
            <button 
              className={`${styles.button} ${styles.primaryButton}`} 
              onClick={openAddModal}
            >
              <FaPlus /> Thêm hồ sơ mới
            </button>
          </div>
          
          {/* Medical records list */}          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p className={styles.loadingText}>Đang tải hồ sơ bệnh án...</p>
            </div>
          ) : (
            <>
              {filteredRecords.length === 0 ? (
                <div className={styles.emptyState}>
                  <FaHistory className={styles.emptyStateIcon} />
                  <p className={styles.emptyStateText}>Không tìm thấy hồ sơ bệnh án nào</p>
                  <button 
                    className={`${styles.button} ${styles.primaryButton}`} 
                    onClick={openAddModal}
                  >
                    <FaPlus /> Thêm hồ sơ mới
                  </button>
                </div>
              ) : (
                <>
                  <MedicalRecordList 
                    records={filteredRecords} 
                    onEdit={openEditModal} 
                  />
                  
                  {pagination.totalPages > 1 && (
                    <div className={styles.pagination}>
                      <button 
                        className={`${styles.paginationButton} ${styles.paginationArrow}`}
                        onClick={() => setPage(1)} 
                        disabled={page === 1}
                      >
                        &laquo;
                      </button>
                      <button 
                        className={`${styles.paginationButton} ${styles.paginationArrow}`}
                        onClick={() => setPage(page - 1)} 
                        disabled={page === 1}
                      >
                        &lsaquo;
                      </button>
                      
                      {renderPaginationButtons()}
                      
                      <button 
                        className={`${styles.paginationButton} ${styles.paginationArrow}`}
                        onClick={() => setPage(page + 1)} 
                        disabled={page === pagination.totalPages}
                      >
                        &rsaquo;
                      </button>
                      <button 
                        className={`${styles.paginationButton} ${styles.paginationArrow}`}
                        onClick={() => setPage(pagination.totalPages)} 
                        disabled={page === pagination.totalPages}
                      >
                        &raquo;
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Modal for adding/editing record */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {isEditMode ? 'Chỉnh sửa hồ sơ bệnh án' : 'Thêm hồ sơ bệnh án mới'}
              </h2>
              <button className={styles.closeButton} onClick={closeModal}>&times;</button>
            </div>
            
            {error && (
              <div className={`${styles.alert} ${styles.alertError}`}>
                {error}
              </div>
            )}
            
            {success && (
              <div className={`${styles.alert} ${styles.alertSuccess}`}>
                {success}
              </div>
            )}
            
            <MedicalRecordForm
              initialData={formData}
              isEditMode={isEditMode}
              onSubmit={handleSubmit}
              onCancel={closeModal}
              error={error}
              success={success}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalHistory;
