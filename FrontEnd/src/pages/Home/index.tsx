import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../contexts/AuthContext";
import { getArticles } from "../../utils/service/article";
import { useHealthTracking } from "../../hooks/useHealthTracking";
import HealthMetricsChart from "../HealthTracking/components/HealthMetricsChart";
import { Appointment } from "../../types/appointment";
import { fetchAppointments } from "../../utils/service/appointment";
import styles from "./Home.module.css";

interface ArticleSummary {
  article_id: number;
  title: string;
  image_url?: string;
  last_updated?: string;
}

const Home: React.FC = () => {
  const { user, authLoading } = useAuth();
  const navigate = useNavigate();

  // Appointments
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const data = await fetchAppointments();
        setAppointments(
          data
            .filter((a) => new Date(a.appointment_time) > new Date())
            .sort((a, b) =>
              new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime()
            )
        );
      } catch (e) {
        console.error(e);
      }
    })();
  }, [user]);
  const upcomingCount = appointments.length;

  // Health chart
  const { records, loading: chartLoading } = useHealthTracking();
  const [selectedMetrics, setSelectedMetrics] = useState({
    weight: true,
    heart_rate: true,
    blood_sugar: true,
    temperature: true,
    sleep_duration: true,
  });
  const [timeFilter, setTimeFilter] = useState<string>("all");

  // Recent articles
  const [recent, setRecent] = useState<ArticleSummary[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const resp = await getArticles(1);
        const list: ArticleSummary[] = resp.data;
        const top20 = [...list]
          .sort(
            (a, b) =>
              new Date(b.last_updated || "").getTime() - new Date(a.last_updated || "").getTime()
          )
          .slice(0, 20);
        setRecent(top20);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  if (authLoading) return null;

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        {/* Health Chart */}
        <div className={styles.chartWrapper}>
          {chartLoading ? (
            <p className={styles.loading}>Đang tải biểu đồ...</p>
          ) : records && records.length > 0 ? (
            <HealthMetricsChart
              records={records}
              selectedMetrics={selectedMetrics}
              setSelectedMetrics={setSelectedMetrics}
              timeFilter={timeFilter}
              setTimeFilter={setTimeFilter}
            />
          ) : (
            <p className={styles.loading}>Không có dữ liệu để hiển thị biểu đồ.</p>
          )}
        </div>

        {/* Recent Articles */}
        <section className={styles.recentSection}>
          <h2>Bài báo gần đây</h2>
          <ul className={styles.recentList}>
            {recent.map((a) => (
              <li key={a.article_id} onClick={() => navigate(`/article/${a.article_id}`)}>
                {a.image_url && (
                  <img
                    src={a.image_url}
                    alt={a.title}
                    className={styles.recentImage}
                  />
                )}
                <div className={styles.recentContent}>
                  <span className={styles.recentTitle}>{a.title}</span>
                  <span className={styles.recentDate}>{a.last_updated?.slice(0, 10)}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Appointment Summary */}
        {user && (
          <section
            className={styles.cardWrapper}
            onClick={() => navigate("/appointDoctor")}
          >
            <div className={styles.iconBox}>📅</div>
            <div className={styles.infoBox}>
              <span className={styles.number}>{upcomingCount}</span>
              <span className={styles.text}>lịch hẹn sắp tới</span>
            </div>
            {upcomingCount > 0 && <div className={styles.badge}>{upcomingCount}</div>}
          </section>
        )}
      </div>
    </>
  );
};

export default Home;