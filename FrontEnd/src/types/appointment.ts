export interface Appointment {
    appointment_id: string;
    doctor_id: string;
    doctor_name: string;
    appointment_time: string;
    status: string;
    notes?: string;
}
