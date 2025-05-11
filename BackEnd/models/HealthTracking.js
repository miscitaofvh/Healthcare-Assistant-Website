import connection from '../config/connection.js';

class HealthTracking {
  // Get all health tracking records for a user
  static async getByUserId(userId, limit = 10, offset = 0) {
    const query = `
      SELECT * 
      FROM health_tracking 
      WHERE user_id = ? 
      ORDER BY recorded_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    try {
      const [rows] = await connection.query(query, [userId, limit, offset]);
      return rows;
    } catch (error) {
      console.error('Error getting health tracking records:', error);
      throw error;
    }
  }

  // Get the latest health tracking record for a user
  static async getLatestByUserId(userId) {
    const query = `
      SELECT * 
      FROM health_tracking 
      WHERE user_id = ? 
      ORDER BY recorded_at DESC 
      LIMIT 1
    `;
    
    try {
      const [rows] = await connection.query(query, [userId]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error getting latest health tracking record:', error);
      throw error;
    }
  }

  // Create a new health tracking record
  static async create(trackingData) {
    const query = `
      INSERT INTO health_tracking (
        user_id, weight, height, blood_pressure, heart_rate, 
        blood_sugar, temperature, sleep_duration, calories_burned, 
        exercise_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    try {
      const [result] = await connection.query(query, [
        trackingData.user_id,
        trackingData.weight || null,
        trackingData.height || null,
        trackingData.blood_pressure || null,
        trackingData.heart_rate || null,
        trackingData.blood_sugar || null,
        trackingData.temperature || null,
        trackingData.sleep_duration || null,
        trackingData.calories_burned || null,
        trackingData.exercise_data || null
      ]);
      
      return { id: result.insertId, ...trackingData };
    } catch (error) {
      console.error('Error creating health tracking record:', error);
      throw error;
    }
  }

  // Update an existing health tracking record
  static async update(trackingId, trackingData) {
    const query = `
      UPDATE health_tracking
      SET 
        weight = ?,
        height = ?,
        blood_pressure = ?,
        heart_rate = ?,
        blood_sugar = ?,
        temperature = ?,
        sleep_duration = ?,
        calories_burned = ?,
        exercise_data = ?
      WHERE tracking_id = ?
    `;
    
    try {
      const [result] = await connection.query(query, [
        trackingData.weight || null,
        trackingData.height || null,
        trackingData.blood_pressure || null,
        trackingData.heart_rate || null,
        trackingData.blood_sugar || null,
        trackingData.temperature || null,
        trackingData.sleep_duration || null,
        trackingData.calories_burned || null,
        trackingData.exercise_data || null,
        trackingId
      ]);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating health tracking record:', error);
      throw error;
    }
  }

  // Delete a health tracking record
  static async delete(trackingId) {
    const query = 'DELETE FROM health_tracking WHERE tracking_id = ?';
    
    try {
      const [result] = await connection.query(query, [trackingId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting health tracking record:', error);
      throw error;
    }
  }

  // Get health tracking statistics (average, min, max) for a specific period
  static async getStats(userId, startDate, endDate) {
    const query = `
      SELECT 
        AVG(weight) as avg_weight,
        MIN(weight) as min_weight,
        MAX(weight) as max_weight,
        AVG(heart_rate) as avg_heart_rate,
        MIN(heart_rate) as min_heart_rate,
        MAX(heart_rate) as max_heart_rate,
        AVG(blood_sugar) as avg_blood_sugar,
        AVG(temperature) as avg_temperature,
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
      console.error('Error getting health tracking stats:', error);
      throw error;
    }
  }
}

export default HealthTracking;
