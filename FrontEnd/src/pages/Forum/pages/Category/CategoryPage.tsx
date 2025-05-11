import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "../../../../components/Navbar";
import ConfirmationModal from "../../../../components/ConfirmationModal";
import styles from "../../styles/Forum.module.css";
import { Category } from "../../../../types/Forum/category";
import { Thread } from "../../../../types/Forum/thread";
import { PaginationData } from "../../../../types/Forum/pagination";
import requestCategory from "../../../../utils/service/Forum/category";

const truncateText = (text: string, wordLimit: number, charLimit: number) => {
  if (!text) return "No description available";

  let truncated = text.length > charLimit ? text.substring(0, charLimit) + '...' : text;

  const words = truncated.split(/\s+/);
  if (words.length > wordLimit) {
    truncated = words.slice(0, wordLimit).join(' ') + '...';
  }
  return truncated;
};

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
    sortBy: "name",
    sortOrder: "DESC",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const sortOptions = [
    { value: "thread_name", label: "Thread Name" },
    { value: "created", label: "Created Date" },
    { value: "updated", label: "Last Post" },
    { value: "post", label: "Post Count" },
  ];

  const loadData = useCallback(async (
    page: number = pagination.currentPage,
    limit: number = pagination.limit,
    sortBy = pagination.sortBy,
    sortOrder = pagination.sortOrder
  ) => {
    if (!id) {
      toast.error("Invalid category ID");
      setLoading(false);
      return;
    }

    try {
      await requestCategory.loadThreadsandCategoryByCategory(
        id,
        setLoading,
        setCategory,
        setThreads,
        (newPagination) => {
          setPagination(prev => ({
            ...prev,
            ...newPagination,
            sortBy,
            sortOrder
          }));
        },
        (errorMessage) => toast.error(errorMessage),
        (successMessage) => toast.success(successMessage),
        page,
        limit,
        sortBy,
        sortOrder
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to load category data");
      setLoading(false);
    }
  }, [id, pagination.currentPage, pagination.limit, pagination.sortBy, pagination.sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteClick = (categoryId: number) => {
    setCategoryToDelete(categoryId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    try {
      await requestCategory.handleDeleteCategory(
        categoryToDelete,
        (errorMessage) => toast.error(errorMessage),
        (successMessage) => toast.success(successMessage),
        setLoading,
        () => {
          navigate("/forum/categories");
        }
      );
    } catch (error: any) {
      toast.error(error.message || "An error occurred while deleting the category");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setCategoryToDelete(null);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSortBy = e.target.value;
    setPagination(prev => ({
      ...prev,
      sortBy: newSortBy,
      currentPage: 1
    }));
  };

  const toggleSortOrder = () => {
    const newOrder = pagination.sortOrder === "ASC" ? "DESC" : "ASC";
    setPagination((prev) => ({
      ...prev,
      sortOrder: newOrder,
      currentPage: 1,
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
                {truncateText(category.description || "", 10, 100)}
              </p>
              {category?.is_owner && (
                <div className={styles.buttonGroup}>
                  <button
                    className={`${styles.primaryButton} ${styles.createButton}`}
                    onClick={() => navigate(`/forum/categories/${category.category_id}/update`)}
                  >
                    Update Category
                  </button>
                  <button
                    className={`${styles.primaryButton} ${styles.deleteButton}`}
                    onClick={() => handleDeleteClick(category.category_id)}
                  >
                    Delete Category
                  </button>
                </div>
              )}
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
                <div className={styles.forumGrid}>
                  {threads.map((thread) => (
                    <div
                      key={thread.thread_id}
                      className={styles.forumCard}
                      onClick={() => navigate(`/forum/threads/${thread.thread_id}`)}
                    >
                      <h3 className={styles.forumName}>{thread.thread_name}</h3>
                      <p className={styles.forumDescription}>
                        {truncateText(thread.description || "", 10, 50)}
                      </p>
                      <div className={styles.forumMeta}>
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

      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Category"
        message="Are you sure you want to delete this category? All threads and posts within it will be permanently removed. This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText="Delete Category"
        cancelText="Cancel"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default CategoryPage;