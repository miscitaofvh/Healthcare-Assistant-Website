// src/queries/appointmentQueries.js
import pool from "../config/db.js";

/**
 * Tạo lịch hẹn mới
 */
export const createAppointmentQuery = async ({ appointment_id, patient_id, doctor_id, appointment_time, notes }) => {
  const sql = `
    INSERT INTO appointments
      (appointment_id, patient_id, doctor_id, appointment_time, notes)
    VALUES (?, ?, ?, ?, ?)
  `;
  await pool.execute(sql, [appointment_id, patient_id, doctor_id, appointment_time, notes]);
};

/**
 * Lấy một lịch hẹn theo ID (bao gồm tên bệnh nhân và bác sĩ)
 */
export const getAppointmentByIdQuery = async (appointment_id) => {
  const sql = `
    SELECT
      a.appointment_id,
      a.patient_id,
      p.full_name AS patient_name,
      a.doctor_id,
      u.full_name AS doctor_name,
      a.appointment_time,
      a.status,
      a.notes,
      a.created_at,
      a.updated_at
    FROM appointments a
    JOIN users p    ON p.user_id    = a.patient_id
    JOIN doctors d  ON d.doctor_id         = a.doctor_id
    JOIN users u    ON u.user_id    = d.user_id
    WHERE a.appointment_id = ?
  `;
  const [rows] = await pool.execute(sql, [appointment_id]);
  return rows[0];
};

/**
 * Lấy danh sách lịch hẹn cho bác sĩ (theo user_id của bác sĩ)
 */
export const listAppointmentsForDoctorQuery = async (doctor_user_id) => {
  const sql = `
    SELECT
      a.appointment_id,
      a.patient_id,
      p.full_name AS patient_name,
      a.doctor_id,
      u.full_name AS doctor_name,
      a.appointment_time,
      a.status,
      a.notes
    FROM appointments a
    JOIN doctors d  ON d.doctor_id = a.doctor_id
    JOIN users p    ON p.user_id   = a.patient_id
    JOIN users u    ON u.user_id   = d.user_id
    WHERE d.user_id = ?
    ORDER BY a.appointment_time
  `;
  const [rows] = await pool.execute(sql, [doctor_user_id]);
  return rows;
};

/**
 * Lấy danh sách lịch hẹn cho bệnh nhân
 */
export const listAppointmentsForPatientQuery = async (patient_id) => {
  const sql = `
    SELECT
      a.appointment_id,
      a.patient_id,
      p.full_name AS patient_name,
      a.doctor_id,
      u.full_name AS doctor_name,
      a.appointment_time,
      a.status,
      a.notes
    FROM appointments a
    JOIN users p    ON p.user_id    = a.patient_id
    JOIN doctors d  ON d.doctor_id  = a.doctor_id
    JOIN users u    ON u.user_id    = d.user_id
    WHERE a.patient_id = ?
    ORDER BY a.appointment_time
  `;
  const [rows] = await pool.execute(sql, [patient_id]);
  return rows;
};
