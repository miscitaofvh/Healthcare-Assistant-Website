import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { MedicalRecord, MedicalRecordPagination } from '../types/medicalRecord';
import { getMedicalRecords, getMedicalRecordById, addMedicalRecord, updateMedicalRecord } from '../utils/service/medicalRecord';

export const useMedicalRecords = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [pagination, setPagination] = useState<MedicalRecordPagination>({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    perPage: 10
  });
  const [page, setPage] = useState<number>(1);

  // Fetch medical records
  const fetchRecords = useCallback(async (pageNum: number = 1) => {
    setLoading(true);
    setError('');
    try {
      const response = await getMedicalRecords(pageNum, pagination.perPage);
      if (response.success) {
        setRecords(response.records);
        setPagination(response.pagination as MedicalRecordPagination);
      } else {
        setError(response.message || 'Failed to fetch medical records');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching medical records');
    } finally {
      setLoading(false);
    }
  }, [pagination.perPage]);

  // Add a new medical record
  const addRecord = useCallback(async (recordData: MedicalRecord) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await addMedicalRecord(recordData);
      if (response.success) {
        setSuccess('Hồ sơ bệnh án được thêm thành công');
        // Refresh the records list
        await fetchRecords(pagination.currentPage);
        return true;
      } else {
        setError(response.message || 'Failed to add medical record');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while adding medical record');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchRecords, pagination.currentPage]);

  const updateRecord = useCallback(async (recordId: string, recordData: MedicalRecord) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await updateMedicalRecord(recordId, recordData);
      if (response.success) {
        setSuccess('Hồ sơ bệnh án được cập nhật thành công');
        // Refresh the records list
        await fetchRecords(pagination.currentPage);
        return true;
      } else {
        setError(response.message || 'Failed to update medical record');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating medical record');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchRecords, pagination.currentPage]);  

  const removeRecord = useCallback(() => {
    setError('');
    setSuccess('');
    toast.info('Medical records cannot be deleted as per policy. This ensures a complete medical history is maintained.');
    return false;
  }, []);

  // Initial load
  useEffect(() => {
    fetchRecords(page);
  }, [fetchRecords, page]);

  return {
    records,
    loading,
    error,
    success,
    pagination,
    page,
    setPage,
    setError,
    setSuccess,
    addRecord,
    updateRecord,
    removeRecord,
    fetchRecords
  };
};
