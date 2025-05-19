/**
 * Interface cho dữ liệu hồ sơ bệnh án
 */
export interface MedicalRecord {
  record_id?: string;
  user_id?: string;
  record_date?: string;
  diagnosis?: string;
  symptoms?: string;
  treatments?: string;
  medications?: string;
  doctor_name?: string;
  hospital?: string;
  notes?: string;
  record_type?: 'checkup' | 'hospitalization' | 'surgery' | 'other';
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface cho thuốc trong hồ sơ bệnh án
 */
export interface Medication {
  name: string;
  dosage: string;
  instructions: string;
  duration: string;
}

/**
 * Interface cho dữ liệu form thêm/sửa hồ sơ bệnh án
 */
export interface MedicalRecordFormData {
  record_date: string;
  diagnosis: string;
  symptoms: string;
  treatments: string;
  medications: string;
  doctor_name: string;
  hospital: string;
  notes: string;
  record_type: 'checkup' | 'hospitalization' | 'surgery' | 'other';
}

/**
 * Interface cho dữ liệu phân trang
 */
export interface MedicalRecordPagination {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  perPage: number;
}
