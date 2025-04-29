// src/components/Forum/pages/ThreadListPage.tsx
import React, { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar";
import styles from "../styles/Forum.module.css";
import { ThreadResponse } from "../../../types/forum";
import { loadThreads } from "../../../utils/service/Forum/thread";

const ThreadListPage: React.FC = () => {
  const [threads, setThreads] = useState<ThreadResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  // useEffect(() => {
  //   if (id) {
  //     // loadThreadsByCategory(id, setLoading, setThreads, setError);
  //     loadThreads(id, setLoading, setThreads, setError);
  //   }
  // }, [id]);
  useEffect(() => {
    loadThreads(setLoading, setThreads, setError);
  }, []); // 👈 Only call once when page loads

  return (
    <div>
      <div className={styles.main_navbar}>
        <Navbar />
      </div>
      <div className={styles.container}>
        {loading ? (
          <p>Loading threads...</p>
        ) : error ? (
          <div className={styles.alert}>{error}</div>
        ) : threads.length > 0 ? (
          <div className={styles.card}>
            <h1>All Threads</h1>
            <ul className={styles.listGroup}>
              {threads.map((thread) => (
                <li key={thread.thread_id} className={styles.listGroupItem}>
                  <h3>{thread.thread_name}</h3>
                  <p>{thread.description}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>No threads available.</p>
        )}
      </div>
    </div>
  );
};

export default ThreadListPage;
