import { MedicalRecordFormData } from '../../types/medicalRecord';

/**
 * Default form data for empty form
 */
export const defaultFormData: MedicalRecordFormData = {
  record_date: new Date().toISOString().slice(0, 10),
  diagnosis: '',
  symptoms: '',
  treatments: '',
  medications: '',
  doctor_name: '',
  hospital: '',
  notes: '',
  record_type: 'checkup',
};

/**
 * Validates the form data for medical record
 * @param formData Form data to validate
 * @returns Error message or null if valid
 */
export const validateMedicalRecordForm = (formData: MedicalRecordFormData): string | null => {
  if (!formData.record_date) {
    return 'Vui lòng chọn ngày khám';
  }

  if (!formData.diagnosis || formData.diagnosis.trim() === '') {
    return 'Vui lòng nhập chẩn đoán';
  }

  if (!formData.symptoms || formData.symptoms.trim() === '') {
    return 'Vui lòng nhập triệu chứng';
  }

  if (!formData.record_type) {
    return 'Vui lòng chọn loại hồ sơ';
  }

  // Kiểm tra ngày khám không được ở tương lai
  const recordDate = new Date(formData.record_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (recordDate > today) {
    return 'Ngày khám không thể ở tương lai';
  }

  return null;
};
