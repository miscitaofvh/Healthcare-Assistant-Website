import { v4 as uuidv4 } from "uuid";
import createError from "http-errors";
import {
  createAppointmentQuery,
  listAppointmentsForDoctorQuery,
  listAppointmentsForPatientQuery,
  getAppointmentByIdQuery,
  updateAppointmentQuery,
} from "../queries/appointmentQueries.js";

export const createAppointment = async (req, res, next) => {
  try {
    const { doctor_id, appointment_time, patient_notes } = req.body;
    const patient_id = req.user.user_id;
    const appointment_id = uuidv4();

    const now = new Date();
    const apptTime = new Date(appointment_time);

    if (isNaN(apptTime.getTime()) || apptTime <= now) {
      return res.status(400).json({
        success: false,
        message: "Thời gian đặt lịch phải ở tương lai.",
      });
    }

    await createAppointmentQuery({ appointment_id, patient_id, doctor_id, appointment_time, patient_notes});

    const appointment = await getAppointmentByIdQuery(appointment_id);
    if (!appointment) {
      throw createError(500, "Không lấy được lịch hẹn sau khi tạo");
    }

    return res.status(201).json({ success: true, appointment });
  } catch (err) {
    return next(err);
  }
};

export const getAppointmentForDoctor = async (req, res, next) => {
  try {
    const { user_id, role } = req.user;
    let appointments;

    if (role === "Doctor") {
      appointments = await listAppointmentsForDoctorQuery(user_id);
    }

    return res.json({ success: true, appointments });
  } catch (err) {
    return next(err);
  }
};

export const getAppointments = async (req, res, next) => {
  try {
    const { user_id } = req.user;
    let appointments;

    appointments = await listAppointmentsForPatientQuery(user_id);

    return res.json({ success: true, appointments });
  } catch (err) {
    return next(err);
  }
};

export const updateAppointment = async (req, res, next) => {
  try {
    const { appointment_id, status, doctor_notes } = req.body;
    const { role } = req.user;

    if (role !== "Doctor") {
      throw createError(403, "Chỉ bác sĩ mới có thể cập nhật lịch hẹn");
    }

    // cho vao validate sau
    const validStatuses = ["Pending", "Confirmed", "Cancelled"];
    if (!validStatuses.includes(status)) {
      throw new Error(`Trạng thái không hợp lệ: ${status}`);
    }

    const updatedAppointment = await updateAppointmentQuery({
      appointment_id,
      status,
      doctor_notes,
    });

    if (!updatedAppointment) {
      throw createError(404, "Không tìm thấy lịch hẹn để cập nhật");
    }

    return res.json({ success: true, updatedAppointment });
  } catch (err) {
    return next(err);
  }
};
