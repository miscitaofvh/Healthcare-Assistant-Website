import { useState, useEffect } from 'react';
import { FaWeight, FaRuler, FaHeartbeat, FaThermometerHalf, FaBed, FaFire, FaTint, FaCalendarAlt } from 'react-icons/fa';
import { FormData } from '../../../types/healthTracking';
import styles from '../HealthTracking.module.css';

interface HealthMetricFormProps {
  initialData: FormData;
  isEditMode: boolean;
  onSubmit: (e: React.FormEvent, formData: FormData) => Promise<void> | void;
  onCancel?: () => void;
  error?: string;
  success?: string;
  resetAfterSubmit?: boolean; // New prop to control form reset behavior
}

const HealthMetricForm: React.FC<HealthMetricFormProps> = ({ 
  initialData, 
  isEditMode, 
  onSubmit, 
  onCancel,
  resetAfterSubmit = false // Default to false for backward compatibility
}) => {
  const [formData, setFormData] = useState<FormData>(initialData);

  // Update form data when initialData changes
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e, formData);
    
    // If resetAfterSubmit is true and not in edit mode, reset form to empty values
    if (resetAfterSubmit && !isEditMode) {
      // Use setTimeout to ensure the form is reset after the submission completes
      setTimeout(() => {
        setFormData({
          weight: '',
          height: '',
          blood_pressure: '',
          heart_rate: '',
          blood_sugar: '',
          temperature: '',
          sleep_duration: '',
          calories_burned: '',
          exercise_data: '',
        });
      }, 100);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles['form-grid']}>
        <div className={styles['form-group']}>
          <label className={styles['form-label']} htmlFor="weight">
            <FaWeight className={styles['form-icon']} /> Cân nặng (kg)
          </label>
          <input
            type="number"
            id="weight"
            name="weight"
            className={styles['form-input']}
            placeholder="Ví dụ: 65"
            value={formData.weight}
            onChange={handleInputChange}
            step="0.1"
            min="1"
            max="500"
          />
        </div>

        <div className={styles['form-group']}>
          <label className={styles['form-label']} htmlFor="height">
            <FaRuler className={styles['form-icon']} /> Chiều cao (cm)
          </label>
          <input
            type="number"
            id="height"
            name="height"
            className={styles['form-input']}
            placeholder="Ví dụ: 170"
            value={formData.height}
            onChange={handleInputChange}
            step="0.1"
            min="10"
            max="300"
          />
        </div>

        <div className={styles['form-group']}>
          <label className={styles['form-label']} htmlFor="blood_pressure">
            <FaTint className={styles['form-icon']} /> Huyết áp (mmHg)
          </label>
          <input
            type="text"
            id="blood_pressure"
            name="blood_pressure"
            className={styles['form-input']}
            placeholder="Ví dụ: 120/80"
            value={formData.blood_pressure}
            onChange={handleInputChange}
            pattern="^\d{1,3}/\d{1,3}$"
            title="Nhập theo định dạng: 120/80"
          />
        </div>

        <div className={styles['form-group']}>
          <label className={styles['form-label']} htmlFor="heart_rate">
            <FaHeartbeat className={styles['form-icon']} /> Nhịp tim (BPM)
          </label>
          <input
            type="number"
            id="heart_rate"
            name="heart_rate"
            className={styles['form-input']}
            placeholder="Ví dụ: 75"
            value={formData.heart_rate}
            onChange={handleInputChange}
            min="30"
            max="250"
          />
        </div>

        <div className={styles['form-group']}>
          <label className={styles['form-label']} htmlFor="blood_sugar">
            <FaCalendarAlt className={styles['form-icon']} /> Đường huyết (mmol/L)
          </label>
          <input
            type="number"
            id="blood_sugar"
            name="blood_sugar"
            className={styles['form-input']}
            placeholder="Ví dụ: 5.5"
            value={formData.blood_sugar}
            onChange={handleInputChange}
            step="0.1"
            min="1"
            max="50"
          />
        </div>

        <div className={styles['form-group']}>
          <label className={styles['form-label']} htmlFor="temperature">
            <FaThermometerHalf className={styles['form-icon']} /> Nhiệt độ cơ thể (°C)
          </label>
          <input
            type="number"
            id="temperature"
            name="temperature"
            className={styles['form-input']}
            placeholder="Ví dụ: 36.5"
            value={formData.temperature}
            onChange={handleInputChange}
            step="0.1"
            min="30"
            max="45"
          />
        </div>

        <div className={styles['form-group']}>
          <label className={styles['form-label']} htmlFor="sleep_duration">
            <FaBed className={styles['form-icon']} /> Thời gian ngủ (giờ)
          </label>
          <input
            type="number"
            id="sleep_duration"
            name="sleep_duration"
            className={styles['form-input']}
            placeholder="Ví dụ: 8"
            value={formData.sleep_duration}
            onChange={handleInputChange}
            min="0"
            max="24"
          />
        </div>

        <div className={styles['form-group']}>
          <label className={styles['form-label']} htmlFor="calories_burned">
            <FaFire className={styles['form-icon']} /> Calories đã đốt (kcal)
          </label>
          <input
            type="number"
            id="calories_burned"
            name="calories_burned"
            className={styles['form-input']}
            placeholder="Ví dụ: 500"
            value={formData.calories_burned}
            onChange={handleInputChange}
            min="0"
            max="10000"
          />
        </div>

        <div className={`${styles['form-group']} ${styles['form-group-full']}`}>
          <label className={styles['form-label']} htmlFor="exercise_data">
            <FaCalendarAlt className={styles['form-icon']} /> Ghi chú hoạt động thể chất
          </label>
          <textarea
            id="exercise_data"
            name="exercise_data"
            className={styles['form-textarea']}
            placeholder="Mô tả các hoạt động thể chất của bạn (nếu có)"
            value={formData.exercise_data}
            onChange={handleInputChange}
          ></textarea>
        </div>
      </div>     

      <div className={styles['form-actions']}>
        {onCancel && (
          <button type="button" className={styles['cancel-btn']} onClick={onCancel}>
            Hủy
          </button>
        )}
        <button type="submit" className={styles['submit-btn']}>
          {isEditMode ? 'Cập nhật' : 'Lưu thông tin'}
        </button>
      </div>
    </form>
  );
};

export default HealthMetricForm;
