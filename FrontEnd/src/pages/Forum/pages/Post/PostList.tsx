import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import InteractPost from "../../../../utils/service/Forum/post";
import { PostListMain } from "../../../../types/Forum/post";
import { PaginationData } from "../../../../types/Forum/pagination";
import { formatDate, stripMarkdown } from "../../../../utils/helpers/dateFormatter";

const PostList: React.FC = () => {
  const [posts, setPosts] = useState<PostListMain[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    limit: 10,
    totalItems: 0,
    sortBy: 'created_at',
    sortOrder: 'DESC'
  });
  const navigate = useNavigate();

  const sortOptions = [
    { value: 'created', label: 'Created Date' },
    { value: 'updated', label: 'Updated Date' },
    { value: 'like', label: 'Like Count' },
    { value: 'title', label: 'Post Title' },
    { value: 'views', label: 'View Count' },
    { value: 'comments', label: 'Comment Count' }
  ];

  const loadData = useCallback((page: number = 1, limit: number = pagination.limit,
    sortBy = pagination.sortBy, sortOrder = pagination.sortOrder) => {
    InteractPost.loadPosts(
      setLoading,
      setPosts,
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

  const handlePostClick = (postId: number) => {
    navigate(`/forum/posts/${postId}`);
  };

  const handleCreateClick = () => {
    navigate(`/forum/posts/create`);
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
      <ToastContainer position="top-right" autoClose={5000} />
      <div className={styles.main_navbar}>
        <Navbar />
      </div>

      <div className={styles.headerContainer}>
        <div className={styles.headerSection}>
          <h1 className={styles.pageTitle}>Forum Posts</h1>
          <p className={styles.pageSubtitle}>Browse and manage discussion posts</p>
          <button
            className={`${styles.primaryButton} ${styles.createButton}`}
            onClick={handleCreateClick}
          >
            + Create New Post
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
            <p>Loading posts...</p>
          </div>
        ) : posts.length > 0 ? (
          <>
            <div className={styles.postsContainer}>
              {posts.map((post) => (
                <div
                  key={post.post_id}
                  className={styles.postCard}
                  onClick={() => handlePostClick(post.post_id)}
                >
                  <div className={styles.postHeader}>
                    <div>
                      <h3 className={styles.forumName}>{post.title}</h3>
                      <span className={styles.postAuthor}>By {post.created_by}</span>
                    </div>
                    <div className={styles.metaValue}>
                      {formatDate(post.created_at)}
                    </div>
                  </div>

                  <div className={styles.forumDescription}>
                    {stripMarkdown(post.content).length > 200
                      ? `${stripMarkdown(post.content).substring(0, 200)}...`
                      : stripMarkdown(post.content)}
                  </div>

                  <div className={styles.forumMeta}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Category:</span>
                      <span className={styles.metaValue}>{post.category_name}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Thread:</span>
                      <span className={styles.metaValue}>{post.thread_name}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Likes:</span>
                      <span className={styles.metaValue}>{post.like_count}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Comments:</span>
                      <span className={styles.metaValue}>{post.comment_count}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Views:</span>
                      <span className={styles.metaValue}>{post.view_count}</span>
                    </div>
                    {post.tags.length > 0 && (
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Tags:</span>
                        <span className={styles.metaValue}>
                          {post.tags.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {renderPagination()}
          </>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyMessage}>No posts available</p>
            <button
              className={styles.primaryButton}
              onClick={handleCreateClick}
            >
              Create First Post
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostList;