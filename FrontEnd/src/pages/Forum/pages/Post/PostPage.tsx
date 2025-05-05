// src/components/Forum/pages/ForumPostDetail.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { Post, PostComment } from "../../../../types/forum";
import {
  loadPostPageById,
  deletePostFE,
  handleCommentSubmit,
} from "../../../../utils/service/Forum/post";
import { formatDate } from "../../../../utils/helpers/dateFormatter";

const ForumPostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (!id) {
      setError("Invalid post ID.");
      setLoading(false);
      return;
    }
    try {
      loadPostPageById(id, setLoading, setPost, setComments, setError, setSuccess);
    } catch (err : any) {
      setError(err || "Failed to load post details.");
      setLoading(false);
    }
  }, [id]);

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

  const onCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) {
      setError("Comment cannot be empty");
      return;
    }
    if (!id) {
      setError("Invalid post ID");
      return;
    }

    try {
      await handleCommentSubmit(
        id,
        commentText,
        setCommentText,
        setError,
        setSuccess,
        () => loadPostPageById(id, setLoading, setPost, setComments, setError, setSuccess)
      );
    } catch (err) {
      setError("Failed to submit comment");
    }
  };

  const onDeletePost = async () => {
    if (!id) {
      setError("Invalid post ID");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deletePostFE(id, setLoading, setError, setSuccess, () => {
        setTimeout(() => navigate("/forum"), 2000);
      });
    } catch (err) {
      setError("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.forumContainer}>
      <div className={styles.main_navbar}>
        <Navbar />
      </div>

      <div className={styles.tagListContainer}>

        {error && (
          <div className={styles.errorAlert}>
            <span className={styles.errorIcon}>⚠️</span> {error}
          </div>
        )}

        {success && (
          <div className={styles.alertSuccess}>
            <span className={styles.successIcon}>✅</span> {success}
          </div>
        )}

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading post...</p>
          </div>
        ) : post ? (
          <div>
            {/* Post Header Section */}
            <div className={styles.headerSection}>
              <h1 className={styles.pageTitle}>{post.title}</h1>
            </div>

            {/* Post Content Card */}
            <div className={styles.tagCard}>
              <div className={styles.tagMeta}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Category: </span>
                  <span className={styles.metaValue}>{post.category_name}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Thread:</span>
                  <span className={styles.metaValue}>{post.thread_name}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Posted by:</span>
                  <span className={styles.metaValue}>{post.author}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Posted at:</span>
                  <span className={styles.metaValue}>{formatDate(post.created_at)}</span>
                </div>
                {post.last_updated && (
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Last updated:</span>
                    <span className={styles.metaValue}>{formatDate(post.last_updated)}</span>
                  </div>
                )}
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Like: </span>
                  <span className={styles.metaValue}>{post.like_count}</span>
                </div>
              </div>

              <div className={styles.postContent}>
                <p>{post.content}</p>
                {post.image_url && (
                  <div className={styles.postImage}>
                    <img
                      src={post.image_url}
                      alt="Post content"
                      className={styles.responsiveImage}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className={styles.buttonGroup}>
                <button
                  className={styles.secondaryButton}
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  className={styles.primaryButton}
                  onClick={onDeletePost}
                  disabled={isDeleting || loading}
                >
                  {isDeleting ? (
                    <>
                      <span className={styles.spinnerSmall}></span> Deleting...
                    </>
                  ) : (
                    "Delete Post"
                  )}
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div className={styles.headerSection}>
              <h2 className={styles.pageTitle}>Comments</h2>
            </div>

            <div className={styles.tagCard}>
              <form onSubmit={onCommentSubmit} className={styles.commentForm}>
                <textarea
                  className={styles.formTextarea}
                  placeholder="Write your comment here..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={4}
                  required
                  maxLength={1000}
                />
                <small className={styles.characterCount}>
                  {commentText.length}/1000 characters
                </small>
                <div className={styles.buttonGroup}>
                  <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={!commentText.trim() || loading}
                  >
                    Post Comment
                  </button>
                </div>
              </form>

              {comments.length > 0 ? (
                <div className={styles.postsContainer}>
                  {comments.map((comment) => (
                    <div key={comment.comment_id} className={styles.postCard}>
                      <div className={styles.postHeader}>
                        <span className={styles.postAuthor}>{comment.username}</span>
                        <span className={styles.postDate}>
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <div className={styles.postContent}>
                        <p>{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p className={styles.emptyMessage}>No comments available for this post.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyMessage}>Post not found.</p>
            <button
              className={styles.primaryButton}
              onClick={() => navigate("/forum")}
              disabled={loading}
            >
              Back to Forum
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumPostDetail;