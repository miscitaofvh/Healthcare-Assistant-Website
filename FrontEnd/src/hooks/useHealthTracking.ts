import { useState, useEffect } from 'react';
import {
  getLatestHealthRecord,
  createHealthRecord,
  updateHealthRecord,
  deleteHealthRecord,
  getHealthRecords,
} from '../utils/service/healthTracking';
import { HealthRecord, Pagination } from '../types/healthTracking';

interface UseHealthTrackingReturn {
  latestRecord: HealthRecord | null;
  records: HealthRecord[];
  loading: boolean;
  error: string;
  success: string;
  pagination: Pagination;
  page: number;
  setPage: (page: number) => void;
  setError: (error: string) => void;
  setSuccess: (success: string) => void;
  addHealthRecord: (data: HealthRecord) => Promise<boolean>;
  updateHealthRecord: (id: string, data: HealthRecord) => Promise<boolean>;
  removeHealthRecord: (record: HealthRecord) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

export const useHealthTracking = (): UseHealthTrackingReturn => {
  const [latestRecord, setLatestRecord] = useState<HealthRecord | null>(null);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    perPage: 10,
  });

  const refreshData = async () => {
    setLoading(true);
    try {
      // Get latest record
      const latestResponse = await getLatestHealthRecord();
      if (latestResponse.success && latestResponse.record) {
        setLatestRecord(latestResponse.record);
      }

      // Get records history
      const recordsResponse = await getHealthRecords(page, 10);
      if (recordsResponse.success) {
        setRecords(recordsResponse.records);
        setPagination(recordsResponse.pagination);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching health data');
      console.error('Error fetching health data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [page]);

  const addHealthRecord = async (data: HealthRecord): Promise<boolean> => {
    try {
      const response = await createHealthRecord(data);
      if (response.success) {
        setSuccess('Thêm thông số sức khỏe thành công!');
        await refreshData();
        return true;
      } else {
        setError(response.message || 'Không thể thêm thông số sức khỏe');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi lưu dữ liệu');
      return false;
    }
  };

  const updateRecord = async (id: string, data: HealthRecord): Promise<boolean> => {
    try {
      const response = await updateHealthRecord(id, data);
      if (response.success) {
        setSuccess('Cập nhật thông số sức khỏe thành công!');
        await refreshData();
        return true;
      } else {
        setError(response.message || 'Không thể cập nhật thông số sức khỏe');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi cập nhật dữ liệu');
      return false;
    }
  };

  const removeHealthRecord = async (record: HealthRecord): Promise<boolean> => {
    if (!record.tracking_id) {
      setError('Invalid record ID');
      return false;
    }

    try {
      const response = await deleteHealthRecord(record.tracking_id);
      if (response.success) {
        await refreshData();
        return true;
      } else {
        setError(response.message || 'Không thể xóa thông số sức khỏe');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi xóa dữ liệu');
      return false;
    }
  };

  return {
    latestRecord,
    records,
    loading,
    error,
    success,
    pagination,
    page,
    setPage,
    setError,
    setSuccess,
    addHealthRecord,
    updateHealthRecord: updateRecord,
    removeHealthRecord,
    refreshData
  };
};
