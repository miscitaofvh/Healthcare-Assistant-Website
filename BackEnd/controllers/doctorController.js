import createError from 'http-errors';
import { listDoctorsQuery } from '../queries/doctorQueries.js';

export async function getDoctorsList(req, res, next) {
  try {
    const doctors = await listDoctorsQuery();
    res.json({ success: true, doctors });
  } catch (err) {
    next(createError(500, 'Lỗi khi lấy danh sách bác sĩ'));
  }
}
