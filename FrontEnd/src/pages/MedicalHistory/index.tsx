import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaHeartbeat, 
  FaPlus, 
  FaSearch, 
  FaStethoscope, 
  FaPrescriptionBottleAlt,
  FaHospital,
  FaUserMd,
  FaSort,
  FaFileAlt
} from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Navbar from '../../components/Navbar';
import MedicalRecordForm from './components/MedicalRecordForm';
import CompactMedicalRecordCard from './components/CompactMedicalRecordCard';
import MedicalRecordDetailModal from './components/MedicalRecordDetailModal';

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
  const navigate = useNavigate();
  
  const { 
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
  const [sortBy, setSortBy] = useState<'date' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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

  // Hàm mở modal chi tiết
  const openDetailModal = useCallback((record: MedicalRecord) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  }, []);

  // Hàm đóng modal chi tiết
  const closeDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedRecord(null);
  }, []);

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
  }, [isEditMode, currentRecord, updateRecord, addRecord, closeModal, setError, setSuccess]);  // Lọc và sắp xếp hồ sơ
  const filteredAndSortedRecords = records
    .filter(record => {
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
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.record_date || '').getTime();
        const dateB = new Date(b.record_date || '').getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else {        const typeOrder = ['checkup', 'hospitalization', 'surgery', 'other'];
        const indexA = typeOrder.indexOf(a.record_type || 'other');
        const indexB = typeOrder.indexOf(b.record_type || 'other');
        return sortOrder === 'desc' ? indexB - indexA : indexA - indexB;
      }
    });

  const getTabCount = (tabType: string) => {
    if (tabType === 'all') return records.length;
    return records.filter(record => record.record_type === tabType).length;
  };

  return (
    <div>
      <Navbar />
      <div className={styles.container}>
        <ToastContainer position="top-right" autoClose={3000} />
          {/* Hero Section */}
        <div className={styles.heroSection}>
          <div className={styles.heroContent}>
            <div className={styles.heroText}>
              <h1 className={styles.heroTitle}>
                <FaHeartbeat className={styles.heroIcon} />
                Lịch Sử Y Tế
              </h1>
              <p className={styles.heroSubtitle}>
                Quản lý và theo dõi hành trình sức khỏe của bạn một cách dễ dàng và hiệu quả
              </p>
            </div>
            <button 
              className={styles.addButton}
              onClick={openAddModal}
            >
              <FaPlus className={styles.addIcon} />
              Thêm hồ sơ mới
            </button>
          </div>
          
          {/* Quick Stats */}
          <div className={styles.statsContainer}>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: '#10b981' }}>
                <FaStethoscope />
              </div>
              <div className={styles.statInfo}>
                <h3>{getTabCount('checkup')}</h3>
                <p>Khám thông thường</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: '#f59e0b' }}>
                <FaHospital />
              </div>
              <div className={styles.statInfo}>
                <h3>{getTabCount('hospitalization')}</h3>
                <p>Nhập viện</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: '#ef4444' }}>
                <FaUserMd />
              </div>
              <div className={styles.statInfo}>
                <h3>{getTabCount('surgery')}</h3>
                <p>Phẫu thuật</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: '#8b5cf6' }}>
                <FaPrescriptionBottleAlt />
              </div>
              <div className={styles.statInfo}>
                <h3>{records.filter(r => r.medications).length}</h3>
                <p>Có đơn thuốc</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className={styles.controlsSection}>
          <div className={styles.searchAndFilter}>
            <div className={styles.searchContainer}>
              <FaSearch className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Tìm kiếm theo chẩn đoán, triệu chứng, bác sĩ..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            
            <div className={styles.filterControls}>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as 'date' | 'type')}
                className={styles.filterSelect}
              >
                <option value="date">Sắp xếp theo ngày</option>
                <option value="type">Sắp xếp theo loại</option>
              </select>
              
              <button 
                className={styles.sortButton}
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                title={sortOrder === 'asc' ? 'Sắp xếp giảm dần' : 'Sắp xếp tăng dần'}
              >
                <FaSort />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className={styles.tabContainer}>            {[
              { key: 'all', label: 'Tất cả', icon: FaHeartbeat },
              { key: 'checkup', label: 'Khám thông thường', icon: FaStethoscope },
              { key: 'hospitalization', label: 'Nhập viện', icon: FaHospital },
              { key: 'surgery', label: 'Phẫu thuật', icon: FaUserMd },
              { key: 'other', label: 'Khác', icon: FaFileAlt }
            ].map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.key}
                  className={`${styles.tabButton} ${activeTab === tab.key ? styles.active : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <TabIcon />
                  <span>{tab.label}</span>
                  <span className={styles.tabCount}>{getTabCount(tab.key)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Section */}
        <div className={styles.contentSection}>          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p className={styles.loadingText}>Đang tải hồ sơ y tế...</p>
            </div>
          ) : filteredAndSortedRecords.length === 0 ? (
            <div className={styles.emptyContainer}>
              <FaFileAlt className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>
                {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có hồ sơ y tế nào'}
              </h3>
              <p className={styles.emptyMessage}>
                {searchQuery 
                  ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc'
                  : 'Hãy bắt đầu bằng cách thêm hồ sơ y tế đầu tiên của bạn'
                }
              </p>
              {!searchQuery && (
                <button 
                  className={styles.emptyButton}
                  onClick={openAddModal}
                >
                  <FaPlus /> Thêm hồ sơ đầu tiên
                </button>
              )}
            </div>
          ) : (            <>
              <div className={styles.recordsGrid}>
                {filteredAndSortedRecords.map((record) => (
                  <CompactMedicalRecordCard
                    key={record.record_id}
                    record={record}
                    onEdit={openEditModal}
                    onView={openDetailModal}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className={styles.paginationContainer}>
                  <div className={styles.paginationInfo}>
                    Hiển thị {filteredAndSortedRecords.length} / {pagination.totalRecords} hồ sơ
                  </div>
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
                    
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = i + Math.max(1, page - 2);
                      return pageNum <= pagination.totalPages ? (
                        <button
                          key={pageNum}
                          className={`${styles.paginationButton} ${pageNum === page ? styles.paginationActive : ''}`}
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      ) : null;
                    })}
                    
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
                </div>
              )}
            </>
          )}
        </div>
      </div>      {/* Modal for adding/editing record */}
      {isModalOpen && (
        <div 
          className={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}        >
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {isEditMode ? 'Chỉnh sửa hồ sơ bệnh án' : 'Thêm hồ sơ bệnh án mới'}
              </h2>
              <button className={styles.closeButton} onClick={closeModal}>&times;</button>
            </div>
            
            <div className={styles.modalContent}>
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
        </div>
      )}      {/* Detail Modal */}
      {isDetailModalOpen && selectedRecord && (
        <MedicalRecordDetailModal
          record={selectedRecord}
          isOpen={isDetailModalOpen}
          onClose={closeDetailModal}
          onEdit={openEditModal}
        />
      )}
    </div>
  );
};

export default MedicalHistory;
