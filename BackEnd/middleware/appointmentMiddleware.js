import createError from 'http-errors';
import { getAppointmentByIdQuery } from '../queries/appointmentQueries.js';

export function validateAppointmentBody(req, res, next) {
  const { doctor_id, appointment_time } = req.body;
  if (!doctor_id || !appointment_time) {
    return next(createError(400, 'doctor_id và appointment_time là bắt buộc'));
  }
  next();
}

export async function loadAppointment(req, res, next) {
  try {
    const appt = await getAppointmentByIdQuery(req.params.id);
    if (!appt) {
      return next(createError(404, 'Không tìm thấy lịch hẹn'));
    }
    req.appointment = appt;
    next();
  } catch (err) {
    next(err);
  }
}

export function authorizeAppointmentAccess(req, res, next) {
  const { role, user_id } = req.user;
  const { doctor_id, patient_id } = req.appointment;

  const isDoctor = role === 'Doctor' && doctor_id === user_id;
  const isPatient = role !== 'Doctor' && patient_id === user_id;

  if (!isDoctor && !isPatient) {
    return next(createError(403, 'Bạn không có quyền thực hiện hành động này'));
  }
  next();
}
