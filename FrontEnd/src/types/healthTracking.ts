import { HealthRecord } from '../utils/service/healthTracking';

/**
 * Interface cho dữ liệu form nhập thông số sức khỏe
 */
export interface FormData {
  weight: string;
  height: string;
  blood_pressure: string;
  heart_rate: string;
  blood_sugar: string;
  temperature: string;
  sleep_duration: string;
  calories_burned: string;
  exercise_data: string;
}

/**
 * Type cho các metrics được chọn hiển thị trên biểu đồ
 */
export interface SelectedMetricsType {
  weight: boolean;
  heart_rate: boolean;
  blood_sugar: boolean;
  temperature: boolean;
  sleep_duration: boolean;
}

/**
 * Interface cho cấu hình hiển thị các metrics trên biểu đồ
 */
export interface MetricConfig {
  label: string;
  borderColor: string;
  backgroundColor: string;
}

/**
 * Interface cho các thông số thống kê của biểu đồ
 */
export interface ChartStatistics {
  min: number;
  max: number;
  avg: number;
  change: number;  // Thay đổi theo phần trăm
  trend: 'up' | 'down' | 'stable';
}

/**
 * Interface cho các tùy chọn của biểu đồ
 */
export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins: {
    legend: {
      position: 'top' | 'bottom' | 'left' | 'right';
      labels: {
        usePointStyle: boolean;
      }
    };
    tooltip: {
      enabled: boolean;
    };
  };
}

/**
 * Interface cho dữ liệu phân trang
 */
export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  perPage: number;
}

/**
 * Export lại HealthRecord từ service để đảm bảo tính nhất quán
 */
export type { HealthRecord };
