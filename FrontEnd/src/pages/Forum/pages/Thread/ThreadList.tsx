import React, { useEffect, useState } from "react";
import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { Thread } from "../../../../types/forum";
import { loadThreads } from "../../../../utils/service/Forum/thread";
import { useNavigate } from "react-router-dom";

const ThreadListPage: React.FC = () => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    try {
      loadThreads(setLoading, setThreads, setError, setSuccess);
    } catch (error) {
      setError("Failed to load threads. Please try again later.");
    }
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleThreadClick = (threadId: number) => {
    navigate(`/forum/threads/${threadId}`);
  };

  const handleCreateClick = () => {
    navigate(`/forum/threads/create`);
  };

  return (
    <div className={styles.forumContainer}>
      <div className={styles.main_navbar}>
        <Navbar />
      </div>

      <div className={styles.headerContainer}>
        <div className={styles.headerSection}>
          <h1 className={styles.pageTitle}>Forum Threads</h1>
          <p className={styles.pageSubtitle}>Browse and manage discussion threads</p>
          <button
            className={`${styles.primaryButton} ${styles.createButton}`}
            onClick={handleCreateClick}
          >
            + Create New Thread
          </button>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <span className={styles.errorIcon}>⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className={styles.alertSuccess}>
            <span className={styles.successIcon}>✅</span>
            {success}
          </div>
        )}

        {/* <div className={styles.buttonGroup} style={{ justifyContent: 'flex-end' }}>
  
        </div> */}

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading threads...</p>
          </div>
        ) : threads.length > 0 ? (
          <div className={styles.tagGrid}>
            {threads.map((thread) => (
              <div
                key={thread.thread_id}
                className={styles.tagCard}
                onClick={() => handleThreadClick(thread.thread_id)}
              >
                <h3 className={styles.tagName}>{thread.thread_name}</h3>
                <p className={styles.tagDescription}>
                  {thread.description
                    ? thread.description.split(/\s+/).slice(0, 10).join(' ') +
                    (thread.description.split(/\s+/).length > 10 ? '...' : '')
                    : "No description available"
                  }
                </p>
                <p className={styles.tagDescription}>
                  posts : {thread.post_count || "0"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyMessage}>No threads available</p>
            <button className={styles.primaryButton} onClick={handleCreateClick}>
              Create First Thread
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreadListPage;
