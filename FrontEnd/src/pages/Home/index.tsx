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

  // Appointment State
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const upcomingAppointments = appointments.filter(
    (a) => new Date(a.appointment_time) > new Date()
  );
  const upcomingCount = upcomingAppointments.length;

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const data = await fetchAppointments();
        setAppointments(
          data.sort(
            (a, b) =>
              new Date(a.appointment_time).getTime() -
              new Date(b.appointment_time).getTime()
          )
        );
      } catch (err) {
        console.error("Failed to fetch appointments:", err);
      }
    })();
  }, [user]);

  // Health Tracking
  const { records, loading: chartLoading } = useHealthTracking();
  const [selectedMetrics, setSelectedMetrics] = useState({
    weight: true,
    heart_rate: true,
    blood_sugar: true,
    temperature: true,
    sleep_duration: true,
  });
  const [timeFilter, setTimeFilter] = useState("all");

  // Recent Articles
  const [recent, setRecent] = useState<ArticleSummary[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const resp = await getArticles(1);
        const articles: ArticleSummary[] = resp.data || [];
        const top20 = articles
          .sort(
            (a, b) =>
              new Date(b.last_updated || "").getTime() -
              new Date(a.last_updated || "").getTime()
          )
          .slice(0, 20);
        setRecent(top20);
      } catch (err) {
        console.error("Failed to fetch articles:", err);
      }
    })();
  }, []);

  if (authLoading) return null;

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        {/* Health Chart */}
        {!chartLoading && records.length > 0 && (
          <div className={styles.chartWrapper}>
            <HealthMetricsChart
              records={records}
              selectedMetrics={selectedMetrics}
              setSelectedMetrics={setSelectedMetrics}
              timeFilter={timeFilter}
              setTimeFilter={setTimeFilter}
            />
          </div>
        )}

        {/* Recent Articles */}
        {recent.length > 0 && (
          <section className={styles.recentSection}>
            <h2>Bài báo gần đây</h2>
            <ul className={styles.recentList}>
              {recent.map((a) => (
                <li
                  key={a.article_id}
                  onClick={() => navigate(`/article/${a.article_id}`)}
                >
                  {a.image_url && (
                    <img
                      src={a.image_url}
                      alt={a.title}
                      className={styles.recentImage}
                    />
                  )}
                  <div className={styles.recentContent}>
                    <span className={styles.recentTitle}>{a.title}</span>
                    <span className={styles.recentDate}>
                      {a.last_updated?.slice(0, 10)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Appointment Summary */}
        {user && upcomingCount > 0 && (
          <section
            className={styles.cardWrapper}
            onClick={() => navigate("/appointDoctor")}
          >
            <div className={styles.iconBox}>📅</div>
            <div className={styles.infoBox}>
              <span className={styles.number}>{upcomingCount}</span>
              <span className={styles.text}>lịch hẹn sắp tới</span>
            </div>
            <div className={styles.badge}>{upcomingCount}</div>
          </section>
        )}
      </div>
    </>
  );
};

export default Home;
