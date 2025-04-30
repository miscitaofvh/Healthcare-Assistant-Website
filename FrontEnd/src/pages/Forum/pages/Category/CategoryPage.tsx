import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { Category, Thread } from "../../../../types/forum";
import { loadThreadsandCategoryByCategory } from "../../../../utils/service/Forum/category";

const CategoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadThreadsandCategoryByCategory(id, setLoading, setCategory, setThreads, setError);
    }
  }, [id]);

  return (
    <div className={styles.forumContainer}>
      <div className={styles.main_navbar}>
        <Navbar />
      </div>

      <div className={styles.tagListContainer}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading category...</p>
          </div>
        ) : error ? (
          <div className={styles.errorAlert}>
            <span className={styles.errorIcon}>!</span>
            {error}
          </div>
        ) : category ? (
          <div>
            {/* Category Header Section */}
            <div className={styles.headerSection}>
              <h1 className={styles.pageTitle}>{category.category_name}</h1>
              <p className={styles.pageSubtitle}>{category.description}</p>
            </div>

            {/* Category Info Card */}
            <div className={styles.tagCard}>
              <div className={styles.tagMeta}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Usage:</span>
                  <span className={styles.metaValue}>{category.thread_count} threads</span>
                </div>
              </div>
              <div className={styles.buttonGroup}>
                <button
                  className={`${styles.primaryButton} ${styles.createButton}`}
                  onClick={() => navigate(`/forum/categories/${category.category_id}/update`)}
                >
                  Update Category
                </button>
                <button
                  className={styles.secondaryButton}
                  onClick={() => navigate(`/forum/threads/create`)}
                  disabled={loading}
                >
                  Add New Thread
                </button>
              </div>
            </div>

            {/* Threads List */}
            <div className={styles.headerSection}>
              <h2 className={styles.pageTitle}>Threads in this Category</h2>
            </div>

            {threads.length > 0 ? (
              <div className={styles.tagGrid}>
                {threads.map((thread) => (
                  <div
                    key={thread.thread_id}
                    className={styles.tagCard}
                    onClick={() => navigate(`/forum/threads/${thread.thread_id}`)}
                  >
                    <h3 className={styles.tagName}>{thread.thread_name}</h3>
                    <p className={styles.tagDescription}>{thread.description}</p>

                    <div className={styles.tagMeta}>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Posts:</span>
                        <span className={styles.metaValue}>{thread.post_count}</span>
                      </div>
                      {thread.last_post_date && (
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>Last post:</span>
                          <span className={styles.metaValue}>
                            {new Date(thread.last_post_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      className={styles.primaryButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/forum/threads/${thread.thread_id}`);
                      }}
                    >
                      View Thread
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p className={styles.emptyMessage}>No threads available in this category.</p>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyMessage}>Category not found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryDetailPage;