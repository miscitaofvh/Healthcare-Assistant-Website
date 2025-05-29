import React from 'react';
import { 
  FaCalendarAlt, 
  FaUserMd, 
  FaHospital, 
  FaPrescriptionBottleAlt,
  FaStethoscope,
  FaFileAlt,
  FaTimes,
  FaEdit,
  FaTrash
} from 'react-icons/fa';
import { MedicalRecord, Medication } from '../../../types/medicalRecord';
import { parseMedicationsFromString } from '../../../utils/medicationUtils';
import styles from './MedicalRecordDetailModal.module.css';

interface MedicalRecordDetailModalProps {
  record: MedicalRecord;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (record: MedicalRecord) => void;
  onDelete?: (recordId: string) => void;
}

const MedicalRecordDetailModal: React.FC<MedicalRecordDetailModalProps> = ({
  record,
  isOpen,
  onClose,
  onEdit,
  onDelete
}) => {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <div className={styles.typeIndicator} style={{ backgroundColor: typeInfo.color }}>
              <TypeIcon className={styles.typeIcon} />
              <span className={styles.typeLabel}>{typeInfo.label}</span>
            </div>
            <div className={styles.headerActions}>
              <button 
                className={`${styles.actionBtn} ${styles.editBtn}`}
                onClick={() => onEdit(record)}
                title="Chỉnh sửa"
              >
                <FaEdit />
              </button>
              {onDelete && (
                <button 
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  onClick={() => onDelete(record.record_id || '')}
                  title="Xóa"
                >
                  <FaTrash />
                </button>
              )}
              <button 
                className={`${styles.actionBtn} ${styles.closeBtn}`}
                onClick={onClose}
                title="Đóng"
              >
                <FaTimes />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* Date */}
          <div className={styles.recordDate}>
            <FaCalendarAlt className={styles.dateIcon} />
            <span>{formatDate(record.record_date || '')}</span>
          </div>

          {/* Main Content */}
          <div className={styles.contentGrid}>
            {/* Diagnosis */}
            <div className={styles.section}>
              <h2 className={styles.diagnosis}>{record.diagnosis}</h2>
            </div>

            {/* Symptoms */}
            {record.symptoms && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Triệu chứng</h3>
                <p className={styles.sectionContent}>{record.symptoms}</p>
              </div>
            )}

            {/* Treatments */}
            {record.treatments && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Điều trị</h3>
                <p className={styles.sectionContent}>{record.treatments}</p>
              </div>
            )}

            {/* Medications */}
            {record.medications && (
              <div className={styles.section}>
                <div className={styles.medicationSection}>
                  <FaPrescriptionBottleAlt className={styles.medicationIcon} />
                  <div className={styles.medicationContent}>
                    <h3 className={styles.sectionTitle}>Thuốc đã kê</h3>
                    <div className={styles.medicationList}>
                      {(() => {
                        try {
                          const medications = parseMedicationsFromString(record.medications);
                          if (medications.length === 0) {
                            return <p className={styles.sectionContent}>Không có thuốc</p>;
                          }
                          return medications.map((medication: Medication, index: number) => (
                            <div key={index} className={styles.medicationItem}>
                              <div className={styles.medicationHeader}>
                                <h4 className={styles.medicationName}>{medication.name}</h4>
                                <span className={styles.dosage}>{medication.dosage}</span>
                              </div>
                              <div className={styles.medicationDetails}>
                                {medication.instructions && (
                                  <div className={styles.instructions}>
                                    <strong>Cách dùng:</strong> {medication.instructions}
                                  </div>
                                )}
                                {medication.duration && (
                                  <div className={styles.duration}>
                                    <strong>Thời gian:</strong> {medication.duration}
                                  </div>
                                )}
                              </div>
                            </div>
                          ));
                        } catch (error) {
                          return <p className={styles.sectionContent}>{record.medications}</p>;
                        }
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {record.notes && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Ghi chú</h3>
                <div className={styles.notesContent}>
                  <p>{record.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          {record.doctor_name && (
            <div className={styles.doctorInfo}>
              <FaUserMd className={styles.doctorIcon} />
              <span>Bác sĩ: {record.doctor_name}</span>
            </div>
          )}
          
          {record.hospital && (
            <div className={styles.hospitalInfo}>
              <FaHospital className={styles.hospitalIcon} />
              <span>Cơ sở y tế: {record.hospital}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalRecordDetailModal;
