import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { loadTags } from "../../../../utils/service/Forum/tag";
import { Tag } from "../../../../types/forum";
import { formatDate } from "../../../../utils/helpers/dateFormatter";

const TagList: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    try {
      loadTags(setLoading, setTags, setError, setSuccess);
    } catch (err) {
      setError("An unexpected error occurred while loading tags");
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

  const handleTagClick = (tagId: number) => {
    navigate(`/forum/tags/${tagId}`);
  };

  const handleCreateClick = () => {
    navigate(`/forum/tags/create`);
  };

  return (
    <div className={styles.forumContainer}>
      <Navbar />

      <div className={styles.headerContainer}>
        <div className={styles.headerSection}>
          <h1 className={styles.pageTitle}>Forum Tags</h1>
          <p className={styles.pageSubtitle}>Browse all available discussion tags</p>

          <button
            className={`${styles.primaryButton} ${styles.createButton}`}
            onClick={handleCreateClick}
          >
            + Create New Tag
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

        <div className={styles.contentCard}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading tags...</p>
            </div>
          ) : tags.length > 0 ? (
            <div className={styles.tagGrid}>
              {tags.map((tag) => (
                <div
                  key={tag.tag_id}
                  className={styles.tagCard}
                  onClick={() => handleTagClick(tag.tag_id)}
                >

                  <div className={styles.tagHeader}>
                    <h3 className={styles.tagName}>#{tag.tag_name}</h3>
                    {tag.description && (
                      <p className={styles.tagDescription}>
                        {tag.description.split(/\s+/).slice(0, 10).join(' ')}
                        {tag.description.split(/\s+/).length > 10 && '...'}
                      </p>
                    )}
                  </div>

                  <div className={styles.tagMeta}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Created by:</span>
                      <span className={styles.metaValue}>{tag.created_by}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Usage count:</span>
                      <span className={styles.metaValue}>{tag.usage_count}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Last used at:</span>
                      <span className={styles.metaValue}>{formatDate(tag.last_used_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyMessage}>No tags available yet.</p>
              <button
                className={styles.primaryButton}
                onClick={handleCreateClick}
              >
                Create First Tag
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TagList;
