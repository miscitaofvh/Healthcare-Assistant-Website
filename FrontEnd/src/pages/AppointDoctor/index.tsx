import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../contexts/AuthContext";
import { Appointment } from "../../types/appointment";
import { Doctor } from "../../types/doctor";
import {
  fetchAppointments,
  fetchDoctorAppointments,
  bookAppointment,
  updateAppointmentStatus,
} from "../../utils/service/appointment";
import { fetchDoctors } from "../../utils/service/doctor";
import styles from "./AppointDoctor.module.css";

type Status = "Pending" | "Confirmed" | "Cancelled";

const AppointDoctor: React.FC = () => {
  const { user, authLoading } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsToHandle, setAppointmentsToHandle] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const nowISOString = new Date().toISOString().slice(0, 16);

  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [appointmentTime, setAppointmentTime] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const [updatingAppointmentId, setUpdatingAppointmentId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{ appointmentId: string; status: Status } | null>(null);
  const [doctorNotes, setDoctorNotes] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [doctorList, userAppointments] = await Promise.all([
        fetchDoctors(),
        fetchAppointments(),
      ]);
      setDoctors(doctorList);
      setAppointments(
        userAppointments.sort(
          (a, b) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime()
        )
      );

      if (user?.role === "Doctor") {
        const docAppointments = await fetchDoctorAppointments();
        setAppointmentsToHandle(
          docAppointments.sort(
            (a, b) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime()
          )
        );
      }
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadData();
  }, [user?.role]);

  // From date khac voi trong utils
  const formatDateTime = (dt: string): string =>
    new Date(dt).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDate = (dt: string): string =>
    new Date(dt).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const groupAppointmentsByDate = (list: Appointment[]) => {
    return list.reduce<Record<string, Appointment[]>>((acc, appt) => {
      const key = appt.appointment_time.slice(0, 10);
      if (!acc[key]) acc[key] = [];
      acc[key].push(appt);
      return acc;
    }, {});
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
        patient_notes: notes,
      });

      setAppointments((prev) =>
        [...prev, { ...newAppt, doctor_name: selectedDoctor.name }].sort(
          (a, b) =>
            new Date(a.appointment_time).getTime() -
            new Date(b.appointment_time).getTime()
        )
      );
      setSelectedDoctor(null);
      setAppointmentTime("");
      setNotes("");
    } catch (err: any) {
      setBookingError(err.message || "Lỗi khi đặt lịch");
    } finally {
      setBooking(false);
    }
  };

  const openStatusChangeForm = (id: string, status: Status) => {
    setActionModal({ appointmentId: id, status });
    setDoctorNotes("");
  };

  const submitStatusChange = async () => {
    if (!actionModal) return;
    const { appointmentId, status } = actionModal;

    setUpdatingAppointmentId(appointmentId);
    setUpdateError(null);

    try {
      await updateAppointmentStatus(appointmentId, status, doctorNotes);

      const refreshed = await fetchDoctorAppointments();
      setAppointmentsToHandle(
        refreshed.sort(
          (a, b) =>
            new Date(a.appointment_time).getTime() -
            new Date(b.appointment_time).getTime()
        )
      );

      setActionModal(null);
      setDoctorNotes("");
    } catch (err) {
      console.error("Cập nhật lỗi:", err);
      setUpdateError("Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setUpdatingAppointmentId(null);
    }
  };

  const renderTimeline = (grouped: Record<string, Appointment[]>, isDoctor = false) =>
    Object.entries(grouped).map(([dateKey, list]) => (
      <div key={dateKey}>
        <h3 style={{ color: "#2c5282", marginBottom: "0.5rem" }}>{formatDate(dateKey)}</h3> 
        <ul className={styles.appointmentList}>
          {list.map((a) => (
            <li key={a.appointment_id} className={styles.appointmentCard}>
              <div className={styles.appointmentInfo}>
                <strong>{formatDateTime(a.appointment_time)}</strong>
                <div>{isDoctor ? `👤 ${a.patient_name}` : `👨‍⚕️ Bác sĩ: ${a.doctor_name}`}</div>

                {a.patient_notes && (
                  <div className={`${styles.noteBox} ${styles.patientNote}`}>
                    📄 Ghi chú của người khám: {a.patient_notes}
                  </div>
                )}

                {a.doctor_notes && (
                  <div className={`${styles.noteBox} ${styles.doctorNote}`}>
                    💡 Ghi chú của bác sĩ: {a.doctor_notes}
                  </div>
                )}

                <span className={`${styles.statusBadge} ${styles[a.status]}`}>
                  {a.status}
                </span>

                {isDoctor && a.status === "Pending" && (
                  <div className={styles.actions}>
                    <button onClick={() => openStatusChangeForm(a.appointment_id, "Confirmed")}>
                      Chấp nhận
                    </button>
                    <button onClick={() => openStatusChangeForm(a.appointment_id, "Cancelled")}>
                      Từ chối
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    ));

  if (authLoading) return;
  if (!user) {
    navigate("/", { replace: true });
    return;
  }

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        {user.role === "Doctor" && (
          <section className={styles.section}>
            <h2>Lịch hẹn cần xử lý</h2>
            {loading ? <p>Đang tải...</p> : renderTimeline(groupAppointmentsByDate(appointmentsToHandle), true)}
            {updateError && <p className={styles.error}>{updateError}</p>}
          </section>
        )}

        <section className={styles.section}>
          <h2>Lịch tôi đã đặt</h2>
          {loading ? <p>Đang tải...</p> : renderTimeline(groupAppointmentsByDate(appointments), false)}
        </section>

        <section className={styles.section}>
          <h2>Đặt lịch khám</h2>
          {loading || doctors.length === 0 ? (
            <p>Đang tải bác sĩ...</p>
          ) : (
            <ul className={styles.doctorList}>
              {doctors
                .filter((d) => d.user_id !== user.user_id)
                .map((d) => (
                  <li key={d.doctor_id} className={styles.doctorItem}>
                    <img src={d.avatar} alt={d.name} className={styles.avatar} />
                    <h3>{d.name}</h3>
                    <p>{d.specialty}</p>
                    <div className={styles.doctorActions}>
                      <button onClick={() => setSelectedDoctor(d)}>Đặt lịch</button>
                      <button className={styles.chatBtn}>💬 Nhắn tin</button>
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
            <h3>Đặt lịch với bác sĩ: {selectedDoctor.name}</h3>
            {bookingError && <p className={styles.error}>{bookingError}</p>}
            <form onSubmit={handleBookingSubmit} className={styles.form}>
              <label>
                Thời gian:
                <input
                  type="datetime-local"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  required
                  min={nowISOString}
                />
              </label>
              <label>
                Ghi chú của người khám:
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Mô tả tình trạng sức khỏe của bạn..."
                />
              </label>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setSelectedDoctor(null)}>Hủy</button>
                <button type="submit" disabled={booking}>
                  {booking ? "Đang đặt..." : "Xác nhận"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {actionModal && (
        <div className={styles.modalOverlay} onClick={() => setActionModal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>
              {actionModal.status === "Confirmed" ? "Chấp nhận" : "Từ chối"} lịch hẹn.
            </h3>
            <textarea
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              rows={4}
              maxLength={500}
              className={styles.modalTextarea}
              placeholder="Ghi chú của bác sĩ..."
            />
            <div className={styles.modalActions}>
              <button onClick={() => setActionModal(null)}>Hủy</button>
              <button onClick={submitStatusChange} disabled={updatingAppointmentId === actionModal.appointmentId}>
                {updatingAppointmentId === actionModal.appointmentId ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AppointDoctor;
