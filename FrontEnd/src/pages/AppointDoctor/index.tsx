import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { Appointment } from '../../types/appointment';
import { Doctor } from '../../types/doctor';
import { fetchAppointments, bookAppointment } from '../../utils/service/appointment';
import { fetchDoctors } from '../../utils/service/doctor';
import styles from './AppointDoctor.module.css';

const AppointDoctor: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [appts, docs] = await Promise.all([
          fetchAppointments(),
          fetchDoctors()
        ]);
        appts.sort((a, b) =>
          new Date(a.appointment_time).getTime() -
          new Date(b.appointment_time).getTime()
        );
        setAppointments(appts);
        setDoctors(docs);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleBook = async (doctor_id: string) => {
    navigate(`/appointments/book/${doctor_id}`);
  };

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <section className={styles.section}>
          <h2>Lịch hẹn của tôi</h2>
          {loading && <p>Đang tải...</p>}
          {error && <p className={styles.error}>{error}</p>}
          {!loading && appointments.length === 0 && <p>Chưa có lịch hẹn.</p>}
          {!loading && appointments.length > 0 && (
            <ul className={styles.appointmentList}>
              {appointments.map((a) => (
                <li key={a.appointment_id} className={styles.appointmentItem}>
                  <div className={styles.row}>
                    <span>🗓️ {new Date(a.appointment_time).toLocaleString()}</span>
                    <span>👨‍⚕️ {a.doctor_name}</span>
                    <span>📋 {a.status}</span>
                  </div>
                  {a.notes && <p>📝 {a.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.section}>
          <h2>Danh sách bác sĩ</h2>
          {loading && <p>Đang tải...</p>}
          {!loading && doctors.length === 0 && <p>Không tìm thấy bác sĩ.</p>}
          {!loading && doctors.length > 0 && (
            <ul className={styles.doctorList}>
              {doctors.map((d) => (
                <li key={d.doctor_id} className={styles.doctorItem}>
                  <img
                    src={d.avatar}
                    alt={d.name}
                    className={styles.avatar}
                  />
                  <div className={styles.info}>
                    <h3>{d.name}</h3>
                    <p><strong>Chuyên khoa:</strong> {d.specialty}</p>
                    <p><strong>Bệnh viện:</strong> {d.hospital}</p>
                    <button onClick={() => handleBook(d.doctor_id)}>
                      Đặt lịch
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
};

export default AppointDoctor;
