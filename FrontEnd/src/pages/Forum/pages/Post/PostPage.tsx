import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { Post, PostComment } from "../../../../types/forum";
import {
  loadPostPageById,
  deletePostFE,
  likePostFE,
} from "../../../../utils/service/Forum/post";
import {
  handleCommentSubmit,
  deleteCommentFE,
  likeCommentFE,
} from "../../../../utils/service/Forum/comment";
import { formatDate } from "../../../../utils/helpers/dateFormatter";
import { FaEdit, FaUser, FaCalendar, FaFolder, FaComments, FaHeart, FaReply, FaTrash } from 'react-icons/fa';

const ForumPostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isLiking, setIsLiking] = useState<boolean>(false);

  useEffect(() => {
    if (!id) {
      setError("Invalid post ID.");
      setLoading(false);
      return;
    }
    loadData();
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

  const loadData = async () => {
    try {
      await loadPostPageById(
        (id || ""),
        setLoading,
        setPost,
        setComments,
        setError,
        setSuccess
      );
    } catch (err: any) {
      setError(err?.message || "Failed to load post details.");
      setLoading(false);
    }
  };

  // ... (keep existing useEffect hooks for success/error messages)

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
        replyingTo || undefined,  // Pass undefined instead of null for no reply
        setCommentText,
        setError,
        setSuccess,
        async () => {
          setReplyingTo(null);
          await loadData();
        }
      );
    } catch (error) {
      console.error("Comment submission error:", error);
    }
  };

  const onDeletePost = async () => {
    if (!id || !window.confirm("Are you sure you want to delete this post?")) {
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

  const onLikePost = async () => {
    if (!id || isLiking) return;
    setIsLiking(true);
    try {
      await likePostFE(id, setError, setSuccess, loadData);
    } catch (err) {
      setError("Failed to like post");
    } finally {
      setIsLiking(false);
    }
  };

  const onDeleteComment = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      await deleteCommentFE(commentId, setError, setSuccess, loadData);
    } catch (err) {
      setError("Failed to delete comment");
    }
  };

  const onLikeComment = async (commentId: string) => {
    try {
      await likeCommentFE(commentId, setError, setSuccess, loadData);
    } catch (err) {
      setError("Failed to like comment");
    }
  };

  const onReplyToComment = (commentId: string) => {
    setReplyingTo(commentId === replyingTo ? null : commentId);
    setCommentText(commentId === replyingTo ? "" : `@${comments.find(c => c.comment_id === parseInt(commentId))?.username} `);
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
      </div>
      {post && (
        <div>
          <div className={styles.postMeta}>
            <div className={styles.metaGroup}>
              <span className={styles.metaItem}>
                <FaUser className={styles.metaIcon} />
                {post.author}
              </span>
              <span className={styles.metaItem}>
                <FaCalendar className={styles.metaIcon} />
                {formatDate(post.created_at)}
                {post.created_at !== post.last_updated && (
                  <span className={styles.updatedBadge} title={`Last updated ${formatDate(post.last_updated)}`}>
                    (edited)
                  </span>
                )}
              </span>
            </div>

            <div className={styles.metaGroup}>
              <span className={styles.metaItem}>
                <FaFolder className={styles.metaIcon} />
                {post.category_name}
              </span>
              <span className={styles.metaItem}>
                <FaComments className={styles.metaIcon} />
                {post.thread_name}
              </span>
            </div>
          </div>

          <div className={styles.postActions}>
            <button
              className={`${styles.likeButton} ${post.is_liked ? styles.liked : ''}`}
              onClick={onLikePost}
              disabled={isLiking}
              aria-label={post.is_liked ? 'Unlike post' : 'Like post'}
            >
              <FaHeart />
              <span className={styles.likeCount}>{post.like_count}</span>
              {isLiking && <span className={styles.spinner} aria-hidden="true" />}
            </button>

            <div className={styles.tagContainer}>
              {post.tags.map(tag => (
                <span key={tag.tag_id} className={styles.tag}>
                  #{tag.tag_name}
                </span>
              ))}
            </div>
          </div>

          {/* Post Header Section */}
          <div className={styles.postHeader}>
            <div className={styles.postTitleRow}>
              <h1 className={styles.postTitle}>{post.title}</h1>
              {post.is_owner && (
                <button
                  className={styles.editButton}
                  onClick={() => navigate(`/forum/posts/${post.post_id}/edit`)}
                >
                  <FaEdit /> Edit
                </button>
              )}
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
            </div>

            {/*  */}
          </div>

          {/* Comments Section */}
          <div className={styles.headerSection}>
            <h2 className={styles.pageTitle}>Comments ({comments.length})</h2>
          </div>

          <div className={styles.tagCard}>
            <form onSubmit={onCommentSubmit} className={styles.commentForm}>
              {replyingTo && (
                <div className={styles.replyIndicator}>
                  Replying to @{comments.find(c => c.comment_id === parseInt(replyingTo))?.username}
                  <button
                    type="button"
                    className={styles.cancelReply}
                    onClick={() => setReplyingTo(null)}
                  >
                    Cancel
                  </button>
                </div>
              )}
              <textarea
                className={styles.formTextarea}
                placeholder={replyingTo
                  ? `Reply to @${comments.find(c => c.comment_id === parseInt(replyingTo))?.username}...`
                  : "Write your comment here..."}
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
                  {replyingTo ? "Post Reply" : "Post Comment"}
                </button>
              </div>
            </form>

            {comments.length > 0 ? (
              <div className={styles.commentsContainer}>
                {comments.map((comment) => (
                  <div
                    key={comment.comment_id}
                    className={`${styles.commentCard} ${comment.parent_comment_id ? styles.replyComment : ''}`}
                    style={{ marginLeft: comment.depth ? `${comment.depth * 20}px` : '0' }}
                  >
                    <div className={styles.commentHeader}>
                      <span className={styles.commentAuthor}>{comment.username}</span>
                      <br />
                      <span className={styles.commentDate}>
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <div className={styles.commentContent}>
                      <p>{comment.content}</p>
                    </div>
                    <div className={styles.commentActions}>
                      <button
                        className={styles.actionButton}
                        onClick={() => onLikeComment((comment.comment_id).toString())}
                      >
                        <FaHeart className={comment.is_liked ? styles.liked : ''} />
                        {comment.like_count}
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={() => onReplyToComment((comment.comment_id).toString())}
                      >
                        <FaReply /> Reply
                      </button>
                      {(comment.is_owner || post.is_owner) && (
                        <button
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                          onClick={() => onDeleteComment((comment.comment_id).toString())}
                        >
                          <FaTrash /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p className={styles.emptyMessage}>No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ForumPostDetail;