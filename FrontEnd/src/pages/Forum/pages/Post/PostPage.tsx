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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadPostPageById(id, setLoading, setPost, setComments, setError, setSuccess);
    } else {
      setError("Invalid post ID");
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
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

  if (loading) {
    return (
      <div className={styles.forumContainer}>
        <div className={styles.main_navbar}>
          <Navbar />
        </div>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading post...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.forumContainer}>
        <div className={styles.main_navbar}>
          <Navbar />
        </div>
        <div className={styles.errorAlert}>
          <span className={styles.errorIcon}>⚠️</span> {error}
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className={styles.forumContainer}>
        <div className={styles.main_navbar}>
          <Navbar />
        </div>
        <div className={styles.emptyState}>
          <p className={styles.emptyMessage}>Post not found</p>
          <button
            className={styles.primaryButton}
            onClick={() => navigate("/forum")}
          >
            Back to Forum
          </button>
        </div>
      </div>
    );
  }

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

        <div className={styles.postCard}>
          <div className={styles.postHeader}>
            <h1 className={styles.pageTitle}>{post.title}</h1>
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
          </div>

          <div className={styles.postContent}>
            {post.content}
          </div>

          {post.image_url && (
            <div className={styles.postImage}>
              <img
                src={post.image_url}
                alt="Post"
                className={styles.responsiveImage}
              />
            </div>
          )}

          <div className={styles.buttonGroup}>
            <button
              className={styles.secondaryButton}
              onClick={() => navigate(-1)}
            >
              Back
            </button>
            <button
              className={styles.primaryButton}
              onClick={onDeletePost}
              disabled={isDeleting}
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

        <div className={styles.commentSection}>
          <h2 className={styles.pageSubtitle}>Comments</h2>

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
                disabled={!commentText.trim()}
              >
                Post Comment
              </button>
            </div>
          </form>

          {comments.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyMessage}>No comments yet</p>
            </div>
          ) : (
            <div className={styles.commentsList}>
              {comments.map((comment) => (
                <div key={comment.comment_id} className={styles.commentCard}>
                  <div className={styles.commentHeader}>
                    <span className={styles.postAuthor}>{comment.username}</span>
                    <span className={styles.postDate}>
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <div className={styles.commentContent}>
                    {comment.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForumPostDetail;