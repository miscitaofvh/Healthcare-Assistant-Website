import { requestAPI } from '../api/request';

const BASE_URL = 'http://localhost:5000/api/health';

export interface HealthRecord {
  tracking_id?: string;
  user_id?: string;
  weight?: number;
  height?: number;
  blood_pressure?: string;
  heart_rate?: number;
  blood_sugar?: number;
  temperature?: number;
  sleep_duration?: number;
  calories_burned?: number;
  exercise_data?: string;
  recorded_at?: string;
}

export interface HealthStats {
  avg_weight: number;
  min_weight: number;
  max_weight: number;
  avg_heart_rate: number;
  min_heart_rate: number;
  max_heart_rate: number;
  avg_blood_sugar: number;
  min_blood_sugar: number;
  max_blood_sugar: number;
  avg_temperature: number;
  min_temperature: number;
  max_temperature: number;
  avg_sleep_duration: number;
  avg_calories_burned: number;
}

export interface HealthTrackingPagination {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  perPage: number;
}

// Get all health records for the logged-in user
export async function getHealthRecords(page: number = 1, limit: number = 10) {
  try {
    const response = await requestAPI(
      BASE_URL,
      `/records?page=${page}&limit=${limit}`,
      'GET'
    );
    const { data, status } = response;

    if (status === 200 && data.success) {
      return {
        success: true,
        records: data.data || [],
        pagination: data.pagination || {},
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to fetch health records',
        records: [],
        pagination: {},
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Error occurred while fetching health records',
      records: [],
      pagination: {},
    };
  }
}

// Get the latest health record
export async function getLatestHealthRecord() {
  try {
    const response = await requestAPI(BASE_URL, '/latest', 'GET');
    const { data, status } = response;

    if (status === 200 && data.success) {
      return {
        success: true,
        record: data.data || null,
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to fetch latest health record',
        record: null,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Error occurred while fetching latest health record',
      record: null,
    };
  }
}

// Create a new health record
export async function createHealthRecord(healthData: HealthRecord) {
  try {
    const response = await requestAPI(BASE_URL, '/record', 'POST', healthData);
    const { data, status } = response;

    if (status === 201 && data.success) {
      return {
        success: true,
        message: data.message || 'Health record created successfully',
        record: data.data,
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to create health record',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Error occurred while creating health record',
    };
  }
}

// Update an existing health record
export async function updateHealthRecord(trackingId: string, healthData: Partial<HealthRecord>) {
  try {
    const response = await requestAPI(
      BASE_URL,
      `/record/${trackingId}`,
      'PUT',
      healthData
    );
    const { data, status } = response;

    if (status === 200 && data.success) {
      return {
        success: true,
        message: data.message || 'Health record updated successfully',
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to update health record',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Error occurred while updating health record',
    };
  }
}

// Delete a health record
export async function deleteHealthRecord(trackingId: string) {
  try {
    const response = await requestAPI(
      BASE_URL,
      `/record/${trackingId}`,
      'DELETE'
    );
    const { data, status } = response;

    if (status === 200 && data.success) {
      return {
        success: true,
        message: data.message || 'Health record deleted successfully',
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to delete health record',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Error occurred while deleting health record',
    };
  }
}

// Get health statistics for a specific period
export async function getHealthStatistics(startDate: string, endDate: string) {
  try {
    const response = await requestAPI(
      BASE_URL,
      `/statistics?startDate=${startDate}&endDate=${endDate}`,
      'GET'
    );
    const { data, status } = response;

    if (status === 200 && data.success) {
      return {
        success: true,
        stats: data.data || {},
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to fetch health statistics',
        stats: {},
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Error occurred while fetching health statistics',
      stats: {},
    };
  }
}

// Health status indicators
export function getWeightStatus(weight: number, height: number): {status: string, color: string} {
  // Calculate BMI: weight (kg) / (height (m))^2
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  
  if (bmi < 18.5) return { status: 'Thiếu cân', color: '#FFD700' }; // Yellow
  if (bmi < 25) return { status: 'Bình thường', color: '#4CAF50' }; // Green
  if (bmi < 30) return { status: 'Thừa cân', color: '#FFA500' }; // Orange
  return { status: 'Béo phì', color: '#FF0000' }; // Red
}

export function getBloodPressureStatus(bloodPressure: string): {status: string, color: string} {
  const [systolic, diastolic] = bloodPressure.split('/').map(Number);
  
  if (systolic < 90 || diastolic < 60) return { status: 'Thấp', color: '#FFD700' }; // Yellow
  if (systolic < 120 && diastolic < 80) return { status: 'Lý tưởng', color: '#4CAF50' }; // Green
  if (systolic < 130 && diastolic < 85) return { status: 'Bình thường', color: '#4CAF50' }; // Green
  if (systolic < 140 && diastolic < 90) return { status: 'Cao bình thường', color: '#FFA500' }; // Orange
  if (systolic < 160 && diastolic < 100) return { status: 'Tăng nhẹ', color: '#FFA500' }; // Orange
  if (systolic < 180 && diastolic < 110) return { status: 'Tăng vừa', color: '#FF0000' }; // Red
  return { status: 'Tăng nặng', color: '#8B0000' }; // Dark red
}

export function getHeartRateStatus(heartRate: number, age: number): {status: string, color: string} {
  // Default status for adults
  if (heartRate < 60) return { status: 'Thấp', color: '#FFD700' }; // Yellow
  if (heartRate <= 100) return { status: 'Bình thường', color: '#4CAF50' }; // Green
  return { status: 'Cao', color: '#FF0000' }; // Red
}

export function getBloodSugarStatus(bloodSugar: number, isPostMeal: boolean = false): {status: string, color: string} {
  if (!isPostMeal) {
    // Fasting blood sugar
    if (bloodSugar < 3.9) return { status: 'Thấp', color: '#FFD700' }; // Yellow
    if (bloodSugar <= 5.6) return { status: 'Bình thường', color: '#4CAF50' }; // Green
    if (bloodSugar <= 7.0) return { status: 'Tiền tiểu đường', color: '#FFA500' }; // Orange
    return { status: 'Tiểu đường', color: '#FF0000' }; // Red
  } else {
    // Post-meal (2 hours)
    if (bloodSugar < 3.9) return { status: 'Thấp', color: '#FFD700' }; // Yellow
    if (bloodSugar <= 7.8) return { status: 'Bình thường', color: '#4CAF50' }; // Green
    if (bloodSugar <= 11.0) return { status: 'Tiền tiểu đường', color: '#FFA500' }; // Orange
    return { status: 'Tiểu đường', color: '#FF0000' }; // Red
  }
}

export function getTemperatureStatus(temperature: number): {status: string, color: string} {
  if (temperature < 35.0) return { status: 'Hạ thân nhiệt', color: '#0000FF' }; // Blue
  if (temperature < 36.5) return { status: 'Thấp', color: '#87CEEB' }; // Light blue
  if (temperature <= 37.5) return { status: 'Bình thường', color: '#4CAF50' }; // Green
  if (temperature <= 38.5) return { status: 'Sốt nhẹ', color: '#FFA500' }; // Orange
  if (temperature <= 40.0) return { status: 'Sốt', color: '#FF0000' }; // Red
  return { status: 'Sốt cao', color: '#8B0000' }; // Dark red
}

export function getSleepStatus(duration: number): {status: string, color: string} {
  if (duration < 6) return { status: 'Thiếu ngủ', color: '#FF0000' }; // Red
  if (duration < 7) return { status: 'Hơi thiếu', color: '#FFA500' }; // Orange
  if (duration <= 9) return { status: 'Đủ giấc', color: '#4CAF50' }; // Green
  return { status: 'Thừa giấc', color: '#FFD700' }; // Yellow
}
