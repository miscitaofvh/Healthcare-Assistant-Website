import pool from "../config/db.js";

export const createAppointmentQuery = async ({appointment_id, patient_id, doctor_id, appointment_time, patient_notes,}) => 
{
  const sql = `
    INSERT INTO appointments
      (appointment_id, patient_id, doctor_id, appointment_time, patient_notes)
    VALUES (?, ?, ?, ?, ?)
  `;
  await pool.execute(sql, [appointment_id, patient_id, doctor_id, appointment_time, patient_notes,]);
};

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
      a.patient_notes,
      a.doctor_notes,
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

export const listAppointmentsForDoctorQuery = async (doctor_user_id) => 
  {
  const sql = `
    SELECT
      a.appointment_id,
      a.patient_id,
      p.full_name AS patient_name,
      a.doctor_id,
      u.full_name AS doctor_name,
      a.appointment_time,
      a.status,
      a.patient_notes,
      a.doctor_notes
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
      a.patient_notes,
      a.doctor_notes
    FROM appointments a
    JOIN users p    ON p.user_id    = a.patient_id
    JOIN doctors d  ON d.doctor_id  = a.doctor_id
    JOIN users u    ON u.user_id    = d.user_id
    WHERE a.patient_id = ?
      AND a.appointment_time > NOW()
    ORDER BY a.appointment_time
  `;
  const [rows] = await pool.execute(sql, [patient_id]);
  return rows;
};

export const updateAppointmentQuery = async ({ appointment_id, status, doctor_notes }) => {
  const sql = `
    UPDATE appointments
    SET status = ?, doctor_notes = ?
    WHERE appointment_id = ?
  `;
  const [result] = await pool.execute(sql, [status, doctor_notes, appointment_id]);
  return result.affectedRows > 0;
};
