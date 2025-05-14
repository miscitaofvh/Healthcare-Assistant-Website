import React from 'react';
import { FaWeight, FaHeartbeat, FaThermometerHalf, FaBed, FaFire, FaTint, FaChartLine } from 'react-icons/fa';
import { getWeightStatus, getBloodPressureStatus, getHeartRateStatus, getBloodSugarStatus, getTemperatureStatus, getSleepStatus } from '../../../utils/service/healthTracking';
import { HealthRecord } from '../../../types/healthTracking';
import styles from '../HealthTracking.module.css';

interface LatestMetricsDisplayProps {
  latestRecord: HealthRecord | null;
  userAge: number;
}

// A single health metric card component
interface HealthMetricCardProps {
  title: string;
  value: React.ReactNode;
  status?: {
    text: string;
    color: string;
  };
  description: string;
  icon: React.ReactNode;
}

const HealthMetricCard: React.FC<HealthMetricCardProps> = React.memo(({
  title,
  value,
  status,
  description,
  icon
}) => (
  <div className={styles['health-card']}>
    <h3 className={styles['health-card-title']}>
      {icon} {title}
    </h3>
    <div className={styles['health-card-value']}>{value}</div>
    {status && (
      <div 
        className={styles['health-card-status']} 
        style={{ backgroundColor: status.color }}
      >
        {status.text}
      </div>
    )}
    <p className={styles['health-card-description']}>
      {description}
    </p>
  </div>
));

const LatestMetricsDisplay: React.FC<LatestMetricsDisplayProps> = ({ latestRecord, userAge }) => {
  if (!latestRecord) {
    return (
      <div className={styles['no-records']}>
        <p>Bạn chưa có dữ liệu sức khỏe nào. Hãy thêm thông số đầu tiên!</p>
      </div>
    );
  }

  // Calculate BMI if weight and height are available
  const bmi = latestRecord.weight && latestRecord.height 
    ? (latestRecord.weight / ((latestRecord.height / 100) * (latestRecord.height / 100))).toFixed(1)
    : null;

  return (
    <div className={styles['health-cards']}>
      {latestRecord.weight && latestRecord.height && (
        <HealthMetricCard
          title="Cân nặng & Chiều cao"
          value={`${latestRecord.weight} kg / ${latestRecord.height} cm`}
          status={{
            text: getWeightStatus(latestRecord.weight, latestRecord.height).status,
            color: getWeightStatus(latestRecord.weight, latestRecord.height).color
          }}
          description={`BMI: ${bmi}`}
          icon={<FaWeight />}
        />
      )}

      {latestRecord.blood_pressure && (
        <HealthMetricCard
          title="Huyết áp"
          value={`${latestRecord.blood_pressure} mmHg`}
          status={{
            text: getBloodPressureStatus(latestRecord.blood_pressure).status,
            color: getBloodPressureStatus(latestRecord.blood_pressure).color
          }}
          description="Tâm thu/Tâm trương"
          icon={<FaTint />}
        />
      )}

      {latestRecord.heart_rate && (
        <HealthMetricCard
          title="Nhịp tim"
          value={`${latestRecord.heart_rate} BPM`}
          status={{
            text: getHeartRateStatus(latestRecord.heart_rate, userAge).status,
            color: getHeartRateStatus(latestRecord.heart_rate, userAge).color
          }}
          description="Nhịp tim lúc nghỉ ngơi"
          icon={<FaHeartbeat />}
        />
      )}

      {latestRecord.blood_sugar && (
        <HealthMetricCard
          title="Đường huyết"
          value={`${latestRecord.blood_sugar} mmol/L`}
          status={{
            text: getBloodSugarStatus(latestRecord.blood_sugar).status,
            color: getBloodSugarStatus(latestRecord.blood_sugar).color
          }}
          description="Nồng độ glucose trong máu"
          icon={<FaChartLine />}
        />
      )}

      {latestRecord.temperature && (
        <HealthMetricCard
          title="Nhiệt độ cơ thể"
          value={`${latestRecord.temperature} °C`}
          status={{
            text: getTemperatureStatus(latestRecord.temperature).status,
            color: getTemperatureStatus(latestRecord.temperature).color
          }}
          description="Nhiệt độ cơ thể"
          icon={<FaThermometerHalf />}
        />
      )}

      {latestRecord.sleep_duration && (
        <HealthMetricCard
          title="Thời gian ngủ"
          value={`${latestRecord.sleep_duration} giờ`}
          status={{
            text: getSleepStatus(latestRecord.sleep_duration).status,
            color: getSleepStatus(latestRecord.sleep_duration).color
          }}
          description="Thời gian ngủ trong ngày"
          icon={<FaBed />}
        />
      )}

      {latestRecord.calories_burned && (
        <HealthMetricCard
          title="Calories đã đốt"
          value={`${latestRecord.calories_burned} kcal`}
          description="Lượng calories đã tiêu thụ qua hoạt động"
          icon={<FaFire />}
        />
      )}
    </div>
  );
};

export default React.memo(LatestMetricsDisplay);
