// src/pages/AppointDoctor/index.tsx
import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../contexts/AuthContext";
import { Appointment } from "../../types/appointment";
import { Doctor } from "../../types/doctor";
import {
  fetchAppointments,
  bookAppointment,
  updateAppointmentStatus,
} from "../../utils/service/appointment";
import { fetchDoctors } from "../../utils/service/doctor";
import styles from "./AppointDoctor.module.css";

type Status = "Pending" | "Confirmed" | "Cancelled";

const AppointDoctor: React.FC = () => {
  const { user, authLoading } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [appointmentTime, setAppointmentTime] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [appts, docs] = await Promise.all([
          fetchAppointments(),
          fetchDoctors(),
        ]);
        setAppointments(
          appts.sort(
            (a, b) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime()
          )
        );
        setDoctors(docs);
      } catch (err: any) {
        setError(err.message || "Lỗi khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (authLoading) return <p>Đang kiểm tra đăng nhập...</p>;
  if (!user) return <p>Vui lòng đăng nhập để tiếp tục.</p>;

  const formatDateTime = (dt: string): string => {
    const d = new Date(dt);
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;

    setBooking(true);
    setBookingError(null);

    try {
      const formattedTime = appointmentTime.replace("T", " ") + ":00";
      const newAppt = await bookAppointment({
        doctor_id: selectedDoctor.doctor_id,
        appointment_time: formattedTime,
        notes,
      });
      setAppointments((prev) =>
        [...prev, { ...newAppt, doctor_name: selectedDoctor.name }].sort(
          (a, b) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime()
        )
      );
      setSelectedDoctor(null);
    } catch (err: any) {
      setBookingError(err.message || "Lỗi khi đặt lịch");
    } finally {
      setBooking(false);
    }
  };

  const handleStatusChange = async (id: string, status: Status) => {
    try {
      const updated = await updateAppointmentStatus(id, status);
      setAppointments((prev) =>
        prev.map((a) =>
          a.appointment_id === id
            ? { ...updated, doctor_name: a.doctor_name }
            : a
        )
      );
    } catch (err) {
      console.error("Cập nhật thất bại:", err);
    }
  };

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        {user.role === "Doctor" && (
          <section className={styles.section}>
            <h2>Yêu cầu hẹn khám</h2>
            {loading ? (
              <p>Đang tải...</p>
            ) : error ? (
              <p className={styles.error}>{error}</p>
            ) : appointments.length === 0 ? (
              <p>Chưa có lịch hẹn.</p>
            ) : (
              <ul className={styles.appointmentList}>
                {appointments.map((a) => (
                  <li key={a.appointment_id} className={styles.appointmentCard}>
                    <div>
                      <strong>Bệnh nhân:</strong> {a.patient_name}
                    </div>
                    <div>
                      <strong>Thời gian:</strong> {formatDateTime(a.appointment_time)}
                    </div>
                    {a.notes && <div>📝 {a.notes}</div>}
                    <span className={styles.statusBadge}>{a.status}</span>
                    <div className={styles.actions}>
                      <button
                        disabled={a.status !== "Pending"}
                        onClick={() => handleStatusChange(a.appointment_id, "Confirmed")}
                      >
                        Chấp nhận
                      </button>
                      <button
                        disabled={a.status !== "Pending"}
                        onClick={() => handleStatusChange(a.appointment_id, "Cancelled")}
                      >
                        Từ chối
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section className={styles.section}>
          <h2>Lịch hẹn của tôi</h2>
          {loading ? (
            <p>Đang tải...</p>
          ) : error ? (
            <p className={styles.error}>{error}</p>
          ) : appointments.length === 0 ? (
            <p>Chưa có lịch hẹn.</p>
          ) : (
            <ul className={styles.appointmentList}>
              {appointments.map((a) => {
                const doc = doctors.find((d) => d.doctor_id === a.doctor_id);
                return (
                  <li key={a.appointment_id} className={styles.appointmentCard}>
                    <img src={doc?.avatar} alt={doc?.name} className={styles.avatarSmall} />
                    <div>
                      <div>{formatDateTime(a.appointment_time)}</div>
                      <div>👨‍⚕️ {a.doctor_name}</div>
                      {a.notes && <div>📝 {a.notes}</div>}
                    </div>
                    <span className={styles.statusBadge}>{a.status}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className={styles.section}>
          <h2>Đặt lịch khám</h2>
          {loading || doctors.length === 0 ? (
            <p>Đang tải bác sĩ...</p>
          ) : (
            <ul className={styles.doctorList}>
              {doctors.map((d) => (
                <li key={d.doctor_id} className={styles.doctorItem}>
                  <img src={d.avatar} alt={d.name} className={styles.avatar} />
                  <div>
                    <h3>{d.name}</h3>
                    <p>{d.specialty}</p>
                    <button onClick={() => setSelectedDoctor(d)}>Đặt lịch</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {selectedDoctor && (
        <div className={styles.modalOverlay} onClick={() => setSelectedDoctor(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Đặt lịch với {selectedDoctor.name}</h3>
            {bookingError && <p className={styles.error}>{bookingError}</p>}
            <form onSubmit={handleBookingSubmit} className={styles.form}>
              <label>
                Thời gian:
                <input
                  type="datetime-local"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  required
                />
              </label>
              <label>
                Ghi chú:
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Mô tả tình trạng sức khỏe..."
                />
              </label>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setSelectedDoctor(null)}>
                  Hủy
                </button>
                <button type="submit" disabled={booking}>
                  {booking ? "Đang đặt..." : "Xác nhận"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AppointDoctor;