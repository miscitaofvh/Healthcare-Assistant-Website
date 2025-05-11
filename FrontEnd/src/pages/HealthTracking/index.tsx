import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getLatestHealthRecord, 
  createHealthRecord, 
  updateHealthRecord, 
  deleteHealthRecord,
  getHealthRecords,
  getWeightStatus,
  getBloodPressureStatus,
  getHeartRateStatus,
  getBloodSugarStatus,
  getTemperatureStatus,
  getSleepStatus,
  type HealthRecord,
} from '../../utils/service/healthTracking';
import { FaWeight, FaRuler, FaHeartbeat, FaThermometerHalf, FaBed, FaFire, FaTint, FaTrash, FaEdit, FaPlus, FaChartLine, FaCalendarAlt, FaExclamationCircle, FaCheckCircle, FaQuestionCircle } from 'react-icons/fa';
import Navbar from '../../components/Navbar';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { format } from 'date-fns';
import styles from './HealthTracking.module.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const HealthTracking = () => {
  const { user } = useAuth();
  const [latestRecord, setLatestRecord] = useState<HealthRecord | null>(null);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<HealthRecord | null>(null);
  const [activeTab, setActiveTab] = useState('latest');
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    blood_pressure: '',
    heart_rate: '',
    blood_sugar: '',
    temperature: '',
    sleep_duration: '',
    calories_burned: '',
    exercise_data: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    perPage: 10,
  });

  // Calculate age from user's DOB if available
  const calculateAge = (dob: string | undefined): number => {
    if (!dob) return 30; // Default age if DOB not available
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const userAge = calculateAge(user?.dob);

  // Fetch latest health record and records history
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get latest record
        const latestResponse = await getLatestHealthRecord();
        if (latestResponse.success && latestResponse.record) {
          setLatestRecord(latestResponse.record);
        }

        // Get records history
        const recordsResponse = await getHealthRecords(page, 10);
        if (recordsResponse.success) {
          setRecords(recordsResponse.records);
          setPagination(recordsResponse.pagination);
        }
      } catch (err) {
        console.error('Error fetching health data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, page]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      weight: '',
      height: '',
      blood_pressure: '',
      heart_rate: '',
      blood_sugar: '',
      temperature: '',
      sleep_duration: '',
      calories_burned: '',
      exercise_data: '',
    });
    setError('');
    setSuccess('');
  };
      const openEditModal = (record: HealthRecord) => {
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
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate form
    if (!formData.weight && !formData.height && !formData.blood_pressure && 
        !formData.heart_rate && !formData.blood_sugar && !formData.temperature && 
        !formData.sleep_duration && !formData.calories_burned) {
      setError('Vui lòng nhập ít nhất một thông số sức khỏe');
      return;
    }

    // Process form data
    const healthData: HealthRecord = {};
    if (formData.weight) healthData.weight = parseFloat(formData.weight);
    if (formData.height) healthData.height = parseFloat(formData.height);
    if (formData.blood_pressure) healthData.blood_pressure = formData.blood_pressure;
    if (formData.heart_rate) healthData.heart_rate = parseInt(formData.heart_rate);
    if (formData.blood_sugar) healthData.blood_sugar = parseFloat(formData.blood_sugar);
    if (formData.temperature) healthData.temperature = parseFloat(formData.temperature);
    if (formData.sleep_duration) healthData.sleep_duration = parseInt(formData.sleep_duration);
    if (formData.calories_burned) healthData.calories_burned = parseInt(formData.calories_burned);
    if (formData.exercise_data) healthData.exercise_data = formData.exercise_data;

    try {
      if (isEditMode && currentRecord?.tracking_id) {
        // Update record
        const response = await updateHealthRecord(currentRecord.tracking_id, healthData);
        if (response.success) {
          setSuccess('Cập nhật thông số sức khỏe thành công!');
          
          // Refresh data
          const latestResponse = await getLatestHealthRecord();
          if (latestResponse.success && latestResponse.record) {
            setLatestRecord(latestResponse.record);
          }
          
          const recordsResponse = await getHealthRecords(page, 10);
          if (recordsResponse.success) {
            setRecords(recordsResponse.records);
          }
          
          // Close modal after a delay
          setTimeout(() => {
            closeModal();
          }, 1500);
        } else {
          setError(response.message || 'Không thể cập nhật thông số sức khỏe');
        }
      } else {
        // Create new record
        const response = await createHealthRecord(healthData);
        if (response.success) {
          setSuccess('Thêm thông số sức khỏe thành công!');
          
          // Refresh data
          const latestResponse = await getLatestHealthRecord();
          if (latestResponse.success && latestResponse.record) {
            setLatestRecord(latestResponse.record);
          }
          
          const recordsResponse = await getHealthRecords(page, 10);
          if (recordsResponse.success) {
            setRecords(recordsResponse.records);
          }
          
          // Close modal after a delay
          setTimeout(() => {
            closeModal();
          }, 1500);
        } else {
          setError(response.message || 'Không thể thêm thông số sức khỏe');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi lưu dữ liệu');
    }
  };

  const handleDelete = async (record: HealthRecord) => {
    if (!record.tracking_id || !window.confirm('Bạn có chắc chắn muốn xóa thông số sức khỏe này?')) {
      return;
    }

    try {
      const response = await deleteHealthRecord(record.tracking_id);
      if (response.success) {
        // Refresh data
        const recordsResponse = await getHealthRecords(page, 10);
        if (recordsResponse.success) {
          setRecords(recordsResponse.records);
          setPagination(recordsResponse.pagination);
        }

        // Check if we need to update the latest record
        if (latestRecord?.tracking_id === record.tracking_id) {
          const latestResponse = await getLatestHealthRecord();
          if (latestResponse.success) {
            setLatestRecord(latestResponse.record);
          }
        }
      } else {
        alert(response.message || 'Không thể xóa thông số sức khỏe');
      }
    } catch (err: any) {
      alert(err.message || 'Đã xảy ra lỗi khi xóa dữ liệu');
    }
  };  // State để kiểm soát các thông số hiển thị trên biểu đồ
  const [selectedMetrics, setSelectedMetrics] = useState({
    weight: true,
    heart_rate: true,
    blood_sugar: false,
    temperature: false,
    sleep_duration: false
  });
  // State để lọc theo khoảng thời gian
  const [timeFilter, setTimeFilter] = useState('all');
  const [filteredRecords, setFilteredRecords] = useState<HealthRecord[]>(records);
  const [showChartHelp, setShowChartHelp] = useState(false);
  
  // Xử lý thay đổi thông số được chọn
  const toggleMetric = (metric: string) => {
    setSelectedMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric as keyof typeof prev]
    }));
  };

  // Lọc dữ liệu theo khoảng thời gian
  useEffect(() => {
    if (!records || records.length === 0) {
      setFilteredRecords([]);
      return;
    }

    const now = new Date();
    let filtered = [...records];

    if (timeFilter === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      filtered = records.filter(record => 
        record.recorded_at && new Date(record.recorded_at) >= sevenDaysAgo
      );
    } else if (timeFilter === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      filtered = records.filter(record => 
        record.recorded_at && new Date(record.recorded_at) >= thirtyDaysAgo
      );
    }

    setFilteredRecords(filtered);
  }, [records, timeFilter]);

  // Định nghĩa màu sắc và cách hiển thị cho các loại thông số
  const metricConfigs = {
    weight: {
      label: 'Cân nặng (kg)',
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
    },
    heart_rate: {
      label: 'Nhịp tim (bpm)',
      borderColor: 'rgb(54, 162, 235)',
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
    },
    blood_sugar: {
      label: 'Đường huyết (mmol/L)',
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
    },
    temperature: {
      label: 'Nhiệt độ (°C)',
      borderColor: 'rgb(255, 159, 64)',
      backgroundColor: 'rgba(255, 159, 64, 0.5)',
    },
    sleep_duration: {
      label: 'Thời gian ngủ (giờ)',
      borderColor: 'rgb(153, 102, 255)',
      backgroundColor: 'rgba(153, 102, 255, 0.5)',
    }
  };
  // Prepare data for the chart
  const chartData = {
    labels: filteredRecords.map(record => 
      record.recorded_at ? format(new Date(record.recorded_at), 'dd/MM/yyyy') : ''
    ).reverse(),
    datasets: Object.keys(selectedMetrics)
      .filter(key => selectedMetrics[key as keyof typeof selectedMetrics])
      .map(metric => ({
        label: metricConfigs[metric as keyof typeof metricConfigs].label,
        data: filteredRecords.map(record => record[metric as keyof HealthRecord] || null).reverse(),
        borderColor: metricConfigs[metric as keyof typeof metricConfigs].borderColor,
        backgroundColor: metricConfigs[metric as keyof typeof metricConfigs].backgroundColor,
        tension: 0.3, // Làm đường cong mềm mại hơn
        pointRadius: 4,
        pointHoverRadius: 7,
      })),
  };
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: 'Biểu đồ thông số sức khỏe qua thời gian',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#333',
        bodyColor: '#333',
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
        boxPadding: 8,
        borderColor: '#e0e0e0',
        borderWidth: 1,
        displayColors: true,
        usePointStyle: true,
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          tickLength: 8,
        },
        ticks: {
          padding: 8,
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          padding: 8,
          font: {
            size: 11
          }
        }
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    hover: {
      mode: 'nearest' as const,
      intersect: true
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    },
    maintainAspectRatio: false,
    elements: {
      line: {
        borderWidth: 2
      },
      point: {
        borderWidth: 1,
        hitRadius: 5
      }
    }
  };
  const renderAddForm = () => (
    <div className={styles['tab-content-inner']}>
      <h2>Nhập thông số mới</h2>
      <form onSubmit={handleSubmit}>
        <div className={styles['form-grid']}>
          <div className={styles['form-group']}>
            <label className={styles['form-label']} htmlFor="weight">
              <FaWeight className={styles['form-icon']} /> Cân nặng (kg)
            </label>
            <input
              type="number"
              id="weight"
              name="weight"
              className={styles['form-input']}
              placeholder="Ví dụ: 65"
              value={formData.weight}
              onChange={handleInputChange}
              step="0.1"
              min="1"
              max="500"
            />
          </div>

          <div className={styles['form-group']}>
            <label className={styles['form-label']} htmlFor="height">
              <FaRuler className={styles['form-icon']} /> Chiều cao (cm)
            </label>
            <input
              type="number"
              id="height"
              name="height"
              className={styles['form-input']}
              placeholder="Ví dụ: 170"
              value={formData.height}
              onChange={handleInputChange}
              step="0.1"
              min="10"
              max="300"
            />
          </div>

          <div className={styles['form-group']}>
            <label className={styles['form-label']} htmlFor="blood_pressure">
              <FaTint className={styles['form-icon']} /> Huyết áp (mmHg)
            </label>
            <input
              type="text"
              id="blood_pressure"
              name="blood_pressure"
              className={styles['form-input']}
              placeholder="Ví dụ: 120/80"
              value={formData.blood_pressure}
              onChange={handleInputChange}
              pattern="^\d{1,3}/\d{1,3}$"
              title="Nhập theo định dạng: 120/80"
            />
          </div>

          <div className={styles['form-group']}>
            <label className={styles['form-label']} htmlFor="heart_rate">
              <FaHeartbeat className={styles['form-icon']} /> Nhịp tim (BPM)
            </label>
            <input
              type="number"
              id="heart_rate"
              name="heart_rate"
              className={styles['form-input']}
              placeholder="Ví dụ: 75"
              value={formData.heart_rate}
              onChange={handleInputChange}
              min="30"
              max="250"
            />
          </div>

          <div className={styles['form-group']}>
            <label className={styles['form-label']} htmlFor="blood_sugar">
              <FaChartLine className={styles['form-icon']} /> Đường huyết (mmol/L)
            </label>
            <input
              type="number"
              id="blood_sugar"
              name="blood_sugar"
              className={styles['form-input']}
              placeholder="Ví dụ: 5.5"
              value={formData.blood_sugar}
              onChange={handleInputChange}
              step="0.1"
              min="1"
              max="50"
            />
          </div>

          <div className={styles['form-group']}>
            <label className={styles['form-label']} htmlFor="temperature">
              <FaThermometerHalf className={styles['form-icon']} /> Nhiệt độ cơ thể (°C)
            </label>
            <input
              type="number"
              id="temperature"
              name="temperature"
              className={styles['form-input']}
              placeholder="Ví dụ: 36.5"
              value={formData.temperature}
              onChange={handleInputChange}
              step="0.1"
              min="30"
              max="45"
            />
          </div>

          <div className={styles['form-group']}>
            <label className={styles['form-label']} htmlFor="sleep_duration">
              <FaBed className={styles['form-icon']} /> Thời gian ngủ (giờ)
            </label>
            <input
              type="number"
              id="sleep_duration"
              name="sleep_duration"
              className={styles['form-input']}
              placeholder="Ví dụ: 8"
              value={formData.sleep_duration}
              onChange={handleInputChange}
              min="0"
              max="24"
            />
          </div>

          <div className={styles['form-group']}>
            <label className={styles['form-label']} htmlFor="calories_burned">
              <FaFire className={styles['form-icon']} /> Calories đã đốt (kcal)
            </label>
            <input
              type="number"
              id="calories_burned"
              name="calories_burned"
              className={styles['form-input']}
              placeholder="Ví dụ: 500"
              value={formData.calories_burned}
              onChange={handleInputChange}
              min="0"
              max="10000"
            />
          </div>          <div className={`${styles['form-group']} ${styles['form-group-full']}`}>
            <label className={styles['form-label']} htmlFor="exercise_data">
              <FaCalendarAlt className={styles['form-icon']} /> Ghi chú hoạt động thể chất
            </label>
            <textarea
              id="exercise_data"
              name="exercise_data"
              className={styles['form-textarea']}
              placeholder="Mô tả các hoạt động thể chất của bạn (nếu có)"
              value={formData.exercise_data}
              onChange={handleInputChange}
            ></textarea>
          </div>
        </div>

        {error && (
          <div className={styles['error-message']}>
            <FaExclamationCircle /> {error}
          </div>
        )}
        {success && (
          <div className={styles['success-message']}>
            <FaCheckCircle /> {success}
          </div>
        )}

        <div className={styles['form-actions']}>
          <button type="submit" className={styles['submit-btn']}>
            {isEditMode ? 'Cập nhật' : 'Lưu thông tin'}
          </button>
        </div>
      </form>
    </div>
  );
  
  return (
    <>
      <Navbar />      <div className={styles['health-tracking-container']}>
        <div className={styles['health-tracking-header']}>
          <h1 className={styles['health-tracking-title']}>Theo dõi sức khỏe</h1>
        </div>        {loading ? (
          <div className={styles['loading-indicator']}>
            <div className={styles['spinner']}></div>
            <p>Đang tải dữ liệu sức khỏe...</p>
          </div>
        ) : (<>
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
            
            {/* Tab: Thông số mới nhất */}            <div className={`${styles['tab-content']} ${activeTab === 'latest' ? styles.active : ''}`}>
              <h2 className={styles['health-section-title']}>Thông số mới nhất</h2>
              <div className={styles['health-cards']}>
                {latestRecord ? (
                  <>
                    {latestRecord.weight && latestRecord.height && (                      <div className={styles['health-card']}>
                        <h3 className={styles['health-card-title']}>
                          <FaWeight /> Cân nặng & Chiều cao
                        </h3>
                        <div className={styles['health-card-value']}>
                          {latestRecord.weight} kg / {latestRecord.height} cm
                        </div>
                        {latestRecord.weight && latestRecord.height && (
                          <div 
                            className={styles['health-card-status']} 
                            style={{ backgroundColor: getWeightStatus(latestRecord.weight, latestRecord.height).color }}
                          >
                            {getWeightStatus(latestRecord.weight, latestRecord.height).status}
                          </div>                          )}
                        <p className={styles['health-card-description']}>
                          BMI: {(latestRecord.weight / ((latestRecord.height / 100) * (latestRecord.height / 100))).toFixed(1)}
                        </p>
                      </div>
                    )}
                      {latestRecord.blood_pressure && (
                      <div className={styles['health-card']}>
                        <h3 className={styles['health-card-title']}>
                          <FaTint /> Huyết áp
                        </h3>
                        <div className={styles['health-card-value']}>{latestRecord.blood_pressure} mmHg</div>
                        <div 
                          className={styles['health-card-status']} 
                          style={{ backgroundColor: getBloodPressureStatus(latestRecord.blood_pressure).color }}
                        >
                          {getBloodPressureStatus(latestRecord.blood_pressure).status}
                        </div>
                        <p className={styles['health-card-description']}>
                          Tâm thu/Tâm trương
                        </p>
                      </div>
                    )}                    {latestRecord.heart_rate && (
                      <div className={styles['health-card']}>
                        <h3 className={styles['health-card-title']}>
                          <FaHeartbeat /> Nhịp tim
                        </h3>
                        <div className={styles['health-card-value']}>{latestRecord.heart_rate} BPM</div>
                        <div 
                          className={styles['health-card-status']} 
                          style={{ backgroundColor: getHeartRateStatus(latestRecord.heart_rate, userAge).color }}
                        >
                          {getHeartRateStatus(latestRecord.heart_rate, userAge).status}
                        </div>
                        <p className={styles['health-card-description']}>
                          Nhịp tim lúc nghỉ ngơi
                        </p>
                      </div>
                    )}
                      {latestRecord.blood_sugar && (
                      <div className={styles['health-card']}>
                        <h3 className={styles['health-card-title']}>
                          <FaChartLine /> Đường huyết
                        </h3>
                        <div className={styles['health-card-value']}>{latestRecord.blood_sugar} mmol/L</div>
                        <div 
                          className={styles['health-card-status']} 
                          style={{ backgroundColor: getBloodSugarStatus(latestRecord.blood_sugar).color }}
                        >
                          {getBloodSugarStatus(latestRecord.blood_sugar).status}
                        </div>
                        <p className={styles['health-card-description']}>
                          Nồng độ glucose trong máu
                        </p>
                      </div>
                    )}                    {latestRecord.temperature && (
                      <div className={styles['health-card']}>
                        <h3 className={styles['health-card-title']}>
                          <FaThermometerHalf /> Nhiệt độ cơ thể
                        </h3>
                        <div className={styles['health-card-value']}>{latestRecord.temperature} °C</div>
                        <div 
                          className={styles['health-card-status']} 
                          style={{ backgroundColor: getTemperatureStatus(latestRecord.temperature).color }}
                        >
                          {getTemperatureStatus(latestRecord.temperature).status}
                        </div>
                        <p className={styles['health-card-description']}>
                          Nhiệt độ cơ thể
                        </p>
                      </div>
                    )}                    {latestRecord.sleep_duration && (
                      <div className={styles['health-card']}>
                        <h3 className={styles['health-card-title']}>
                          <FaBed /> Thời gian ngủ
                        </h3>
                        <div className={styles['health-card-value']}>{latestRecord.sleep_duration} giờ</div>
                        <div 
                          className={styles['health-card-status']} 
                          style={{ backgroundColor: getSleepStatus(latestRecord.sleep_duration).color }}
                        >
                          {getSleepStatus(latestRecord.sleep_duration).status}
                        </div>
                        <p className={styles['health-card-description']}>
                          Thời gian ngủ trong ngày
                        </p>
                      </div>
                    )}                    {latestRecord.calories_burned && (
                      <div className={styles['health-card']}>
                        <h3 className={styles['health-card-title']}>
                          <FaFire /> Calories đã đốt
                        </h3>
                        <div className={styles['health-card-value']}>{latestRecord.calories_burned} kcal</div>
                        <p className={styles['health-card-description']}>
                          Lượng calories đã tiêu thụ qua hoạt động
                        </p>
                      </div>
                    )}
                  </>                ) : (
                  <div className={styles['no-records']}>
                    <p>Bạn chưa có dữ liệu sức khỏe nào. Hãy thêm thông số đầu tiên!</p>
                  </div>
                )}
              </div>              {records.length > 0 && (
                <div className={styles['health-charts']}>
                  <div className={styles['chart-header']}>
                    <h3 className={styles['health-section-title']}>Biểu đồ theo dõi</h3>
                    <div className={styles['chart-period-selector']}>
                      <button 
                        className={`${styles['chart-period-btn']} ${timeFilter === 'all' ? styles.active : ''}`}
                        onClick={() => setTimeFilter('all')}
                      >
                        Tất cả
                      </button>
                      <button 
                        className={`${styles['chart-period-btn']} ${timeFilter === '30days' ? styles.active : ''}`}
                        onClick={() => setTimeFilter('30days')}
                      >
                        30 ngày
                      </button>
                      <button 
                        className={`${styles['chart-period-btn']} ${timeFilter === '7days' ? styles.active : ''}`}
                        onClick={() => setTimeFilter('7days')}
                      >
                        7 ngày
                      </button>
                    </div>
                  </div>                  <div className={styles['chart-metrics-toggle']}>
                    <div className={styles['metrics-toggle-title']}>Hiển thị thông số:</div>
                    <div className={styles['metrics-toggle-buttons']}>
                      <button 
                        className={`${styles['metric-toggle-btn']} ${selectedMetrics.weight ? styles.active : ''}`}
                        onClick={() => toggleMetric('weight')}
                      >
                        <FaWeight /> Cân nặng
                      </button>
                      <button 
                        className={`${styles['metric-toggle-btn']} ${selectedMetrics.heart_rate ? styles.active : ''}`}
                        onClick={() => toggleMetric('heart_rate')}
                      >
                        <FaHeartbeat /> Nhịp tim
                      </button>
                      <button 
                        className={`${styles['metric-toggle-btn']} ${selectedMetrics.blood_sugar ? styles.active : ''}`}
                        onClick={() => toggleMetric('blood_sugar')}
                      >
                        <FaChartLine /> Đường huyết
                      </button>
                      <button 
                        className={`${styles['metric-toggle-btn']} ${selectedMetrics.temperature ? styles.active : ''}`}
                        onClick={() => toggleMetric('temperature')}
                      >
                        <FaThermometerHalf /> Nhiệt độ
                      </button>
                      <button 
                        className={`${styles['metric-toggle-btn']} ${selectedMetrics.sleep_duration ? styles.active : ''}`}
                        onClick={() => toggleMetric('sleep_duration')}
                      >
                        <FaBed /> Thời gian ngủ
                      </button>
                    </div>
                  </div>                    <div className={styles['chart-container']}>
                    {filteredRecords.length > 0 ? (
                      <Line data={chartData} options={chartOptions} />
                    ) : (
                      <div className={styles['no-chart-data']}>
                        <p>Không có dữ liệu trong khoảng thời gian đã chọn</p>
                      </div>
                    )}
                  </div>
                    <div className={styles['chart-help-container']}>
                    <div className={styles['chart-help-toggle']} onClick={() => setShowChartHelp(prev => !prev)}>
                      <FaQuestionCircle /> Hướng dẫn đọc biểu đồ
                    </div>
                    {showChartHelp && (
                      <div className={styles['chart-help-content']}>
                        <h4>Cách đọc biểu đồ sức khỏe:</h4>
                        <ul>
                          <li><strong>Di chuột</strong> qua các điểm trên biểu đồ để xem thông số cụ thể</li>
                          <li>Sử dụng <strong>nút lọc thời gian</strong> (7 ngày, 30 ngày, Tất cả) để điều chỉnh khoảng thời gian hiển thị</li>
                          <li>Bật/tắt các <strong>thông số</strong> (Cân nặng, Nhịp tim, v.v.) để xem biểu đồ theo nhu cầu</li>
                          <li>Tham khảo <strong>màu sắc</strong> tương ứng với từng thông số trong bảng chú thích</li>
                          <li>Đường biểu đồ <strong>tăng lên</strong> nghĩa là thông số đang tăng so với lần đo trước</li>
                          <li>Đường biểu đồ <strong>giảm xuống</strong> nghĩa là thông số đang giảm so với lần đo trước</li>
                        </ul>
                          <h4 className={styles['reference-values-title']}>Giá trị tham khảo (người trưởng thành):</h4>
                        <div className={styles['reference-values-grid']}>
                          <div className={styles['reference-value-item']}>
                            <span className={styles['reference-name']}><FaWeight /> BMI (Chỉ số khối cơ thể)</span>
                            <span className={styles['reference-range']}>18.5 - 24.9</span>
                          </div>
                          <div className={styles['reference-value-item']}>
                            <span className={styles['reference-name']}><FaHeartbeat /> Nhịp tim</span>
                            <span className={styles['reference-range']}>60 - 100 bpm</span>
                          </div>
                          <div className={styles['reference-value-item']}>
                            <span className={styles['reference-name']}><FaTint /> Huyết áp</span>
                            <span className={styles['reference-range']}>≤ 120/80 mmHg</span>
                          </div>
                          <div className={styles['reference-value-item']}>
                            <span className={styles['reference-name']}><FaChartLine /> Đường huyết (lúc đói)</span>
                            <span className={styles['reference-range']}>4.0 - 5.9 mmol/L</span>
                          </div>
                          <div className={styles['reference-value-item']}>
                            <span className={styles['reference-name']}><FaThermometerHalf /> Nhiệt độ cơ thể</span>
                            <span className={styles['reference-range']}>36.5 - 37.5 °C</span>
                          </div>
                          <div className={styles['reference-value-item']}>
                            <span className={styles['reference-name']}><FaBed /> Thời gian ngủ</span>
                            <span className={styles['reference-range']}>7 - 9 giờ</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tab: Lịch sử thông số */}            <div className={`${styles['tab-content']} ${activeTab === 'history' ? styles.active : ''}`}>
              <h2 className={styles['health-section-title']}>Lịch sử thông số sức khỏe</h2>
              
              {records.length > 0 ? (
                <div className={styles['table-responsive']}>
                  <table className={styles['history-table']}>
                    <thead>
                      <tr>
                        <th>Ngày ghi nhận</th>
                        <th>Cân nặng (kg)</th>
                        <th>Chiều cao (cm)</th>
                        <th>Huyết áp</th>
                        <th>Nhịp tim</th>
                        <th>Đường huyết</th>
                        <th>Nhiệt độ (°C)</th>
                        <th>Thời gian ngủ (h)</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record) => (
                        <tr key={record.tracking_id}>
                          <td>{record.recorded_at ? format(new Date(record.recorded_at), 'dd/MM/yyyy HH:mm') : 'N/A'}</td>
                          <td>{record.weight || 'N/A'}</td>
                          <td>{record.height || 'N/A'}</td>
                          <td>{record.blood_pressure || 'N/A'}</td>
                          <td>{record.heart_rate || 'N/A'}</td>
                          <td>{record.blood_sugar || 'N/A'}</td>
                          <td>{record.temperature || 'N/A'}</td>
                          <td>{record.sleep_duration || 'N/A'}</td>                          <td>
                            <div className={styles['history-actions']}>
                              <button 
                                className={`${styles['action-btn']} ${styles['edit-btn']}`} 
                                onClick={() => openEditModal(record)}
                              >
                                <FaEdit />
                              </button>
                              <button 
                                className={`${styles['action-btn']} ${styles['delete-btn']}`} 
                                onClick={() => handleDelete(record)}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>                </div>
              ) : (
                <div className={styles['no-records']}>
                  <p>Không có dữ liệu lịch sử</p>
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className={styles['pagination']}>
                  <button 
                    className={`${styles['pagination-btn']} ${page === 1 ? styles['pagination-disabled'] : ''}`} 
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                  >
                    Trước
                  </button>
                  
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    // Logic to show pages around current page
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (                      <button 
                        key={pageNum} 
                        className={`${styles['pagination-btn']} ${pageNum === page ? styles['pagination-active'] : ''}`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button 
                    className={`${styles['pagination-btn']} ${page === pagination.totalPages ? styles['pagination-disabled'] : ''}`} 
                    onClick={() => setPage(prev => Math.min(prev + 1, pagination.totalPages))}
                    disabled={page === pagination.totalPages}
                  >
                    Sau
                  </button>
                </div>
              )}
            </div>
            
            {/* Tab: Nhập thông số mới */}            <div className={`${styles['tab-content']} ${activeTab === 'add' ? styles.active : ''}`}>
              {renderAddForm()}
            </div>
          </>
        )}        {/* Edit Modal */}
        {isModalOpen && isEditMode && (
          <div className={styles['modal']}>
            <div className={styles['modal-content']}>
              <div className={styles['modal-header']}>
                <h2 className={styles['modal-title']}>Cập nhật thông số sức khỏe</h2>
                <button className={styles['close-btn']} onClick={closeModal}>&times;</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className={styles['form-grid']}>
                  <div className={styles['form-group']}>
                    <label className={styles['form-label']} htmlFor="weight">
                      <FaWeight className={styles['form-icon']} /> Cân nặng (kg)
                    </label>
                    <input
                      type="number"
                      id="weight"
                      name="weight"
                      className={styles['form-input']}
                      placeholder="Ví dụ: 65"
                      value={formData.weight}
                      onChange={handleInputChange}
                      step="0.1"
                      min="1"
                      max="500"
                    />
                  </div>

                  <div className={styles['form-group']}>
                    <label className={styles['form-label']} htmlFor="height">
                      <FaRuler className={styles['form-icon']} /> Chiều cao (cm)
                    </label>
                    <input
                      type="number"
                      id="height"
                      name="height"
                      className={styles['form-input']}
                      placeholder="Ví dụ: 170"
                      value={formData.height}
                      onChange={handleInputChange}
                      step="0.1"
                      min="10"
                      max="300"
                    />
                  </div>

                  <div className={styles['form-group']}>
                    <label className={styles['form-label']} htmlFor="blood_pressure">
                      <FaTint className={styles['form-icon']} /> Huyết áp (mmHg)
                    </label>
                    <input
                      type="text"
                      id="blood_pressure"
                      name="blood_pressure"
                      className={styles['form-input']}
                      placeholder="Ví dụ: 120/80"
                      value={formData.blood_pressure}
                      onChange={handleInputChange}
                      pattern="^\d{1,3}/\d{1,3}$"
                      title="Nhập theo định dạng: 120/80"
                    />
                  </div>

                  <div className={styles['form-group']}>
                    <label className={styles['form-label']} htmlFor="heart_rate">
                      <FaHeartbeat className={styles['form-icon']} /> Nhịp tim (BPM)
                    </label>
                    <input
                      type="number"
                      id="heart_rate"
                      name="heart_rate"
                      className={styles['form-input']}
                      placeholder="Ví dụ: 75"
                      value={formData.heart_rate}
                      onChange={handleInputChange}
                      min="30"
                      max="250"
                    />
                  </div>

                  <div className={styles['form-group']}>
                    <label className={styles['form-label']} htmlFor="blood_sugar">
                      <FaChartLine className={styles['form-icon']} /> Đường huyết (mmol/L)
                    </label>
                    <input
                      type="number"
                      id="blood_sugar"
                      name="blood_sugar"
                      className={styles['form-input']}
                      placeholder="Ví dụ: 5.5"
                      value={formData.blood_sugar}
                      onChange={handleInputChange}
                      step="0.1"
                      min="1"
                      max="50"
                    />
                  </div>

                  <div className={styles['form-group']}>
                    <label className={styles['form-label']} htmlFor="temperature">
                      <FaThermometerHalf className={styles['form-icon']} /> Nhiệt độ cơ thể (°C)
                    </label>
                    <input
                      type="number"
                      id="temperature"
                      name="temperature"
                      className={styles['form-input']}
                      placeholder="Ví dụ: 36.5"
                      value={formData.temperature}
                      onChange={handleInputChange}
                      step="0.1"
                      min="30"
                      max="45"
                    />
                  </div>

                  <div className={styles['form-group']}>
                    <label className={styles['form-label']} htmlFor="sleep_duration">
                      <FaBed className={styles['form-icon']} /> Thời gian ngủ (giờ)
                    </label>
                    <input
                      type="number"
                      id="sleep_duration"
                      name="sleep_duration"
                      className={styles['form-input']}
                      placeholder="Ví dụ: 8"
                      value={formData.sleep_duration}
                      onChange={handleInputChange}
                      min="0"
                      max="24"
                    />
                  </div>

                  <div className={styles['form-group']}>
                    <label className={styles['form-label']} htmlFor="calories_burned">
                      <FaFire className={styles['form-icon']} /> Calories đã đốt (kcal)
                    </label>
                    <input
                      type="number"
                      id="calories_burned"
                      name="calories_burned"
                      className={styles['form-input']}
                      placeholder="Ví dụ: 500"
                      value={formData.calories_burned}
                      onChange={handleInputChange}
                      min="0"
                      max="10000"
                    />
                  </div>

                  <div className={`${styles['form-group']} ${styles['form-group-full']}`}>
                    <label className={styles['form-label']} htmlFor="exercise_data">
                      <FaCalendarAlt className={styles['form-icon']} /> Ghi chú hoạt động thể chất
                    </label>
                    <textarea
                      id="exercise_data"
                      name="exercise_data"
                      className={styles['form-textarea']}
                      placeholder="Mô tả các hoạt động thể chất của bạn (nếu có)"
                      value={formData.exercise_data}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                </div>

                {error && (
                  <div className={styles['error-message']}>
                    <FaExclamationCircle /> {error}
                  </div>
                )}
                {success && (
                  <div className={styles['success-message']}>
                    <FaCheckCircle /> {success}
                  </div>
                )}                <div className={styles['form-actions']}>
                  <button type="button" className={styles['cancel-btn']} onClick={closeModal}>Hủy</button>
                  <button type="submit" className={styles['submit-btn']}>
                    Cập nhật
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default HealthTracking;