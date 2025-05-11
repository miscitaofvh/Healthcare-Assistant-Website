import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "../../../../components/Navbar";
import ConfirmationModal from "../../../../components/ConfirmationModal";
import styles from "../../styles/Forum.module.css";
import { Thread } from "../../../../types/Forum/thread";
import { Post } from "../../../../types/Forum/post";
import { PaginationData } from "../../../../types/Forum/pagination";
import requestThread from "../../../../utils/service/Forum/thread";

const ThreadPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [thread, setThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    limit: 10,
    totalItems: 0,
    sortBy: "created_at",
    sortOrder: "DESC",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const sortOptions = [
    { value: "created_at", label: "Created Date" },
    { value: "updated_at", label: "Updated Date" },
    { value: "author", label: "Author" },
    { value: "like_count", label: "Likes" },
  ];

  const loadData = useCallback(async (
    page: number = pagination.currentPage,
    limit: number = pagination.limit,
    sortBy = pagination.sortBy,
    sortOrder = pagination.sortOrder
  ) => {
    if (!id) {
      toast.error("Invalid thread ID");
      setLoading(false);
      return;
    }

    try {
      await requestThread.loadPostsandThreadByCategory(
        id,
        setLoading,
        setThread,
        setPosts,
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
      toast.error(err.message || "Failed to load thread data");
      setLoading(false);
    }
  }, [id, pagination.currentPage, pagination.limit, pagination.sortBy, pagination.sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteClick = () => {
    if (!thread) return;
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!thread) return;
    
    setIsDeleting(true);
    try {
      await requestThread.handleDeleteThread(
        thread.thread_id,
        (errorMessage) => toast.error(errorMessage),
        (successMessage) => toast.success(successMessage),
        setLoading,
        () => {
          navigate(`/forum/categories/${thread.category_id}`);
        }
      );
    } catch (error: any) {
      toast.error(error.message || "An error occurred while deleting the thread");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
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

  const handleViewPost = (postId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/forum/posts/${postId}`);
  };

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
            <p>Loading thread...</p>
          </div>
        ) : thread ? (
          <div>
            {/* Thread Header Section */}
            <div className={styles.headerSection}>
              <h1 className={styles.pageTitle}>{thread.thread_name}</h1>
              <p className={styles.pageSubtitle}>
                {thread.description || "No description available"}
              </p>
              <div className={styles.threadMeta}>
                <span className={styles.metaItem}>
                  Posts: {thread.post_count || 0}
                </span>
                {thread.last_post_date && (
                  <span className={styles.metaItem}>
                    Last activity: {new Date(thread.last_post_date).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Thread Actions */}
            <div className={styles.buttonGroup}>
              {thread?.is_owner && (
                <>
                  <button
                    className={`${styles.primaryButton} ${styles.createButton}`}
                    onClick={() => navigate(`/forum/threads/${thread.thread_id}/update`)}
                    disabled={loading}
                  >
                    Update Thread
                  </button>
                  <button
                    className={`${styles.primaryButton} ${styles.deleteButton}`}
                    onClick={handleDeleteClick}
                    disabled={loading}
                  >
                    Delete Thread
                  </button>
                </>
              )}
              <button
                className={styles.secondaryButton}
                onClick={() => navigate(`/forum/posts/create?thread=${thread.thread_id}`)}
                disabled={loading}
              >
                Add New Post
              </button>
            </div>

            {/* Posts List */}
            <div className={styles.headerSection}>
              <h2 className={styles.pageTitle}>Posts</h2>
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

            {posts.length > 0 ? (
              <>
                <div className={styles.postsContainer}>
                  {posts.map((post) => (
                    <div key={post.post_id} className={styles.postCard}>
                      <div className={styles.postHeader}>
                        <span className={styles.postAuthor}>By {post.created_by || "Anonymous"}</span>
                        <span className={styles.postDate}>
                          {new Date(post.created_at).toLocaleString()}
                        </span>
                        {post.last_updated && (
                          <span className={styles.postUpdateDate}>
                            (updated: {new Date(post.last_updated).toLocaleString()})
                          </span>
                        )}
                      </div>
                      <div className={styles.postContent}>
                        <p>{post.content}</p>
                      </div>
                      <div className={styles.postMeta}>
                        <span className={styles.metaItem}>
                          Likes: {post.like_count || 0}
                        </span>
                        <span className={styles.metaItem}>
                          Replies: {post.comment_count || 0}
                        </span>
                      </div>
                      <div className={styles.postActions}>
                        <button
                          className={styles.primaryButton}
                          onClick={(e) => handleViewPost(post.post_id, e)}
                          disabled={loading}
                        >
                          View Post
                        </button>
                        {post.is_owner && (
                          <button
                            className={styles.secondaryButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/forum/posts/${post.post_id}/update`);
                            }}
                            disabled={loading}
                          >
                            Edit Post
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {renderPagination()}
              </>
            ) : (
              <div className={styles.emptyState}>
                <p className={styles.emptyMessage}>No posts available in this thread.</p>
                <button
                  className={styles.primaryButton}
                  onClick={() => navigate(`/forum/posts/create?thread=${thread.thread_id}`)}
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

      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Thread"
        message="Are you sure you want to delete this thread? All posts within it will be permanently removed. This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText="Delete Thread"
        cancelText="Cancel"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ThreadPage;