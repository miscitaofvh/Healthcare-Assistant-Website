// src/components/Forum/pages/ThreadPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { Thread, Post } from "../../../../types/forum";
import { loadPostsandThreadByCategory } from "../../../../utils/service/Forum/thread";

const ThreadPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [thread, setThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) {
      setError("Invalid thread ID.");
      setLoading(false);
      return;
    }
    try {
      loadPostsandThreadByCategory(id, setLoading, setThread, setPosts, setError, setSuccess);
    } catch (err: any) {
      setError("Invalid thread ID");
      setLoading(false);
    }
  }, [id]);

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

  const handleViewPost = (postId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/forum/posts/${postId}`);
  };

  return (
    <div className={styles.forumContainer}>
      <div className={styles.main_navbar}>
        <Navbar />
      </div>

      <div className={styles.tagListContainer}>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading thread...</p>
          </div>
        ) : thread ? (
          <div>
            {/* Thread Header Section */}
            <div className={styles.headerSection}>
              <h1 className={styles.pageTitle}>{thread.thread_name}</h1>
              <p className={styles.pageSubtitle}>{thread.description}</p>
            </div>

            {error && (
              <div className={styles.errorAlert}>
                <span className={styles.errorIcon}>⚠️</span> {error}
              </div>
            )}

            {success && (
              <div className={styles.alertSuccess}>
                <span className={styles.successIcon}>✅</span> {success}
              </div>
            )}

            {/* Thread Info Card */}
            <div className={styles.tagCard}>
              <div className={styles.tagMeta}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Posts:</span>
                  <span className={styles.metaValue}>{thread.post_count}</span>
                </div>
                {thread.last_post_date && (
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Last activity:</span>
                    <span className={styles.metaValue}>
                      {new Date(thread.last_post_date).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
              <div className={styles.buttonGroup}>
                <button
                  className={`${styles.primaryButton} ${styles.createButton}`}
                  onClick={() => navigate(`/forum/threads/${thread.thread_id}/update`)}
                  disabled={loading}
                >
                  Update Thread
                </button>
                <button
                  className={styles.secondaryButton}
                  onClick={() => navigate(`/forum/posts/create`)}
                  disabled={loading}
                >
                  Add New Post
                </button>
              </div>
            </div>

            {/* Posts List */}
            <div className={styles.headerSection}>
              <h2 className={styles.pageTitle}>Posts in this Thread</h2>
            </div>

            {posts.length > 0 ? (
              <div className={styles.postsContainer}>
                {posts.map((post) => (
                  <div key={post.post_id} className={styles.postCard}>
                    <div className={styles.postHeader}>
                      <span className={styles.postAuthor}>By {post.author}</span>
                      <span className={styles.postDate}>
                        {new Date(post.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className={styles.postContent}>
                      <p>{post.content}</p>
                    </div>
                    <div className={styles.postActions}>
                      <button
                        className={styles.primaryButton}
                        onClick={(e) => handleViewPost(post.post_id, e)}
                        disabled={loading}
                      >
                        View Post
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p className={styles.emptyMessage}>No posts available in this thread.</p>
                <button
                  className={styles.primaryButton}
                  onClick={() => navigate(`/forum/posts/create`)}
                  disabled={loading}
                >
                  Create First Post
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyMessage}>Thread not found.</p>
            <button
              className={styles.primaryButton}
              onClick={() => navigate("/forum/threads")}
              disabled={loading}
            >
              Back to Threads
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreadPage;