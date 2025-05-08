// src/controllers/appointmentController.js
import { v4 as uuidv4 } from 'uuid';
import createError from 'http-errors';
import {
  createAppointmentQuery,
  listAppointmentsForDoctorQuery,
  listAppointmentsForPatientQuery,
  getAppointmentByIdQuery
} from '../queries/appointmentQueries.js';

/**
 * Controller: Tạo lịch hẹn mới
 */
export const createAppointment = async (req, res, next) => {
  try {
    const { doctor_id, appointment_time, notes } = req.body;
    const patient_id = req.user.user_id;
    const appointment_id = uuidv4();

    console.log('Creating appointment:', {
      appointment_id,
      patient_id,
      doctor_id,
      appointment_time,
      notes
    });
    await createAppointmentQuery({
      appointment_id,
      patient_id,
      doctor_id,
      appointment_time,
      notes: notes || null
    });

    const appointment = await getAppointmentByIdQuery(appointment_id);
    if (!appointment) {
      throw createError(500, 'Không lấy được lịch hẹn sau khi tạo');
    }

    return res.status(201).json({ success: true, appointment });
  } catch (err) {
    return next(err);
  }
};

/**
 * Controller: Lấy danh sách lịch hẹn tùy theo role (Doctor hoặc Patient)
 */
export const getAppointments = async (req, res, next) => {
  try {
    const { user_id, role } = req.user;
    let appointments;

    console.log('User role:', role);
    if (role === 'Doctor') {
      // Bác sĩ xem các cuộc hẹn bệnh nhân đặt cho họ
      appointments = await listAppointmentsForDoctorQuery(user_id);
    } else {
      // Bệnh nhân xem các cuộc hẹn họ đã đặt
      appointments = await listAppointmentsForPatientQuery(user_id);
    }

    return res.json({ success: true, appointments });
  } catch (err) {
    return next(err);
  }
};
