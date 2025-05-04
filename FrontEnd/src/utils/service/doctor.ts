import { requestAPI } from '../api/request';
import { Doctor } from '../../types/doctor';

const BASE_URL = "http://localhost:5000";

export async function fetchDoctors(): Promise<Doctor[]> {
  const { data, status, error } = await requestAPI(BASE_URL, '/api/doctors', 'GET');

  if (error || status >= 400) {
    throw new Error(data?.message || error || 'Lỗi khi tải danh sách bác sĩ');
  }

  return data.doctors as Doctor[];
}