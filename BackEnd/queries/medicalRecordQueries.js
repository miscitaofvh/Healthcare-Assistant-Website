import pool from '../config/connection.js';

// Lấy tất cả hồ sơ bệnh án của người dùng với phân trang
export const getMedicalRecords = async (userId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  
  try {
    // Lấy tổng số record
    const countQuery = 'SELECT COUNT(*) as total FROM medical_records WHERE user_id = ?';
    const countResult = await pool.query(countQuery, [userId]);
    const total = countResult[0][0].total;
    
    // Lấy danh sách record với phân trang
    const query = `
      SELECT * FROM medical_records 
      WHERE user_id = ? 
      ORDER BY record_date DESC, created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const results = await pool.query(query, [userId, parseInt(limit), offset]);
    
    return {
      records: results[0],
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        perPage: parseInt(limit)
      }
    };
  } catch (error) {
    throw error;
  }
};

// Lấy chi tiết hồ sơ bệnh án theo ID
export const getMedicalRecordById = async (recordId, userId) => {
  try {
    const query = 'SELECT * FROM medical_records WHERE record_id = ? AND user_id = ?';
    const results = await pool.query(query, [recordId, userId]);
    
    if (results[0].length === 0) {
      return null;
    }
    
    return results[0][0];
  } catch (error) {
    throw error;
  }
};

// Thêm hồ sơ bệnh án mới
export const createMedicalRecord = async (recordData) => {
  try {
    const query = `
      INSERT INTO medical_records (
        user_id, record_date, diagnosis, symptoms, treatments, 
        medications, doctor_name, hospital, notes, record_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      recordData.user_id,
      recordData.record_date,
      recordData.diagnosis,
      recordData.symptoms,
      recordData.treatments,
      recordData.medications,
      recordData.doctor_name,
      recordData.hospital,
      recordData.notes,
      recordData.record_type
    ];
    
    const result = await pool.query(query, params);
    
    if (result[0].affectedRows === 0) {
      throw new Error('Failed to create medical record');
    }
    
    // Lấy record vừa tạo
    return await getMedicalRecordById(result[0].insertId, recordData.user_id);
  } catch (error) {
    throw error;
  }
};

// Cập nhật hồ sơ bệnh án
export const updateMedicalRecord = async (recordId, userId, recordData) => {
  try {
    // Kiểm tra xem record có tồn tại và thuộc về user này không
    const existingRecord = await getMedicalRecordById(recordId, userId);
    if (!existingRecord) {
      return null;
    }
    
    const query = `
      UPDATE medical_records 
      SET 
        record_date = ?, 
        diagnosis = ?, 
        symptoms = ?, 
        treatments = ?, 
        medications = ?, 
        doctor_name = ?, 
        hospital = ?, 
        notes = ?, 
        record_type = ?
      WHERE record_id = ? AND user_id = ?
    `;
    
    const params = [
      recordData.record_date,
      recordData.diagnosis,
      recordData.symptoms,
      recordData.treatments,
      recordData.medications,
      recordData.doctor_name,
      recordData.hospital,
      recordData.notes,
      recordData.record_type,
      recordId,
      userId
    ];
    
    const result = await pool.query(query, params);
    
    if (result[0].affectedRows === 0) {
      return null;
    }
      // Lấy record đã cập nhật
    return await getMedicalRecordById(recordId, userId);
  } catch (error) {
    throw error;
  }
};
