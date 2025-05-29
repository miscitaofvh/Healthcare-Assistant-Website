import React from 'react';
import { 
  FaCalendarAlt, 
  FaUserMd, 
  FaStethoscope, 
  FaHospital,
  FaEdit,
  FaTrash,
  FaEye,
  FaFileAlt,
  FaChevronRight
} from 'react-icons/fa';
import { MedicalRecord } from '../../../types/medicalRecord';
import styles from './CompactMedicalRecordCard.module.css';

interface CompactMedicalRecordCardProps {
  record: MedicalRecord;
  onEdit: (record: MedicalRecord) => void;
  onDelete?: (recordId: string) => void;
  onView?: (record: MedicalRecord) => void;
}

const CompactMedicalRecordCard: React.FC<CompactMedicalRecordCardProps> = ({
  record,
  onEdit,
  onDelete,
  onView
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRecordTypeInfo = (type: string) => {
    const types = {
      checkup: { label: 'Khám tổng quát', color: '#10b981', icon: FaStethoscope },
      hospitalization: { label: 'Nhập viện', color: '#f59e0b', icon: FaHospital },
      surgery: { label: 'Phẫu thuật', color: '#ef4444', icon: FaUserMd },
      consultation: { label: 'Tư vấn', color: '#3b82f6', icon: FaStethoscope },
      followup: { label: 'Tái khám', color: '#8b5cf6', icon: FaCalendarAlt },
      other: { label: 'Khác', color: '#6b7280', icon: FaFileAlt }
    };
    return types[type as keyof typeof types] || types.other;
  };

  const typeInfo = getRecordTypeInfo(record.record_type || 'other');
  const TypeIcon = typeInfo.icon;

  const handleCardClick = () => {
    if (onView) {
      onView(record);
    }
  };

  return (
    <div className={styles.compactCard} onClick={handleCardClick}>
      <div className={styles.cardContent}>
        <div className={styles.mainInfo}>
          <div className={styles.typeIndicator} style={{ backgroundColor: typeInfo.color }}>
            <TypeIcon className={styles.typeIcon} />
          </div>
          
          <div className={styles.recordDetails}>
            <h3 className={styles.diagnosis}>{record.diagnosis}</h3>
            <div className={styles.metadata}>
              <div className={styles.dateInfo}>
                <FaCalendarAlt className={styles.dateIcon} />
                <span>{formatDate(record.record_date || '')}</span>
              </div>
              {record.doctor_name && (
                <div className={styles.doctorInfo}>
                  <FaUserMd className={styles.doctorIcon} />
                  <span>BS. {record.doctor_name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.cardActions}>
          <button 
            className={`${styles.actionBtn} ${styles.viewBtn}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onView) onView(record);
            }}
            title="Xem chi tiết"
          >
            <FaEye />
          </button>
          <button 
            className={`${styles.actionBtn} ${styles.editBtn}`}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(record);
            }}
            title="Chỉnh sửa"
          >
            <FaEdit />
          </button>
          {onDelete && (
            <button 
              className={`${styles.actionBtn} ${styles.deleteBtn}`}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(record.record_id || '');
              }}
              title="Xóa"
            >
              <FaTrash />
            </button>
          )}
          <div className={styles.expandIcon}>
            <FaChevronRight />
          </div>
        </div>
      </div>
      
      <div className={styles.typeLabel}>
        <span className={styles.typeText}>{typeInfo.label}</span>
      </div>
    </div>
  );
};

export default CompactMedicalRecordCard;
