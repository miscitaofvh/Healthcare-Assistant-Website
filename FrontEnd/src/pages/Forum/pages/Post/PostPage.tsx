import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { Post, PostComment } from "../../../../types/forum";
import {
  loadPostPageById,
  deletePostFE,
  likePostFE,
  unlikePostFE
} from "../../../../utils/service/Forum/post";
import {
  handleCommentSubmit,
  deleteCommentFE,
  likeCommentFE,
  unlikeCommentFE,
  reportCommentFE,
  countTotalComments
} from "../../../../utils/service/Forum/comment";
import { formatDate } from "../../../../utils/helpers/dateFormatter";
import { FaEdit, FaUser, FaCalendar, FaFolder, FaComments, FaHeart, FaReply, FaTrash, FaFlag, FaRegHeart } from 'react-icons/fa';

const ForumPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [mainCommentText, setMainCommentText] = useState("");
  const [replyCommentTexts, setReplyCommentTexts] = useState<Record<number, string>>({});
  const [replyingTo, setReplyingTo] = useState<{ commentId: number; username: string } | null>(null);
  const [reportingComment, setReportingComment] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isPostLiking, setIsPostLiking] = useState<boolean>(false);
  const [isCommentLiking, setIsCommentLiking] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!id) {
      setError("Invalid post ID.");
      setLoading(false);
      return;
    }
    loadInitialData();
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

  const loadInitialData = async () => {
    try {
      setLoading(true);

      await loadPostPageById(
        id || "",
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

  const onCommentSubmit = async (parentId?: number) => {
    const text = parentId
      ? replyCommentTexts[parentId]?.trim()
      : mainCommentText.trim();

    if (!text || !post) return;

    try {
      const parentDepth = parentId
        ? comments.find(c => c.comment_id === parentId)?.depth || 0
        : 0;

      await handleCommentSubmit(
        id || "",
        text,
        parentId?.toString(),
        parentId ? parentDepth + 1 : 0, // Increment depth for replies
        () => {
          if (parentId) {
            const newReplyTexts = { ...replyCommentTexts };
            delete newReplyTexts[parentId];
            setReplyCommentTexts(newReplyTexts);
          } else {
            setMainCommentText("");
          }
        },
        setError,
        setSuccess,
        async () => {
          setReplyingTo(null);
          await loadPostPageById(
            id || "",
            setLoading,
            setPost,
            setComments,
            setError,
            setSuccess
          );
        }
      );
    } catch (error) {
      alert("Comment submission error:");
    }
  };

  const handleReportComment = async (commentId: number) => {
    if (!reportReason.trim()) {
      setError("Please provide a reason for reporting");
      return;
    }

    try {
      await reportCommentFE(
        commentId.toString(),
        reportReason,
        setError,
        setSuccess,
        () => {
          setReportingComment(null);
          setReportReason("");
        }
      );
    } catch (error) {
      alert("Failed to report comment:");
    }
  };

  const handlePostLike = async () => {
    if (!post) {
      setError("Post not found.");
      return;
    }

    try {
      setIsPostLiking(true);
      if (post.is_liked) {
        await unlikePostFE(
          post.post_id.toString(),
          setError,
          setSuccess,
          () => loadInitialData()
        );
      } else {
        await likePostFE(
          post.post_id.toString(),
          setError,
          setSuccess,
          () => loadInitialData()
        );
      }
    } catch (error) {
      alert("Like action failed:");
    } finally {
      setIsPostLiking(false);
    }
  };

  const handleCommentLike = async (comment: PostComment) => {
    try {
      setIsCommentLiking(prev => ({ ...prev, [comment.comment_id]: true }));

      if (comment.is_liked) {
        await unlikeCommentFE(
          comment.comment_id.toString(),
          post?.post_id.toString() || "",
          setError,
          setSuccess,
          () => loadInitialData()
        );
      } else {
        await likeCommentFE(
          comment.comment_id.toString(),
          post?.post_id.toString() || "",
          setError,
          setSuccess,
          () => loadInitialData()
        );
      }
    } catch (error) {
      alert("Comment like action failed:");
    } finally {
      setIsCommentLiking(prev => ({ ...prev, [comment.comment_id]: false }));
    }
  };

  const renderComments = (comments: PostComment[]) => {
    return comments.map((comment) => (
      <div
        key={comment.comment_id}
        className={`${styles.commentCard} ${comment.parent_comment_id ? styles.replyComment : ''}`}
        style={{ marginLeft: `${comment.depth * 20}px` }}
      >
        <div className={styles.commentHeader}>
          <span className={styles.commentAuthor}>{comment.username}</span>
          <br />
          <span className={styles.commentDate}>
            {formatDate(comment.created_at)}
            {comment.created_at !== comment.last_updated && (
              <span className={styles.updatedBadge} title={`Last updated ${formatDate(comment.last_updated)}`}>
                (edited)
              </span>
            )}
          </span>
        </div>

        <div className={styles.commentContent}>
          <p>{comment.content}</p>
        </div>

        <div className={styles.commentActions}>
          <button
            className={`${styles.actionButton} ${comment.is_liked ? styles.liked : styles.notLiked}`}
            onClick={() => handleCommentLike(comment)}
            disabled={isCommentLiking[comment.comment_id]}
            aria-label={comment.is_liked ? "Unlike this comment" : "Like this comment"}
          >
            {comment.is_liked ? (
              <FaHeart color="#ff0000" className={styles.heartIcon} />
            ) : (
              <FaRegHeart className={styles.heartIcon} />
            )}
            <span className={styles.likeCount}>
              {comment.like_count || 0 > 0 ? comment.like_count : ''}
            </span>
            {isCommentLiking[comment.comment_id] && (
              <span className={styles.spinner} aria-hidden="true" />
            )}
          </button>

          <button
            className={styles.actionButton}
            onClick={() =>
              setReplyingTo(
                replyingTo?.commentId === comment.comment_id
                  ? null
                  : { commentId: comment.comment_id, username: comment.username }
              )
            }
          >
            <FaReply /> Reply
          </button>

          <button
            className={styles.actionButton}
            onClick={() => setReportingComment(reportingComment === comment.comment_id ? null : comment.comment_id)}
          >
            <FaFlag /> Report
          </button>

          {(comment.is_owner || post?.is_owner) ? (
            <button
              className={`${styles.actionButton} ${styles.deleteButton}`}
              onClick={() => deleteCommentFE(comment.comment_id.toString(), setError, setSuccess, () => loadInitialData())}
            >
              <FaTrash /> Delete
            </button>
          ) : null}
        </div>

        {replyingTo?.commentId === comment.comment_id && (
          <div className={styles.replyForm}>
            <textarea
              className={styles.formTextarea}
              placeholder={`Reply to @${comment.username}...`}
              value={replyCommentTexts[comment.comment_id] || ""}
              onChange={(e) => setReplyCommentTexts({
                ...replyCommentTexts,
                [comment.comment_id]: e.target.value
              })}
              rows={3}
            />
            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setReplyingTo(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => onCommentSubmit(comment.comment_id)}
                disabled={!replyCommentTexts[comment.comment_id]?.trim()}
              >
                Post Reply
              </button>
            </div>
          </div>
        )}

        {reportingComment === comment.comment_id && (
          <div className={styles.reportForm}>
            <textarea
              className={styles.formTextarea}
              placeholder="Reason for reporting..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={3}
            />
            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setReportingComment(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => handleReportComment(comment.comment_id)}
                disabled={!reportReason.trim()}
              >
                Submit Report
              </button>
            </div>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className={styles.commentReplies}>
            {renderComments(comment.replies)}
          </div>
        )}
      </div>
    ));
  };

  if (!post) {
    return (
      <div className={styles.forumContainer}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading post...</p>
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

        <br /> <br />
        {/* Post section */}
        <div className={styles.breadcrumbs}>
          <span onClick={() => navigate('/forum')}>Forum</span> &gt;
          <span onClick={() => navigate(`/forum/categories/${post.category_id}`)}>
            {post.category_name}
          </span> &gt;
          <span onClick={() => navigate(`/forum/threads/${post.thread_id}`)}>
            {post.thread_name}
          </span>
        </div>

        <div className={styles.postHeader}>
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
              className={`${styles.likeButton} ${post.is_liked ? styles.unlike : ''}`}
              onClick={handlePostLike}
              disabled={isPostLiking}
            >
              <FaHeart className={post.is_liked ? styles.heartIcon : ''} />
              <span className={styles.likeCount}>{post.like_count}</span>
              {isPostLiking && <span className={styles.spinner} aria-hidden="true" />}
            </button>

            <div className={styles.tagContainer}>
              {post.tags.map(tag => (
                <span
                  key={tag.tag_id}
                  className={styles.tag}
                  onClick={() => navigate(`/forum/tags/${tag.tag_id}`)}
                >
                  #{tag.tag_name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.postTitleRow}>
          <h1 className={styles.postTitle}>{post.title}</h1>
          {post.is_owner ? (
            <button
              className={styles.editButton}
              onClick={() => navigate(`/forum/posts/${post.post_id}/update`)}
            >
              <FaEdit /> Edit
            </button>
          ) : null}
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

        {/* Comment section */}
        <div className={styles.commentsSection}>
          <h2 className={styles.pageTitle}>Comments ({countTotalComments(comments)})</h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onCommentSubmit();
            }}
            className={styles.commentForm}
          >
            <textarea
              className={styles.formTextarea}
              placeholder="Write your comment here..."
              value={mainCommentText}
              onChange={(e) => setMainCommentText(e.target.value)}
              rows={4}
            />
            <small className={styles.characterCount}>
              {mainCommentText.length}/1000 characters
            </small>
            <div className={styles.buttonGroup}>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={!mainCommentText.trim() || loading}
              >
                Post Comment
              </button>
            </div>
          </form>

          <div className={styles.commentsContainer}>
            {comments.length > 0 ? (
              renderComments(comments)
            ) : (
              <div className={styles.emptyState}>
                <p className={styles.emptyMessage}>No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumPage;