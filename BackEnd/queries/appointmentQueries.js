import pool from "../config/db.js";

export const createAppointmentQuery = async ({ appointment_id, patient_id, doctor_id, appointment_time, notes }) => {
  const sql = `
    INSERT INTO appointments
      (appointment_id, patient_id, doctor_id, appointment_time, notes)
    VALUES (?, ?, ?, ?, ?)
  `;
  await pool.execute(sql, [appointment_id, patient_id, doctor_id, appointment_time, notes]);
};

export const getAppointmentByIdQuery = async (appointment_id) => {
  const sql = `SELECT * FROM appointments WHERE appointment_id = ?`;
  const [rows] = await pool.execute(sql, [appointment_id]);
  return rows[0];
};

export const listAppointmentsForDoctorQuery = async (doctor_id) => {
  const sql = `
    SELECT a.*, u.full_name AS patient_name
    FROM appointments a
    JOIN users u ON u.user_id = a.patient_id
    WHERE a.doctor_id = ?
    ORDER BY a.appointment_time
  `;
  const [rows] = await pool.execute(sql, [doctor_id]);
  return rows;
};

export const listAppointmentsForPatientQuery = async (patient_id) => {
  const sql = `
    SELECT a.*, u.full_name AS doctor_name
    FROM appointments a
    JOIN users u ON u.user_id = a.doctor_id
    WHERE a.patient_id = ?
    ORDER BY a.appointment_time
  `;
  const [rows] = await pool.execute(sql, [patient_id]);
  return rows;
};

export const updateAppointmentQuery = async ({ appointment_id, fields, values }) => {
  const sql = `
    UPDATE appointments
    SET ${fields.join(', ')}
    WHERE appointment_id = ?
  `;
  await pool.execute(sql, [...values, appointment_id]);
};

export const deleteAppointmentQuery = async (appointment_id) => {
  const sql = `DELETE FROM appointments WHERE appointment_id = ?`;
  await pool.execute(sql, [appointment_id]);
};