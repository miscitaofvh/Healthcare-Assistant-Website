import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import { FaChartLine, FaCalendarAlt, FaPlus } from 'react-icons/fa';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Types
import { HealthRecord, FormData, SelectedMetricsType } from '../../types/healthTracking';

// Custom hooks
import { useHealthTracking } from '../../hooks/useHealthTracking';

// Utils
import { defaultFormData, validateHealthForm, prepareHealthData, calculateAge } from './healthTrackingUtils';

// Components
import HealthMetricForm from './components/HealthMetricForm';
import HealthMetricsChart from './components/HealthMetricsChart';
import LatestMetricsDisplay from './components/LatestMetricsDisplay';
import HistoryTable from './components/HistoryTable';

// Styles
import styles from './HealthTracking.module.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const HealthTracking = () => {
  const { user } = useAuth();
  const { 
    latestRecord, 
    records, 
    loading, 
    error, 
    success, 
    pagination, 
    page, 
    setPage, 
    setError, 
    setSuccess,
    addHealthRecord,
    updateHealthRecord,
    removeHealthRecord 
  } = useHealthTracking();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<HealthRecord | null>(null);
  const [activeTab, setActiveTab] = useState('latest');
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [selectedMetrics, setSelectedMetrics] = useState<SelectedMetricsType>({
    weight: true,
    heart_rate: true,
    blood_sugar: false,
    temperature: false,
    sleep_duration: false
  });
  const [timeFilter, setTimeFilter] = useState('all');

  // Calculate user age
  const userAge = calculateAge(user?.dob);

  // Form handlers
  const openEditModal = useCallback((record: HealthRecord) => {
    setFormData({
      weight: record.weight?.toString() || '',
      height: record.height?.toString() || '',
      blood_pressure: record.blood_pressure || '',
      heart_rate: record.heart_rate?.toString() || '',
      blood_sugar: record.blood_sugar?.toString() || '',
      temperature: record.temperature?.toString() || '',
      sleep_duration: record.sleep_duration?.toString() || '',
      calories_burned: record.calories_burned?.toString() || '',
      exercise_data: record.exercise_data || '',
    });
    setIsEditMode(true);
    setCurrentRecord(record);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setFormData(defaultFormData);
    setError('');
    setSuccess('');
  }, [setError, setSuccess]);
  const handleSubmit = useCallback(async (e: React.FormEvent, newFormData: FormData) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate form
    const validationError = validateHealthForm(newFormData);
    if (validationError) {
      toast.error(validationError);
      setError(validationError); // Keep for internal state
      return;
    }

    // Process form data
    const healthData = prepareHealthData(newFormData);

    try {
      let success: boolean;
      
      if (isEditMode && currentRecord?.tracking_id) {
        // Update record
        success = await updateHealthRecord(currentRecord.tracking_id, healthData);
        if (success) {
          toast.success('Cập nhật thông số sức khỏe thành công');
          setSuccess('Cập nhật thông số sức khỏe thành công'); // Keep for internal state
        }
      } else {
        // Create new record
        success = await addHealthRecord(healthData);
        if (success) {
          toast.success('Thêm mới thông số sức khỏe thành công');
          setSuccess('Thêm mới thông số sức khỏe thành công'); // Keep for internal state
        }
      }        if (success) {
          // Close modal immediately - no need to wait
          if (isModalOpen) {
            closeModal();
          }
          // Form reset is now handled by the HealthMetricForm component
        }
    } catch (err: any) {
      const errorMessage = err.message || 'Đã xảy ra lỗi khi lưu dữ liệu';
      toast.error(errorMessage);
      setError(errorMessage); // Keep for internal state
    }
  }, [isEditMode, currentRecord, addHealthRecord, updateHealthRecord, closeModal, isModalOpen]);  const handleDelete = useCallback(async (record: HealthRecord) => {
    if (!record.tracking_id || !window.confirm('Bạn có chắc chắn muốn xóa thông số sức khỏe này?')) {
      return;
    }
    
    try {
      // Call the removeHealthRecord function
      const success = await removeHealthRecord(record);
      
      if (success) {
        toast.success('Xóa thông số sức khỏe thành công');
        
        // Update UI state manually after successful deletion
        // Note: We'll also modify the removeHealthRecord function in useHealthTracking
        // to update state without reloading the page
      } else {
        toast.error('Không thể xóa thông số sức khỏe');
      }
    } catch (err: any) {
      toast.error(err.message || 'Đã xảy ra lỗi khi xóa dữ liệu');
    }
  }, [removeHealthRecord]);
  return (
    <>
      <Navbar />
      <ToastContainer position="top-right" autoClose={5000} />
      <div className={styles['health-tracking-container']}>
        <div className={styles['health-tracking-header']}>
          <h1 className={styles['health-tracking-title']}>Theo dõi sức khỏe</h1>
        </div>
        
        {loading ? (
          <div className={styles['loading-indicator']}>
            <div className={styles['spinner']}></div>
            <p>Đang tải dữ liệu sức khỏe...</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className={styles['health-tabs']}>
              <div 
                className={`${styles['health-tab']} ${activeTab === 'latest' ? styles.active : ''}`} 
                onClick={() => setActiveTab('latest')}
              >
                <FaChartLine /> Thông số mới nhất
              </div>
              <div 
                className={`${styles['health-tab']} ${activeTab === 'history' ? styles.active : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <FaCalendarAlt /> Lịch sử thông số
              </div>
              <div 
                className={`${styles['health-tab']} ${activeTab === 'add' ? styles.active : ''}`}
                onClick={() => setActiveTab('add')}
              >
                <FaPlus /> Nhập thông số mới
              </div>
            </div>
            
            {/* Tab: Thông số mới nhất */}
            <div className={`${styles['tab-content']} ${activeTab === 'latest' ? styles.active : ''}`}>
              <h2 className={styles['health-section-title']}>Thông số mới nhất</h2>
              
              <LatestMetricsDisplay 
                latestRecord={latestRecord} 
                userAge={userAge} 
              />
              
              {records.length > 0 && (
                <HealthMetricsChart 
                  records={records}
                  timeFilter={timeFilter}
                  selectedMetrics={selectedMetrics}
                  setTimeFilter={setTimeFilter}
                  setSelectedMetrics={setSelectedMetrics}
                />
              )}
            </div>

            {/* Tab: Lịch sử thông số */}
            <div className={`${styles['tab-content']} ${activeTab === 'history' ? styles.active : ''}`}>
              <h2 className={styles['health-section-title']}>Lịch sử thông số sức khỏe</h2>
              
              <HistoryTable 
                records={records} 
                pagination={pagination} 
                page={page} 
                setPage={setPage} 
                onEdit={openEditModal} 
                onDelete={handleDelete} 
              />
            </div>
            
            {/* Tab: Nhập thông số mới */}
            <div className={`${styles['tab-content']} ${activeTab === 'add' ? styles.active : ''}`}>
              <div className={styles['tab-content-inner']}>
                <h2>Nhập thông số mới</h2>                <HealthMetricForm 
                  initialData={formData}
                  isEditMode={false}
                  onSubmit={handleSubmit}
                  error={error}
                  success={success}
                  resetAfterSubmit={true}
                />
              </div>
            </div>
          </>
        )}
        
        {/* Edit Modal */}
        {isModalOpen && isEditMode && (
          <div className={styles['modal']}>
            <div className={styles['modal-content']}>
              <div className={styles['modal-header']}>
                <h2 className={styles['modal-title']}>Cập nhật thông số sức khỏe</h2>
                <button className={styles['close-btn']} onClick={closeModal}>&times;</button>
              </div>              <HealthMetricForm 
                initialData={formData}
                isEditMode={true}
                onSubmit={handleSubmit}
                onCancel={closeModal}
                error={error}
                success={success}
                resetAfterSubmit={true}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default HealthTracking;