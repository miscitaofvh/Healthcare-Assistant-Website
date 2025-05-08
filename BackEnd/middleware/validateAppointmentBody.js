import createError from 'http-errors';

export function validateAppointmentBody(req, res, next) {
  const { doctor_id, appointment_time } = req.body;
  if (!doctor_id || !appointment_time) {
    return next(createError(400, 'doctor_id và appointment_time là bắt buộc'));
  }
  next();
}