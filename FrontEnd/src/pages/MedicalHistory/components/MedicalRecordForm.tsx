import React, { useState, useEffect, useRef } from 'react';
import { 
  FaCalendarAlt, 
  FaStethoscope, 
  FaThermometerHalf, 
  FaPills, 
  FaUserMd, 
  FaHospital, 
  FaNotesMedical, 
  FaClipboardList,
  FaPlus,
  FaTrash,
  FaFileUpload,
  FaSpinner
} from 'react-icons/fa';

import { MedicalRecordFormData, Medication } from '../../../types/medicalRecord';
import { parseMedicationsFromString, stringifyMedications, createEmptyMedication } from '../../../utils/medicationUtils';
import { processMedicalRecordFile } from '../medicalRecordFileUtils';
import styles from './styles/MedicalRecordForm.module.css';
import uploadStyles from './styles/fileUpload.module.css';

interface MedicalRecordFormProps {
  initialData: MedicalRecordFormData;
  isEditMode: boolean;
  onSubmit: (e: React.FormEvent, formData: MedicalRecordFormData) => Promise<void> | void;
  onCancel?: () => void;
  error?: string;
  success?: string;
}

const MedicalRecordForm: React.FC<MedicalRecordFormProps> = ({ 
  initialData, 
  isEditMode, 
  onSubmit, 
  onCancel,
}) => {
  const [formData, setFormData] = useState<MedicalRecordFormData>(initialData);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cập nhật form data khi initialData thay đổi
  useEffect(() => {
    setFormData(initialData);
    setMedications(parseMedicationsFromString(initialData.medications));
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Xử lý thay đổi trường trong bảng thuốc
  const handleMedicationChange = (index: number, field: keyof Medication, value: string) => {
    const updatedMedications = [...medications];
    updatedMedications[index] = { 
      ...updatedMedications[index], 
      [field]: value 
    };
    setMedications(updatedMedications);
    
    // Cập nhật trường medications trong formData
    setFormData(prev => ({ 
      ...prev, 
      medications: stringifyMedications(updatedMedications) 
    }));
  };

  // Thêm một dòng thuốc mới
  const handleAddMedication = () => {
    const updatedMedications = [...medications, createEmptyMedication()];
    setMedications(updatedMedications);
    
    // Cập nhật trường medications trong formData
    setFormData(prev => ({ 
      ...prev, 
      medications: stringifyMedications(updatedMedications) 
    }));
  };

  // Xóa một dòng thuốc
  const handleRemoveMedication = (index: number) => {
    const updatedMedications = [...medications];
    updatedMedications.splice(index, 1);
    setMedications(updatedMedications);
    
    // Cập nhật trường medications trong formData
    setFormData(prev => ({ 
      ...prev, 
      medications: stringifyMedications(updatedMedications) 
    }));
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadError(null);
      
      // Display the file being processed
      console.log(`Processing file: ${file.name} (${file.type}, ${file.size} bytes)`);
      
      const result = await processMedicalRecordFile(file);
      
      if (!result.success || !result.data) {
        setUploadError(result.error || 'Failed to process file');
        return;
      }
      
      // Update form with extracted data
      const extractedData = result.data;
      console.log('Received data from OCR processing:', extractedData);
        setFormData(prevData => ({
        ...prevData,
        record_date: extractedData.record_date || prevData.record_date,
        diagnosis: extractedData.diagnosis || prevData.diagnosis,
        symptoms: extractedData.symptoms || prevData.symptoms,
        treatments: extractedData.treatments || prevData.treatments,
        medications: extractedData.medications || prevData.medications,
        doctor_name: extractedData.doctor_name || prevData.doctor_name,
        hospital: extractedData.hospital || prevData.hospital,
        notes: extractedData.notes || prevData.notes,
        record_type: extractedData.record_type || prevData.record_type,
      }));
      
      // Update medications state if medications were extracted
      if (extractedData.medications) {
        try {
          const extractedMedications = parseMedicationsFromString(extractedData.medications);
          if (extractedMedications.length > 0) {
            setMedications(extractedMedications);
          }
        } catch (err) {
          console.error('Error parsing medications:', err);
        }
      }
      
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError('Error uploading file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e, formData);
  };
  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <div className={uploadStyles.uploadFeatureIntro}>
          <h3 className={uploadStyles.uploadTitle}><FaFileUpload /> Tự động nhận dạng thông tin</h3>
          <p className={uploadStyles.uploadDescription}>
            Tải lên hồ sơ y tế để hệ thống tự động nhận dạng và điền thông tin, giúp bạn tiết kiệm thời gian.
          </p>
        </div>
        <div className={uploadStyles.fileUploadContainer}>
          <input
            type="file"
            ref={fileInputRef}
            className={uploadStyles.fileInput}
            accept=".jpg,.jpeg,.png,.pdf,.docx,.txt"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className={uploadStyles.fileUploadButton}
            onClick={triggerFileInput}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <FaSpinner className={uploadStyles.spinnerIcon} /> Đang xử lý...
              </>
            ) : (
              <>
                <FaFileUpload /> Tải lên hình ảnh hoặc tài liệu
              </>
            )}
          </button>
          <p className={uploadStyles.fileUploadHint}>
            Hỗ trợ file: .jpg, .png, .pdf, .docx, .txt
          </p>
          {uploadError && (
            <p className={uploadStyles.uploadError}>{uploadError}</p>
          )}
        </div>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label className={`${styles.formLabel} ${styles.requiredField}`} htmlFor="record_date">
            <FaCalendarAlt /> Ngày khám
          </label>
          <input
            type="date"
            id="record_date"
            name="record_date"
            className={styles.formInput}
            value={formData.record_date}
            onChange={handleInputChange}
            required
            max={new Date().toISOString().slice(0, 10)}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={`${styles.formLabel} ${styles.requiredField}`} htmlFor="record_type">
            <FaClipboardList /> Loại hồ sơ
          </label>
          <select
            id="record_type"
            name="record_type"
            className={styles.formSelect}
            value={formData.record_type}
            onChange={handleInputChange}
            required
          >
            <option value="">-- Chọn loại hồ sơ --</option>
            <option value="checkup">Khám thông thường</option>
            <option value="hospitalization">Nhập viện</option>
            <option value="surgery">Phẫu thuật</option>
            <option value="other">Khác</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={`${styles.formLabel} ${styles.requiredField}`} htmlFor="diagnosis">
            <FaStethoscope /> Chẩn đoán
          </label>
          <input
            type="text"
            id="diagnosis"
            name="diagnosis"
            className={styles.formInput}
            placeholder="Ví dụ: Viêm họng cấp"
            value={formData.diagnosis}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="doctor_name">
            <FaUserMd /> Bác sĩ
          </label>
          <input
            type="text"
            id="doctor_name"
            name="doctor_name"
            className={styles.formInput}
            placeholder="Tên bác sĩ điều trị"
            value={formData.doctor_name}
            onChange={handleInputChange}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="hospital">
            <FaHospital /> Bệnh viện/Phòng khám
          </label>
          <input
            type="text"
            id="hospital"
            name="hospital"
            className={styles.formInput}
            placeholder="Tên cơ sở y tế"
            value={formData.hospital}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={`${styles.formLabel} ${styles.requiredField}`} htmlFor="symptoms">
          <FaThermometerHalf /> Triệu chứng
        </label>
        <textarea
          id="symptoms"
          name="symptoms"
          className={styles.formTextarea}
          placeholder="Mô tả chi tiết các triệu chứng"
          value={formData.symptoms}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel} htmlFor="treatments">
          <FaNotesMedical /> Phương pháp điều trị
        </label>
        <textarea
          id="treatments"
          name="treatments"
          className={styles.formTextarea}
          placeholder="Mô tả phương pháp điều trị"
          value={formData.treatments}
          onChange={handleInputChange}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>
          <FaPills /> Thuốc đã kê
        </label>
        
        <div className={styles.medicationsTableContainer}>
          <table className={styles.medicationsTable}>
            <thead>
              <tr>
                <th>Tên thuốc</th>
                <th>Liều dùng</th>
                <th>Cách dùng</th>
                <th>Thời gian</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {medications.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.medicationEmptyRow}>
                    Chưa có thuốc nào được thêm vào
                  </td>
                </tr>
              ) : (
                medications.map((medication, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="text"
                        className={styles.medicationsTableInput}
                        placeholder="Tên thuốc"
                        value={medication.name}
                        onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className={styles.medicationsTableInput}
                        placeholder="Liều dùng"
                        value={medication.dosage}
                        onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className={styles.medicationsTableInput}
                        placeholder="Cách dùng"
                        value={medication.instructions}
                        onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className={styles.medicationsTableInput}
                        placeholder="Thời gian"
                        value={medication.duration}
                        onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                      />
                    </td>
                    <td className={styles.medicationActions}>
                      <button
                        type="button"
                        className={`${styles.medicationActionButton} ${styles.medicationDeleteButton}`}
                        onClick={() => handleRemoveMedication(index)}
                        title="Xóa thuốc này"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <button
          type="button"
          className={styles.medicationAddButton}
          onClick={handleAddMedication}
        >
          <FaPlus /> Thêm thuốc
        </button>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel} htmlFor="notes">
          <FaNotesMedical /> Ghi chú
        </label>
        <textarea
          id="notes"
          name="notes"
          className={styles.formTextarea}
          placeholder="Ghi chú thêm"
          value={formData.notes}
          onChange={handleInputChange}
        />      </div>

      <div className={styles.buttonGroup}>
        {onCancel && (
          <button type="button" className={`${styles.button} ${styles.secondaryButton}`} onClick={onCancel}>
            Hủy
          </button>
        )}
        <button type="submit" className={`${styles.button} ${styles.primaryButton}`}>
          {isEditMode ? 'Cập nhật hồ sơ' : 'Thêm hồ sơ'}
        </button>
      </div>
    </form>
  );
};

export default MedicalRecordForm;
