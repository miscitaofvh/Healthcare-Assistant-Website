import React, { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { FaWeight, FaHeartbeat, FaChartLine, FaThermometerHalf, FaBed, FaQuestionCircle } from 'react-icons/fa';
import { format } from 'date-fns';
import { HealthRecord, SelectedMetricsType } from '../../../types/healthTracking';
import { chartMetrics, filterRecordsByTime } from '../healthTrackingUtils';
import styles from '../HealthTracking.module.css';

interface MetricsToggleProps {
  selectedMetrics: SelectedMetricsType;
  toggleMetric: (metric: keyof SelectedMetricsType) => void;
}

interface ChartProps {
  records: HealthRecord[];
  timeFilter: string;
  selectedMetrics: SelectedMetricsType;
  setTimeFilter: (filter: string) => void;
  setSelectedMetrics?: React.Dispatch<React.SetStateAction<SelectedMetricsType>>;
}

// Metrics toggle component
const MetricsToggle: React.FC<MetricsToggleProps> = React.memo(({ selectedMetrics, toggleMetric }) => (
  <div className={styles['chart-metrics-toggle']}>
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
  </div>
));

// Chart help component
const ChartHelp: React.FC = React.memo(() => {
  const [showChartHelp, setShowChartHelp] = useState(false);

  return (
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
  );
});

// Time filter component
const TimeFilter: React.FC<{ timeFilter: string; setTimeFilter: (filter: string) => void }> = 
  React.memo(({ timeFilter, setTimeFilter }) => (
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
));

// Chart options
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

// Main chart component
const HealthMetricsChart: React.FC<ChartProps> = ({ 
  records, 
  timeFilter, 
  selectedMetrics,
  setTimeFilter,
  setSelectedMetrics
}) => {
  const [filteredRecords, setFilteredRecords] = useState<HealthRecord[]>([]);
  
  // Filter records based on time filter
  useEffect(() => {
    const filtered = filterRecordsByTime(records, timeFilter);
    setFilteredRecords(filtered);
  }, [records, timeFilter]);
  // Prepare chart data
  const chartData = useMemo(() => ({
    labels: filteredRecords.map(record => 
      record.recorded_at ? format(new Date(record.recorded_at), 'dd/MM/yyyy') : ''
    ).reverse(),
    datasets: (Object.keys(selectedMetrics) as Array<keyof SelectedMetricsType>)
      .filter(key => selectedMetrics[key])
      .map(metric => ({
        label: chartMetrics[metric]?.label,
        data: filteredRecords.map(record => record[metric as keyof HealthRecord] || null).reverse(),
        borderColor: chartMetrics[metric]?.borderColor,
        backgroundColor: chartMetrics[metric]?.backgroundColor,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 7,
      })),
  }), [filteredRecords, selectedMetrics]);
  return (
    <div className={styles['health-charts']}>
      <div className={styles['chart-header']}>
        <h3 className={styles['health-section-title']}>Biểu đồ theo dõi</h3>
        <TimeFilter timeFilter={timeFilter} setTimeFilter={setTimeFilter} />
      </div>
        <MetricsToggle 
        selectedMetrics={selectedMetrics} 
        toggleMetric={(metric: keyof SelectedMetricsType) => {
          if (setSelectedMetrics) {
            setSelectedMetrics(prev => ({
              ...prev,
              [metric]: !prev[metric]
            }));
          }
        }} 
      />
      
      <div className={styles['chart-container']}>
        {filteredRecords.length > 0 ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div className={styles['no-chart-data']}>
            <p>Không có dữ liệu trong khoảng thời gian đã chọn</p>
          </div>
        )}
      </div>
      
      <ChartHelp />
    </div>
  );
};

export default HealthMetricsChart;
