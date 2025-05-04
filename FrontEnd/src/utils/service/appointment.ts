import { requestAPI } from "../api/request";
import { Appointment } from '../../types/appointment';

const BASE_URL = "http://localhost:5000";

interface BookPayload {
    doctor_id: string;
    appointment_time: string;
    notes?: string;
}

export async function fetchAppointments(): Promise<Appointment[]> {
    const { data, error, status } = await requestAPI(BASE_URL, '/api/appointments', 'GET', undefined);

    if (error || status >= 400) {
        throw new Error(data?.message || error || 'Lỗi khi tải lịch hẹn');
    }

    return data.appointments as Appointment[];
}

export async function bookAppointment(payload: BookPayload): Promise<Appointment> {
    const { data, error, status } = await requestAPI(BASE_URL, '/api/appointments', 'POST', payload);

    if (error || status >= 400) {
        throw new Error(data?.message || error || 'Lỗi khi đặt lịch hẹn');
    }

    return data.appointment as Appointment;
}
