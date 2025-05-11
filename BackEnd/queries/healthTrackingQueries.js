import connection from '../config/connection.js';

// Get all health tracking records for a user
const getHealthTrackingByUserId = async (userId, limit = 10, offset = 0) => {
  const query = `
    SELECT * FROM health_tracking 
    WHERE user_id = ? 
    ORDER BY recorded_at DESC 
    LIMIT ? OFFSET ?
  `;
  
  try {
    const [rows] = await connection.query(query, [userId, limit, offset]);
    return rows;
  } catch (error) {
    throw error;
  }
};

// Get latest health record
const getLatestHealthTracking = async (userId) => {
  const query = `
    SELECT * FROM health_tracking 
    WHERE user_id = ? 
    ORDER BY recorded_at DESC 
    LIMIT 1
  `;
  
  try {
    const [rows] = await connection.query(query, [userId]);
    return rows[0] || null;
  } catch (error) {
    throw error;
  }
};

// Create health record
const createHealthTracking = async (healthData) => {
  const query = `
    INSERT INTO health_tracking (
      user_id, weight, height, blood_pressure, heart_rate, 
      blood_sugar, temperature, sleep_duration, calories_burned, exercise_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  try {
    const [result] = await connection.query(query, [
      healthData.user_id,
      healthData.weight || null,
      healthData.height || null,
      healthData.blood_pressure || null,
      healthData.heart_rate || null,
      healthData.blood_sugar || null,
      healthData.temperature || null,
      healthData.sleep_duration || null,
      healthData.calories_burned || null,
      healthData.exercise_data || null
    ]);
    
    return { tracking_id: result.insertId, ...healthData };
  } catch (error) {
    throw error;
  }
};

// Update health record
const updateHealthTracking = async (trackingId, healthData) => {
  const query = `
    UPDATE health_tracking
    SET 
      weight = IFNULL(?, weight),
      height = IFNULL(?, height),
      blood_pressure = IFNULL(?, blood_pressure),
      heart_rate = IFNULL(?, heart_rate),
      blood_sugar = IFNULL(?, blood_sugar),
      temperature = IFNULL(?, temperature),
      sleep_duration = IFNULL(?, sleep_duration),
      calories_burned = IFNULL(?, calories_burned),
      exercise_data = IFNULL(?, exercise_data)
    WHERE tracking_id = ?
  `;
  
  try {
    const [result] = await connection.query(query, [
      healthData.weight || null,
      healthData.height || null,
      healthData.blood_pressure || null,
      healthData.heart_rate || null,
      healthData.blood_sugar || null,
      healthData.temperature || null,
      healthData.sleep_duration || null,
      healthData.calories_burned || null,
      healthData.exercise_data || null,
      trackingId
    ]);
    
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

// Delete health record
const deleteHealthTracking = async (trackingId) => {
  const query = 'DELETE FROM health_tracking WHERE tracking_id = ?';
  
  try {
    const [result] = await connection.query(query, [trackingId]);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

// Get health statistics for a period
const getHealthStats = async (userId, startDate, endDate) => {
  const query = `
    SELECT 
      AVG(weight) as avg_weight,
      MIN(weight) as min_weight,
      MAX(weight) as max_weight,
      AVG(heart_rate) as avg_heart_rate,
      MIN(heart_rate) as min_heart_rate,
      MAX(heart_rate) as max_heart_rate,
      AVG(blood_sugar) as avg_blood_sugar,
      MIN(blood_sugar) as min_blood_sugar,
      MAX(blood_sugar) as max_blood_sugar,
      AVG(temperature) as avg_temperature,
      MIN(temperature) as min_temperature,
      MAX(temperature) as max_temperature,
      AVG(sleep_duration) as avg_sleep_duration,
      AVG(calories_burned) as avg_calories_burned
    FROM health_tracking
    WHERE user_id = ? 
      AND recorded_at BETWEEN ? AND ?
  `;
  
  try {
    const [rows] = await connection.query(query, [userId, startDate, endDate]);
    return rows[0];
  } catch (error) {
    throw error;
  }
};

// Count total health records for a user
const countHealthRecords = async (userId) => {
  const query = 'SELECT COUNT(*) as total FROM health_tracking WHERE user_id = ?';
  
  try {
    const [rows] = await connection.query(query, [userId]);
    return rows[0].total;
  } catch (error) {
    throw error;
  }
};

export {
  getHealthTrackingByUserId,
  getLatestHealthTracking,
  createHealthTracking,
  updateHealthTracking,
  deleteHealthTracking,
  getHealthStats,
  countHealthRecords
};
