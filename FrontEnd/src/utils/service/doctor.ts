import { requestAPI } from '../api/request';
import { Doctor } from '../../types/doctor';
import { getApiUrl } from '../../config/env';

const BASE_URL = getApiUrl('/doctors');

export async function fetchDoctors(): Promise<Doctor[]> {
  const { data, status, error } = await requestAPI(BASE_URL, '', 'GET');

  if (error || status >= 400) {
    throw new Error(data?.message || error || 'Lỗi khi tải danh sách bác sĩ');
  }

  return data.doctors as Doctor[];
}