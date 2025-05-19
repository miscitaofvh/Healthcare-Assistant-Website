import * as medicalRecordQueries from '../queries/medicalRecordQueries.js';
import { validationResult } from 'express-validator';

// Lấy danh sách hồ sơ bệnh án của người dùng đã đăng nhập
export const getMedicalRecords = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.user_id; // Lấy user ID từ token xác thực
    
    const result = await medicalRecordQueries.getMedicalRecords(
      userId, 
      parseInt(page), 
      parseInt(limit)
    );
    
    return res.status(200).json({
      success: true,
      data: result.records,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error in getMedicalRecords:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Lấy chi tiết hồ sơ bệnh án theo ID
export const getMedicalRecordById = async (req, res) => {
  try {
    const { recordId } = req.params;
    const userId = req.user.user_id; // Lấy user ID từ token xác thực
    
    const record = await medicalRecordQueries.getMedicalRecordById(recordId, userId);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('Error in getMedicalRecordById:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Thêm hồ sơ bệnh án mới
export const createMedicalRecord = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }
    
    const userId = req.user.user_id; // Lấy user ID từ token xác thực
    const recordData = {
      ...req.body,
      user_id: userId
    };
    
    const newRecord = await medicalRecordQueries.createMedicalRecord(recordData);
    
    return res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      data: newRecord
    });
  } catch (error) {
    console.error('Error in createMedicalRecord:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Cập nhật hồ sơ bệnh án
export const updateMedicalRecord = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }
    
    const { recordId } = req.params;
    const userId = req.user.user_id; // Lấy user ID từ token xác thực
    
    const updatedRecord = await medicalRecordQueries.updateMedicalRecord(
      recordId,
      userId,
      req.body
    );
    
    if (!updatedRecord) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found or you do not have permission to update'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Medical record updated successfully',
      data: updatedRecord
    });
  } catch (error) {
    console.error('Error in updateMedicalRecord:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// No deletion functionality allowed for medical records
// These functions have been removed as per the requirement that
// medical records should never be deleted.;
