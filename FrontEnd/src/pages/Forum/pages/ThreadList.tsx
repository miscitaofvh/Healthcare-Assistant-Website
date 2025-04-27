// This component displays the threads in a selected category.
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import styles from "../styles/Forum.module.css";
import { ThreadResponse } from "../../../types/forum";
import { loadThreadsByCategory } from "../../../utils/service/Forum/thread"; // You'll need to create this service function

const ThreadListPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [threads, setThreads] = useState<ThreadResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (id) {
      loadThreadsByCategory(id, setLoading, setThreads, setError);
    }
  }, [id]);

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
            <h1>Threads in this Category</h1>
            <ul className={styles.listGroup}>
              {threads.map((thread) => (
                <li key={thread.thread_id} className={styles.listGroupItem}>
                  <h3>{thread.title}</h3>
                  <p>{thread.content}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>No threads found for this category.</p>
        )}
      </div>
    </div>
  );
};

export default ThreadListPage;