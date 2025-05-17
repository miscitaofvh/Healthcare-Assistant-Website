import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaRegCalendar } from "react-icons/fa";
import { CiCalendar } from "react-icons/ci";

import Navbar from "@components/Navbar";
import styles from "../../styles/Forum.module.css";
import requestCategory from "@utils/service/Forum/category";
import { Category, PaginationData } from "forum";
import { formatDate } from "@utils/helpers/dateFormatter";
// Helper function to truncate text
const truncateText = (text: string, wordLimit: number, charLimit: number) => {
  if (!text) return "No description available";

  let truncated = text.length > charLimit ? text.substring(0, charLimit) + '...' : text;

  const words = truncated.split(/\s+/);
  if (words.length > wordLimit) {
    truncated = words.slice(0, wordLimit).join(' ') + '...';
  }

  return truncated;
};

const CategoryList: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    limit: 10,
    totalItems: 0,
    sortBy: 'name',
    sortOrder: 'ASC'
  });
  const navigate = useNavigate();

  const sortOptions = [
    { value: 'category_name', label: 'Name' },
    { value: 'created', label: 'Created Date' },
    { value: 'updated', label: 'Updated Date' },
    { value: 'threads', label: 'Thread Count' },
    { value: 'posts', label: 'Post Count' }
  ];

  const loadData = useCallback((page: number = 1, limit: number = pagination.limit,
    sortBy = pagination.sortBy, sortOrder = pagination.sortOrder) => {
    requestCategory.loadCategories(
      setLoading,
      setCategories,
      (newPagination) => {
        setPagination(prev => ({
          ...prev,
          ...newPagination,
          sortBy, // Ensure we keep the current sortBy
          sortOrder // Ensure we keep the current sortOrder
        }));
      },
      (errorMessage) => toast.error(errorMessage),
      (successMessage) => toast.success(successMessage),
      page,
      limit,
      sortBy,
      sortOrder
    );
  }, [pagination.limit, pagination.sortBy, pagination.sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCategoryClick = (categoryId: number) => {
    navigate(`/forum/categories/${categoryId}`);
  };

  const handleCreateClick = () => {
    navigate(`/forum/categories/create`);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSortBy = e.target.value;
    setPagination(prev => ({
      ...prev,
      sortBy: newSortBy,
      currentPage: 1 // Reset to first page when sorting changes
    }));
    // No need to call loadData here - the useEffect will trigger it
  };

  const toggleSortOrder = () => {
    const newOrder = pagination.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    setPagination(prev => ({
      ...prev,
      sortOrder: newOrder,
      currentPage: 1 // Reset to first page when order changes
    }));
    // No need to call loadData here - the useEffect will trigger it
  };

  const renderSortIndicator = () => {
    return (
      <button
        onClick={toggleSortOrder}
        className={styles.sortOrderButton}
      >
        {pagination.sortOrder === 'ASC' ? '↑' : '↓'}
      </button>
    );
  };

  const renderPagination = () => (
    <div className={styles.paginationContainer}>
      <button
        disabled={pagination.currentPage <= 1 || loading}
        onClick={() => loadData(pagination.currentPage - 1)}
        className={styles.paginationButton}
      >
        Previous
      </button>
      <span>
        Page {pagination.currentPage} of {pagination.totalPages}
      </span>
      <button
        disabled={pagination.currentPage >= pagination.totalPages || loading}
        onClick={() => loadData(pagination.currentPage + 1)}
        className={styles.paginationButton}
      >
        Next
      </button>
      <select
        value={pagination.limit}
        onChange={(e) => loadData(1, parseInt(e.target.value))}
        className={styles.limitSelector}
        disabled={loading}
      >
        <option value="6">6 per page</option>
        <option value="12">12 per page</option>
        <option value="18">18 per page</option>
        <option value="24">24 per page</option>
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
        <div className={styles.headerSection}>
          <h1 className={styles.pageTitle}>Forum Categories</h1>
          <p className={styles.pageSubtitle}>Browse and manage discussion categories</p>
          <button
            className={`${styles.primaryButton} ${styles.createButton}`}
            onClick={handleCreateClick}
          >
            + Create New Category
          </button>
          <div className={styles.sortControls}>
            <select
              value={pagination.sortBy}
              onChange={handleSortChange}
              className={styles.sortSelector}
              disabled={loading}
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  Sort by {option.label}
                </option>
              ))}
            </select>
            {renderSortIndicator()}
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading categories...</p>
          </div>
        ) : categories.length > 0 ? (
          <>
            <div className={styles.forumGrid}>
              {categories.map((category) => (
                <div
                  key={category.category_id}
                  className={styles.forumCard}
                  onClick={() => handleCategoryClick(category.category_id)}
                >
                  <h3 className={styles.forumName}>
                    {truncateText(category.category_name || "", 10, 40)}
                  </h3>
                  <p className={styles.tagDescription}>
                    {truncateText(category.description || "", 10, 50)}
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
                    <div className={styles.dateContainer}>
                      <div className={styles.dateItemWithIcon}>
                        <FaRegCalendar className={styles.dateIcon} />
                        <span className={styles.dateLabel}>Created:</span>
                        <span className={styles.dateValue}>{formatDate(category.created_at)}</span>
                      </div>
                      <div className={styles.dateItemWithIcon}>
                        <CiCalendar className={styles.dateIcon} />
                        <span className={styles.dateLabel}>Updated:</span>
                        <span className={styles.dateValue}>{formatDate(category.last_updated)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {renderPagination()}
          </>
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