import { HealthRecord, FormData, MetricConfig } from '../../types/healthTracking';

// Chart metrics configuration
export const chartMetrics: Record<string, MetricConfig> = {
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

// Default form data
export const defaultFormData: FormData = {
  weight: '',
  height: '',
  blood_pressure: '',
  heart_rate: '',
  blood_sugar: '',
  temperature: '',
  sleep_duration: '',
  calories_burned: '',
  exercise_data: '',
};

// Form validation
export const validateHealthForm = (formData: FormData): string => {
  if (!formData.weight && !formData.height && !formData.blood_pressure && 
      !formData.heart_rate && !formData.blood_sugar && !formData.temperature && 
      !formData.sleep_duration && !formData.calories_burned) {
    return 'Vui lòng nhập ít nhất một thông số sức khỏe';
  }
  return '';
};

// Convert form data to API format
export const prepareHealthData = (formData: FormData): HealthRecord => {
  const healthData: HealthRecord = {};
  if (formData.weight) healthData.weight = parseFloat(formData.weight);
  if (formData.height) healthData.height = parseFloat(formData.height);
  if (formData.blood_pressure) healthData.blood_pressure = formData.blood_pressure;
  if (formData.heart_rate) healthData.heart_rate = parseInt(formData.heart_rate, 10);
  if (formData.blood_sugar) healthData.blood_sugar = parseFloat(formData.blood_sugar);
  if (formData.temperature) healthData.temperature = parseFloat(formData.temperature);
  if (formData.sleep_duration) healthData.sleep_duration = parseInt(formData.sleep_duration, 10);
  if (formData.calories_burned) healthData.calories_burned = parseInt(formData.calories_burned, 10);
  if (formData.exercise_data) healthData.exercise_data = formData.exercise_data;
  
  return healthData;
};

// Calculate age from date of birth
export const calculateAge = (dob: string | undefined): number => {
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

// Filter records by time
export const filterRecordsByTime = (
  records: HealthRecord[], 
  timeFilter: string
): HealthRecord[] => {
  if (!records || records.length === 0) {
    return [];
  }

  const now = new Date();
  
  if (timeFilter === 'all') {
    return [...records];
  } else if (timeFilter === '7days') {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    return records.filter(record => 
      record.recorded_at && new Date(record.recorded_at) >= sevenDaysAgo
    );
  } else if (timeFilter === '30days') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    return records.filter(record => 
      record.recorded_at && new Date(record.recorded_at) >= thirtyDaysAgo
    );
  }
  
  return [...records];
};
