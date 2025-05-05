import React, { useEffect, useState } from "react";
import Navbar from "../../../../components/Navbar";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/Forum.module.css";
import { loadCategories } from "../../../../utils/service/Forum/category";
import { CategoryMain } from "../../../../types/forum";

const CategoryList: React.FC = () => {
  const [categories, setCategories] = useState<CategoryMain[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    try {
      loadCategories(setLoading, setCategories, setError, setSuccess);
    } catch (error) {
      setError("Failed to load categories. Please try again later.");
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

  const handleCategoryClick = (categoryId: number) => {
    navigate(`/forum/categories/${categoryId}`);
  };

  const handleCreateClick = () => {
    navigate(`/forum/categories/create`);
  };

  return (
    <div className={styles.forumContainer}>
      <div className={styles.main_navbar}>
        <Navbar />
      </div>

      <div className={styles.tagListContainer}>
        <div className={styles.headerSection}>
          <h1 className={styles.pageTitle}>Forum Categories</h1>
          <p className={styles.pageSubtitle}>Browse and manage discussion categories</p>
          <button
            className={`${styles.primaryButton} ${styles.createButton}`}
            onClick={handleCreateClick}
          >
            + Create New Category
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
            <p>Loading categories...</p>
          </div>
        ) : categories.length > 0 ? (
          <div className={styles.tagGrid}>
            {categories.map((category) => (
              <div
                key={category.category_id}
                className={styles.tagCard}
                onClick={() => handleCategoryClick(category.category_id)}
              >
                <h3 className={styles.tagName}>{category.category_name}</h3>
                <p className={styles.tagDescription}>
                  {category.description
                    ? category.description.split(/\s+/).slice(0, 10).join(' ') +
                    (category.description.split(/\s+/).length > 10 ? '...' : '')
                    : "No description available"
                  }
                </p>
                <div className={styles.tagMeta}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Threads:</span>
                    <span className={styles.metaValue}>{category.thread_count || 0}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Posts:</span>
                    <span className={styles.metaValue}>{category.post_count || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyMessage}>No categories available</p>
            <button
              className={styles.primaryButton}
              onClick={handleCreateClick}
            >
              Create First Category
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryList;