import { v4 as uuidv4 } from 'uuid';
import createError from 'http-errors';
import {
  createAppointmentQuery,
  listAppointmentsForDoctorQuery,
  listAppointmentsForPatientQuery,
  getAppointmentByIdQuery,
  updateAppointmentQuery,
  deleteAppointmentQuery
} from '../queries/appointmentQueries.js';

export const createAppointment = async (req, res, next) => {
  const { doctor_id, appointment_time, notes } = req.body;
  const patient_id = req.user.user_id;

  try {
    const appointment_id = uuidv4();
    await createAppointmentQuery({
      appointment_id,
      patient_id,
      doctor_id,
      appointment_time,
      notes: notes || null
    });

    const appointment = await getAppointmentByIdQuery(appointment_id);
    res.status(201).json({ success: true, appointment });
  } catch (err) {
    next(err);
  }
};

export const getAppointments = async (req, res, next) => {
  try {
    const { user_id, role } = req.user;
    const appointments = role === 'Doctor'
      ? await listAppointmentsForDoctorQuery(user_id)
      : await listAppointmentsForPatientQuery(user_id);

    res.json({ success: true, appointments });
  } catch (err) {
    next(err);
  }
};

export const getAppointmentById = (req, res) => {
  res.json({ success: true, appointment: req.appointment });
};

export const updateAppointment = async (req, res, next) => {
  try {
    const appointment_id = req.params.id;
    const { appointment_time, status, notes } = req.body;

    const fields = [];
    const values = [];
    if (appointment_time) { fields.push('appointment_time = ?'); values.push(appointment_time); }
    if (status)           { fields.push('status = ?');           values.push(status); }
    if (notes !== undefined) { fields.push('notes = ?');         values.push(notes); }

    if (!fields.length) {
      throw createError(400, 'Không có trường nào để cập nhật');
    }

    await updateAppointmentQuery({ appointment_id, fields, values });
    const updated = await getAppointmentByIdQuery(appointment_id);
    res.json({ success: true, appointment: updated });
  } catch (err) {
    next(err);
  }
};

export const deleteAppointment = async (req, res, next) => {
  try {
    const appointment_id = req.params.id;
    await deleteAppointmentQuery(appointment_id);
    res.json({ success: true, message: 'Đã hủy lịch hẹn' });
  } catch (err) {
    next(err);
  }
};
