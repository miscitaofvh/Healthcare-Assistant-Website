import React from 'react';
import { FaCalendarAlt, FaHospital, FaUserMd, FaEdit, FaStethoscope, FaPills } from 'react-icons/fa';
import { MedicalRecord } from '../../../types/medicalRecord';
import { parseMedicationsFromString } from '../../../utils/medicationUtils';
import styles from './styles/MedicalRecordList.module.css';
import globalStyles from '../MedicalHistory.module.css';

interface MedicalRecordListProps {
  records: MedicalRecord[];
  onEdit: (record: MedicalRecord) => void;
}

const MedicalRecordList: React.FC<MedicalRecordListProps> = ({ records, onEdit }) => {
  // Hàm định dạng ngày tháng
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  // Hàm lấy tên loại hồ sơ
  const getRecordTypeName = (type?: string) => {
    switch (type) {
      case 'checkup':
        return 'Khám thông thường';
      case 'hospitalization':
        return 'Nhập viện';
      case 'surgery':
        return 'Phẫu thuật';
      case 'other':
        return 'Khác';
      default:
        return 'Không xác định';
    }
  };

  return (
    <div className={styles.recordsList}>
      {records.length === 0 ? (
        <div className={styles.emptyState}>
          <FaStethoscope className={styles.emptyStateIcon} />
          <p className={styles.emptyStateText}>Chưa có hồ sơ bệnh án nào</p>
        </div>
      ) : (
        records.map((record) => (          <div key={record.record_id} className={styles.recordCard}>
            <div className={styles.recordHeader}>
              <h3 className={styles.recordTitle}>{record.diagnosis}</h3>
              <span className={styles.recordDate}>
                <FaCalendarAlt /> {formatDate(record.record_date)}
              </span>
            </div>
              <div className={styles.recordContent}>              <div className={styles.recordItem}>
                <span className={styles.recordLabel}>Loại hồ sơ:</span>
                <span className={styles.recordValue}>{getRecordTypeName(record.record_type)}</span>
              </div>
              
              {record.hospital && (
                <div className={`${styles.recordItem} ${globalStyles.item}`}>
                  <span className={`${styles.recordLabel} ${globalStyles.label}`}>Bệnh viện:</span>
                  <span className={`${styles.recordValue} ${globalStyles.value}`}>
                    <FaHospital /> {record.hospital}
                  </span>
                </div>
              )}
              
              {record.doctor_name && (
                <div className={`${styles.recordItem} ${globalStyles.item}`}>
                  <span className={`${styles.recordLabel} ${globalStyles.label}`}>Bác sĩ:</span>
                  <span className={`${styles.recordValue} ${globalStyles.value}`}>
                    <FaUserMd /> {record.doctor_name}
                  </span>
                </div>
              )}
            </div>
            
            <div className={`${styles.recordDetailsGrid} ${globalStyles.detailsGrid}`}>              {record.symptoms && (
                <div className={`${styles.recordItem} ${globalStyles.item}`}>
                  <span className={`${styles.recordLabel} ${globalStyles.label}`}>Triệu chứng:</span>
                  <span className={`${styles.recordValue} ${globalStyles.value}`}>{record.symptoms}</span>
                </div>
              )}
              
              {record.treatments && (
                <div className={`${styles.recordItem} ${globalStyles.item}`}>
                  <span className={`${styles.recordLabel} ${globalStyles.label}`}>Điều trị:</span>
                  <span className={`${styles.recordValue} ${globalStyles.value}`}>{record.treatments}</span>
                </div>
              )}
            </div>
            
            {record.medications && record.medications.trim() !== '' && (
              <div className={`${styles.recordItem} ${globalStyles.item}`} style={{ marginTop: '1rem', width: '100%' }}>
                <span className={`${styles.recordLabel} ${globalStyles.label}`}>
                  <FaPills /> Thuốc đã kê:
                </span>
                
                <MedicationsTable medications={record.medications} />
              </div>
            )}

            {record.notes && (
              <div className={`${styles.recordItem} ${globalStyles.item}`} style={{ marginTop: '1rem' }}>
                <span className={`${styles.recordLabel} ${globalStyles.label}`}>Ghi chú:</span>
                <span className={`${styles.recordValue} ${globalStyles.value}`}>{record.notes}</span>
              </div>
            )}
              
            <div className={`${styles.recordActions} ${globalStyles.actions}`}>
              <button 
                onClick={() => onEdit(record)} 
                className={`${styles.actionButton} ${styles.editButton} ${globalStyles.button}`}
              >
                <FaEdit /> Chỉnh sửa
              </button>
              {/* Deletion is not allowed for medical records */}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// Component hiển thị bảng thuốc
const MedicationsTable: React.FC<{ medications: string }> = ({ medications }) => {
  const medicationsList = parseMedicationsFromString(medications);
  
  if (medicationsList.length === 0) {
    return <div>Không có thông tin về thuốc</div>;
  }
  
  return (
    <table className={`${styles.readOnlyMedicationsTable} ${globalStyles.table}`}>
      <thead>
        <tr>
          <th>Tên thuốc</th>
          <th>Liều dùng</th>
          <th>Cách dùng</th>
          <th>Thời gian</th>
        </tr>
      </thead>
      <tbody>
        {medicationsList.map((medication, index) => (
          <tr key={index}>
            <td>{medication.name}</td>
            <td>{medication.dosage}</td>
            <td>{medication.instructions}</td>
            <td>{medication.duration}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default MedicalRecordList;
