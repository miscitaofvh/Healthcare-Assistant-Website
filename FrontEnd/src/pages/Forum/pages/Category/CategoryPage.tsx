import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { Category, Thread, PaginationData } from "../../../../types/forum";
import { loadThreadsandCategoryByCategory } from "../../../../utils/service/Forum/category";

const CategoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    limit: 10,
    totalItems: 0,
    sortBy: "created_at",
    sortOrder: "DESC",
  });
  const navigate = useNavigate();

  const sortOptions = [
    { value: "thread_name", label: "Thread Name" },
    { value: "created_at", label: "Created Date" },
    { value: "last_post_date", label: "Last Post" },
    { value: "post_count", label: "Post Count" },
  ];

  const loadData = useCallback(async () => {
    if (!id) {
      toast.error("Invalid category ID");
      setLoading(false);
      return;
    }

    try {
      await loadThreadsandCategoryByCategory(
        id,
        setLoading,
        setCategory,
        setThreads,
        setPagination,
        (errorMessage) => toast.error(errorMessage), // Error callback
        (successMessage) => toast.success(successMessage), // Success callback
        pagination.currentPage,
        pagination.limit,
        pagination.sortBy,
        pagination.sortOrder
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to load category data");
      setLoading(false);
    }
  }, [id, pagination.currentPage, pagination.limit, pagination.sortBy, pagination.sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSortBy = e.target.value;
    setPagination((prev) => ({
      ...prev,
      sortBy: newSortBy,
      currentPage: 1, // Reset to first page when changing sort
    }));
  };

  const toggleSortOrder = () => {
    const newOrder = pagination.sortOrder === "ASC" ? "DESC" : "ASC";
    setPagination((prev) => ({
      ...prev,
      sortOrder: newOrder,
      currentPage: 1, // Reset to first page when changing sort order
    }));
  };

  const renderSortIndicator = () => {
    return (
      <button onClick={toggleSortOrder} className={styles.sortOrderButton}>
        {pagination.sortOrder === "ASC" ? "↑" : "↓"}
      </button>
    );
  };

  const renderPagination = () => (
    <div className={styles.paginationContainer}>
      <button
        disabled={pagination.currentPage <= 1 || loading}
        onClick={() =>
          setPagination((prev) => ({
            ...prev,
            currentPage: prev.currentPage - 1,
          }))
        }
        className={styles.paginationButton}
      >
        Previous
      </button>
      <span>
        Page {pagination.currentPage} of {pagination.totalPages}
      </span>
      <button
        disabled={pagination.currentPage >= pagination.totalPages || loading}
        onClick={() =>
          setPagination((prev) => ({
            ...prev,
            currentPage: prev.currentPage + 1,
          }))
        }
        className={styles.paginationButton}
      >
        Next
      </button>
      <select
        value={pagination.limit}
        onChange={(e) =>
          setPagination((prev) => ({
            ...prev,
            limit: parseInt(e.target.value),
            currentPage: 1,
          }))
        }
        className={styles.limitSelector}
        disabled={loading}
      >
        <option value="5">5 per page</option>
        <option value="10">10 per page</option>
        <option value="20">20 per page</option>
        <option value="50">50 per page</option>
      </select>
    </div>
  );

  return (
    <div className={styles.forumContainer}>
      <ToastContainer />
      <div className={styles.main_navbar}>
        <Navbar />
      </div>

      <div className={styles.headerContainer}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading category...</p>
          </div>
        ) : category ? (
          <div>
            <div className={styles.headerSection}>
              <h1 className={styles.pageTitle}>{category.category_name}</h1>
              <p className={styles.pageSubtitle}>
                {category.thread_count} threads, {category.post_count} posts
              </p>
              <p className={styles.pageSubtitle}>
                {category.description
                  ? category.description.split(/\s+/).slice(0, 20).join(" ") +
                  (category.description.split(/\s+/).length > 20 ? "..." : "")
                  : "No description available"}
              </p>
              {
                category?.is_owner && ( // Ensure category is not null before accessing is_owner
                  <button
                    className={`${styles.primaryButton} ${styles.createButton}`}
                    onClick={() => navigate(`/forum/categories/${category.category_id}/update`)}
                  >
                    Update Category
                  </button>
                )
              }
              <button
                className={styles.secondaryButton}
                onClick={() => navigate(`/forum/threads/create?category=${category.category_id}`)}
                disabled={loading}
              >
                Add New Thread
              </button>
            </div>

            {/* Threads List */}
            <div className={styles.headerSection}>
              <h2 className={styles.pageTitle}>Threads in this Category</h2>
              <div className={styles.sortControls}>
                <select
                  value={pagination.sortBy}
                  onChange={handleSortChange}
                  className={styles.sortSelector}
                  disabled={loading}
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      Sort by {option.label}
                    </option>
                  ))}
                </select>
                {renderSortIndicator()}
              </div>
            </div>

            {threads.length > 0 ? (
              <>
                <div className={styles.tagGrid}>
                  {threads.map((thread) => (
                    <div
                      key={thread.thread_id}
                      className={styles.tagCard}
                      onClick={() => navigate(`/forum/threads/${thread.thread_id}`)}
                    >
                      <h3 className={styles.tagName}>{thread.thread_name}</h3>
                      <p className={styles.tagDescription}>
                        {thread.description
                          ? thread.description.split(/\s+/).slice(0, 10).join(" ") +
                          (thread.description.split(/\s+/).length > 10 ? "..." : "")
                          : "No description available"}
                      </p>
                      <div className={styles.tagMeta}>
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>Posts:</span>
                          <span className={styles.metaValue}>{thread.post_count}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>Last post:</span>
                          <span className={styles.metaValue}>
                            {thread.last_post_date
                              ? new Date(thread.last_post_date).toLocaleDateString()
                              : "No posts yet"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {renderPagination()}
              </>
            ) : (
              <div className={styles.emptyState}>
                <p className={styles.emptyMessage}>
                  No threads available in this category.
                </p>
                <button
                  className={styles.primaryButton}
                  onClick={() =>
                    navigate(`/forum/threads/create?category=${category.category_id}`)
                  }
                >
                  Create First Thread
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyMessage}>Category not found.</p>
            <button
              className={styles.primaryButton}
              onClick={() => navigate("/forum/categories")}
            >
              Browse Categories
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;