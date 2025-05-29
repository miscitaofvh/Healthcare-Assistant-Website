import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "@components/Navbar";
import ConfirmationModal from "@components/ConfirmationModal";
import styles from "../../styles/Forum.module.css";
import { PostbyTag, Tag, PaginationData } from "src/types/forum";
import requestTag from "@utils/service/Forum/tag";
import { stripMarkdown } from "@utils/helpers/dateFormatter";

const TagPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tag, setTag] = useState<Tag | null>(null);
  const [posts, setPosts] = useState<PostbyTag[]>([]);
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
  const [tagToDelete, setTagToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const sortOptions = [
    { value: "created_at", label: "Created Date" },
    { value: "updated_at", label: "Updated Date" },
    { value: "like_count", label: "Like Count" },
    { value: "title", label: "Post Title" },
  ];

  const loadData = useCallback(async (
    page: number = pagination.currentPage,
    limit: number = pagination.limit,
    sortBy = pagination.sortBy,
    sortOrder = pagination.sortOrder
  ) => {
    if (!id) {
      toast.error("Invalid tag ID");
      setLoading(false);
      return;
    }

    try {
      await requestTag.loadPostsandTagByTag(
        id,
        setLoading,
        setTag,
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
      toast.error(err.message || "Failed to load tag data");
      setLoading(false);
    }
  }, [id, pagination.currentPage, pagination.limit, pagination.sortBy, pagination.sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteClick = (tagId: number) => {
    setTagToDelete(tagId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!tagToDelete) return;

    setIsDeleting(true);
    try {
      await requestTag.handleDeleteTag(
        tagToDelete,
        (errorMessage) => toast.error(errorMessage),
        (successMessage) => toast.success(successMessage),
        setLoading,
        () => {
          navigate("/forum/tags");
        }
      );
    } catch (error: any) {
      toast.error(error.message || "An error occurred while deleting the tag");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setTagToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setTagToDelete(null);
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
            <p>Loading tag...</p>
          </div>
        ) : tag ? (
          <div>
            <div className={styles.headerSection}>
              <h1 className={styles.pageTitle}>#{tag.tag_name}</h1>
              <p className={styles.pageSubtitle}>
                {tag.post_count} posts
              </p>
              <p className={styles.pageSubtitle}>
                {tag.description || "No description available"}
              </p>

              {tag?.is_owner && (
                <div className={styles.buttonGroup}>
                  <button
                    className={`${styles.primaryButton} ${styles.createButton}`}
                    onClick={() => navigate(`/forum/tags/${tag.tag_id}/update`)}
                  >
                    Update Tag
                  </button>
                  <button
                    className={`${styles.primaryButton} ${styles.deleteButton}`}
                    onClick={() => handleDeleteClick(tag.tag_id)}
                  >
                    Delete Tag
                  </button>
                </div>
              )}
            </div>

            {/* Posts List */}
            <div className={styles.headerSection}>
              <h2 className={styles.pageTitle}>Posts with this Tag</h2>
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
                <div className={styles.forumGrid}>
                  {posts.map((post) => (
                    <div
                      key={post.post_id}
                      className={styles.forumCard}
                      onClick={() => navigate(`/forum/posts/${post.post_id}`)}
                    >
                      <h3 className={styles.forumName}>{post.title}</h3>
                      <p className={styles.forumDescription}>
                        {stripMarkdown(post.content).length > 200
                          ? `${stripMarkdown(post.content).substring(0, 200)}...`
                          : stripMarkdown(post.content)}
                      </p>
                      <div className={styles.forumMeta}>
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>Thread:</span>
                          <span className={styles.metaValue}>{post.thread_name}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>Author:</span>
                          <span className={styles.metaValue}>{post.created_by}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>Likes:</span>
                          <span className={styles.metaValue}>{post.like_count}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>Posted:</span>
                          <span className={styles.metaValue}>
                            {new Date(post.created_at).toLocaleDateString()}
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
                <p className={styles.emptyMessage}>No posts available with this tag.</p>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyMessage}>Tag not found.</p>
            <button
              className={styles.primaryButton}
              onClick={() => navigate("/forum/tags")}
            >
              Browse Tags
            </button>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Tag"
        message="Are you sure you want to delete this tag? This will remove the tag from all posts that use it. This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText="Delete Tag"
        cancelText="Cancel"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default TagPage;