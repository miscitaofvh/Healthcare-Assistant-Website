import React from 'react';
import { format } from 'date-fns';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { HealthRecord, Pagination } from '../../../types/healthTracking';
import styles from '../HealthTracking.module.css';

interface HistoryTableProps {
  records: HealthRecord[];
  pagination: Pagination;
  page: number;
  setPage: (page: number) => void;
  onEdit: (record: HealthRecord) => void;
  onDelete: (record: HealthRecord) => void;
}

const HistoryTable: React.FC<HistoryTableProps> = ({
  records,
  pagination,
  page,
  setPage,
  onEdit,
  onDelete
}) => {
  if (records.length === 0) {
    return (
      <div className={styles['no-records']}>
        <p>Không có dữ liệu lịch sử</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles['table-responsive']}>
        <table className={styles['history-table']}>
          <thead>
            <tr>
              <th>Ngày ghi nhận</th>
              <th>Cân nặng (kg)</th>
              <th>Chiều cao (cm)</th>
              <th>Huyết áp</th>
              <th>Nhịp tim</th>
              <th>Đường huyết</th>
              <th>Nhiệt độ (°C)</th>
              <th>Thời gian ngủ (h)</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.tracking_id}>
                <td>{record.recorded_at ? format(new Date(record.recorded_at), 'dd/MM/yyyy HH:mm') : 'N/A'}</td>
                <td>{record.weight || 'N/A'}</td>
                <td>{record.height || 'N/A'}</td>
                <td>{record.blood_pressure || 'N/A'}</td>
                <td>{record.heart_rate || 'N/A'}</td>
                <td>{record.blood_sugar || 'N/A'}</td>
                <td>{record.temperature || 'N/A'}</td>
                <td>{record.sleep_duration || 'N/A'}</td>
                <td>
                  <div className={styles['history-actions']}>
                    <button 
                      className={`${styles['action-btn']} ${styles['edit-btn']}`} 
                      onClick={() => onEdit(record)}
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className={`${styles['action-btn']} ${styles['delete-btn']}`} 
                      onClick={() => onDelete(record)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}      {pagination.totalPages > 1 && (
        <div className={styles['pagination']}>
          <button 
            className={`${styles['pagination-btn']} ${page === 1 ? styles['pagination-disabled'] : ''}`} 
            onClick={() => setPage(Math.max(page - 1, 1))}
            disabled={page === 1}
          >
            Trước
          </button>
          
          {renderPaginationButtons(page, pagination.totalPages, setPage)}
          
          <button 
            className={`${styles['pagination-btn']} ${page === pagination.totalPages ? styles['pagination-disabled'] : ''}`} 
            onClick={() => setPage(Math.min(page + 1, pagination.totalPages))}
            disabled={page === pagination.totalPages}
          >
            Sau
          </button>
        </div>
      )}
    </>
  );
};

// Helper function for pagination buttons
const renderPaginationButtons = (currentPage: number, totalPages: number, setPageFn: (page: number) => void) => {
  const buttons = [];
  const maxVisibleButtons = 5;
  
  let startPage: number;
  let endPage: number;
  
  if (totalPages <= maxVisibleButtons) {
    // Show all pages if they fit
    startPage = 1;
    endPage = totalPages;
  } else if (currentPage <= 3) {
    // Show first 5 pages
    startPage = 1;
    endPage = 5;
  } else if (currentPage + 2 >= totalPages) {
    // Show last 5 pages
    startPage = totalPages - 4;
    endPage = totalPages;
  } else {
    // Show current page in the middle
    startPage = currentPage - 2;
    endPage = currentPage + 2;
  }
  
  for (let i = startPage; i <= endPage; i++) {
    buttons.push(
      <button 
        key={i} 
        className={`${styles['pagination-btn']} ${i === currentPage ? styles['pagination-active'] : ''}`}
        onClick={() => setPageFn(i)}
      >
        {i}
      </button>
    );
  }
  
  return buttons;
};

export default React.memo(HistoryTable);
