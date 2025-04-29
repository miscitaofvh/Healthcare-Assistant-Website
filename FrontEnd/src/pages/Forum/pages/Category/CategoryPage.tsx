import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { Category, Thread } from "../../../../types/forum";
import { loadSingleCategory, loadThreadsByCategory } from "../../../../utils/service/Forum/category";

const CategoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      // loadSingleCategory(id, setLoading, setCategory, setError);
      loadThreadsByCategory(id, setLoading, setCategory, setThreads, setError);
    }
  }, [id]);
  return (
    <div>
      <div className={styles.main_navbar}>
        <Navbar />
      </div>
      <div className={styles.container}>
        {loading ? (
          <p>Loading category...</p>
        ) : error ? (
          <div className={styles.alert}>{error}</div>
        ) : category ? (
          <div>
            <div className={styles.card}>
              <h1>{category.category_name}</h1>
              <p>{category.description}</p>
            </div>

            {/* Threads List */}
            <div className={styles.card}>
              <h2>Threads in this Category</h2>
              {threads.length > 0 ? (
                <ul className={styles.listGroup}>
                  {threads.map((thread) => (
                    <li key={thread.thread_id} className={styles.listGroupItem}>
                      <h3>{thread.thread_name}</h3>
                      <p>{thread.description}</p>
                      <button
                        className={styles.btnPrimary}
                        onClick={() => navigate(`/forum/threads/${thread.thread_id}`)}
                      >
                        View Thread
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No threads available in this category.</p>
              )}
            </div>
          </div>
        ) : (
          <p>Category not found.</p>
        )}
      </div>
    </div>
  );
};

export default CategoryDetailPage;