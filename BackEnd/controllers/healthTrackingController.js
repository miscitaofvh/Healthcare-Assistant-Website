import { 
  getHealthTrackingByUserId, 
  getLatestHealthTracking,
  createHealthTracking,
  updateHealthTracking,
  deleteHealthTracking,
  getHealthStats,
  countHealthRecords
} from '../queries/healthTrackingQueries.js';
import HealthTracking from '../models/HealthTracking.js';
import { validationResult } from 'express-validator';

// Get all health tracking records for a user with pagination
const getUserHealthTracking = async (req, res) => {
  try {    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const userId = req.user.user_id;
    
    const records = await getHealthTrackingByUserId(userId, limit, offset);
    const total = await countHealthRecords(userId);
    
    return res.status(200).json({
      success: true,
      data: records,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        perPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching health tracking records:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching health records',
      error: error.message
    });
  }
};

// Get the latest health tracking record
const getLatestHealthRecord = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const record = await getLatestHealthTracking(userId);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'No health records found for this user'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('Error fetching latest health record:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching latest health record',
      error: error.message
    });
  }
};

// Create a new health tracking record
const createHealthRecord = async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
    try {
    const userId = req.user.user_id;
    const healthData = {
      user_id: userId,
      ...req.body
    };
    
    const newRecord = await createHealthTracking(healthData);
    
    return res.status(201).json({
      success: true,
      message: 'Health record created successfully',
      data: newRecord
    });
  } catch (error) {
    console.error('Error creating health record:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating health record',
      error: error.message
    });
  }
};

// Update an existing health tracking record
const updateHealthRecord = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  
  try {
    const trackingId = req.params.id;
    const updated = await updateHealthTracking(trackingId, req.body);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Health record not found or no changes made'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Health record updated successfully'
    });
  } catch (error) {
    console.error('Error updating health record:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating health record',
      error: error.message
    });
  }
};

// Delete a health tracking record
const deleteHealthRecord = async (req, res) => {
  try {
    const trackingId = req.params.id;
    const deleted = await deleteHealthTracking(trackingId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Health record not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Health record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting health record:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting health record',
      error: error.message
    });
  }
};

// Get health tracking statistics for a specific period
const getHealthStatistics = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { startDate, endDate } = req.query;
    
    // Validate date format
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }
    
    const stats = await getHealthStats(userId, startDate, endDate);
    
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching health statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching health statistics',
      error: error.message
    });
  }
};

export {
  getUserHealthTracking,
  getLatestHealthRecord,
  createHealthRecord,
  updateHealthRecord,
  deleteHealthRecord,
  getHealthStatistics
};
