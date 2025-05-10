import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { loadCategories } from "../../../../utils/service/Forum/category";
import { CategoryMain, PaginationData } from "../../../../types/forum";

const CategoryList: React.FC = () => {
  const [categories, setCategories] = useState<CategoryMain[]>([]);
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
    { value: 'name', label: 'Name' },
    { value: 'created', label: 'Created Date' },
    { value: 'updated', label: 'Updated Date' },
    { value: 'threads', label: 'Thread Count' },
    { value: 'posts', label: 'Post Count' }
  ];

  // Use useCallback to memoize the loadData function
  const loadData = useCallback((page: number = 1, limit: number = pagination.limit, sortBy = pagination.sortBy, sortOrder = pagination.sortOrder) => {
    loadCategories(
      setLoading,
      setCategories,
      setPagination,
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
      sortBy: newSortBy
    }));
    // Pass the new sortBy value directly to loadData
    loadData(1, pagination.limit, newSortBy, pagination.sortOrder);
  };

  const toggleSortOrder = () => {
    const newOrder = pagination.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    setPagination(prev => ({
      ...prev,
      sortOrder: newOrder
    }));
    // Pass the new sortOrder value directly to loadData
    loadData(1, pagination.limit, pagination.sortBy, newOrder);
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
            <div className={styles.tagGrid}>
              {categories.map((category) => (
                <div
                  key={category.category_id}
                  className={styles.tagCard}
                  onClick={() => handleCategoryClick(category.category_id)}
                >
                  <h3 className={styles.tagName}>
                    {category.category_name}
                  </h3>
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