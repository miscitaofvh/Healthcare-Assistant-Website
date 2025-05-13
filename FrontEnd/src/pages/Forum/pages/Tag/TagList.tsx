import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import requestTag from "../../../../utils/service/Forum/tag";
import { Tag } from "../../../../types/Forum/tag";
import { PaginationData } from "../../../../types/Forum/pagination";
import { formatDate } from "../../../../utils/helpers/dateFormatter";

// Reuse the same truncateText helper from CategoryList
const truncateText = (text: string, wordLimit: number, charLimit: number) => {
  if (!text) return "No description available";
  
  let truncated = text.length > charLimit ? text.substring(0, charLimit) + '...' : text;
  
  const words = truncated.split(/\s+/);
  if (words.length > wordLimit) {
    truncated = words.slice(0, wordLimit).join(' ') + '...';
  }
  
  return truncated;
};

const TagList: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    limit: 10,
    totalItems: 0,
    sortBy: 'tag_name',
    sortOrder: 'ASC'
  });
  const navigate = useNavigate();

  const sortOptions = [
    { value: 'tag_name', label: 'Name' },
    { value: 'created_at', label: 'Created Date' },
    { value: 'last_used_at', label: 'Last Used' },
    { value: 'post_count', label: 'Post Count' }
  ];

  const loadData = useCallback((page: number = 1, limit: number = pagination.limit, 
    sortBy = pagination.sortBy, sortOrder = pagination.sortOrder) => {
    requestTag.loadTags(
      setLoading,
      setTags,
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
  }, [pagination.limit, pagination.sortBy, pagination.sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTagClick = (tagId: number) => {
    navigate(`/forum/tags/${tagId}`);
  };

  const handleCreateClick = () => {
    navigate(`/forum/tags/create`);
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
    const newOrder = pagination.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    setPagination(prev => ({
      ...prev,
      sortOrder: newOrder,
      currentPage: 1
    }));
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
          <h1 className={styles.pageTitle}>Forum Tags</h1>
          <p className={styles.pageSubtitle}>Browse and manage discussion tags</p>
          <button
            className={`${styles.primaryButton} ${styles.createButton}`}
            onClick={handleCreateClick}
          >
            + Create New Tag
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
            <p>Loading tags...</p>
          </div>
        ) : tags.length > 0 ? (
          <>
            <div className={styles.forumGrid}>
              {tags.map((tag) => (
                <div
                  key={tag.tag_id}
                  className={styles.forumCard}
                  onClick={() => handleTagClick(tag.tag_id)}
                >
                  <h3 className={styles.forumName}>
                    #{tag.tag_name}
                  </h3>
                  <p className={styles.tagDescription}>
                    {truncateText(tag.description || "", 10, 100)}
                  </p>
                  <div className={styles.tagMeta}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Created by:</span>
                      <span className={styles.metaValue}>{tag.created_by}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Post count:</span>
                      <span className={styles.metaValue}>{tag.post_count || 0}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Last used:</span>
                      <span className={styles.metaValue}>{formatDate(tag.last_used_at || 0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {renderPagination()}
          </>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyMessage}>No tags available</p>
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
  );
};

export default TagList;