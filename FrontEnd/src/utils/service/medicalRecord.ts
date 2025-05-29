import { requestAPI } from '../api/request';
import { MedicalRecord, MedicalRecordPagination } from '../../types/medicalRecord';
import { getApiUrl } from '../../config/env';

const BASE_URL = getApiUrl('/medical-record');

// Lấy tất cả hồ sơ bệnh án của người dùng đã đăng nhập
export async function getMedicalRecords(page: number = 1, limit: number = 10) {
  try {
    const response = await requestAPI(
      BASE_URL,
      `?page=${page}&limit=${limit}`,
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
        message: data.message || 'Failed to fetch medical records',
        records: [],
        pagination: {},
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Error occurred while fetching medical records',
      records: [],
      pagination: {},
    };
  }
}

// Lấy chi tiết hồ sơ bệnh án theo ID
export async function getMedicalRecordById(recordId: string) {
  try {
    const response = await requestAPI(
      BASE_URL,
      `/${recordId}`,
      'GET'
    );
    const { data, status } = response;

    if (status === 200 && data.success) {
      return {
        success: true,
        record: data.data || null,
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to fetch medical record',
        record: null,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Error occurred while fetching medical record',
      record: null,
    };
  }
}

// Thêm hồ sơ bệnh án mới
export async function addMedicalRecord(recordData: MedicalRecord) {
  try {
    const response = await requestAPI(
      BASE_URL,
      '',
      'POST',
      recordData
    );
    const { data, status } = response;

    if (status === 201 && data.success) {
      return {
        success: true,
        message: data.message || 'Medical record added successfully',
        record: data.data,
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to add medical record',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Error occurred while adding medical record',
    };
  }
}

// Cập nhật hồ sơ bệnh án
export async function updateMedicalRecord(recordId: string, recordData: MedicalRecord) {
  try {
    const response = await requestAPI(
      BASE_URL,
      `/${recordId}`,
      'PUT',
      recordData
    );
    const { data, status } = response;

    if (status === 200 && data.success) {
      return {
        success: true,
        message: data.message || 'Medical record updated successfully',
        record: data.data,
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to update medical record',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Error occurred while updating medical record',
    };
  }
}

// Note: Delete functionality for medical records has been removed
// as per the requirement that medical records should never be deleted.
