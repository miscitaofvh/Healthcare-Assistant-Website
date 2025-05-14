import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReactMarkdown from "react-markdown";
import { formatDate } from "../../../../utils/helpers/dateFormatter";
import {
  FaEdit,
  FaUser,
  FaCalendar,
  FaFolder,
  FaComments,
  FaHeart,
  FaReply,
  FaTrash,
  FaFlag,
  FaRegHeart,
} from "react-icons/fa";
import { GrUpdate } from "react-icons/gr";
import { AiFillDelete } from "react-icons/ai";
import { FiMoreVertical } from "react-icons/fi";
import { MdReportProblem } from "react-icons/md";

import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { Post } from "../../../../types/Forum/post";
import { CommentPost } from "../../../../types/Forum/comment";
import requestPost from "../../../../utils/service/Forum/post";
import requestComment from "../../../../utils/service/Forum/comment";
import requestLike from "../../../../utils/service/Forum/like";
import requestReport from "../../../../utils/service/Forum/repost";
import ConfirmationModal from "../../../../components/ConfirmationModal";

// Transform flat comments into a tree structure
const buildCommentTree = (comments: CommentPost[]): CommentPost[] => {
  const commentMap: { [key: number]: CommentPost } = {};
  const tree: CommentPost[] = [];

  // Initialize comment map and add replies array
  comments.forEach((comment) => {
    commentMap[comment.comment_id] = { ...comment, replies: [] };
  });

  // Build tree by assigning replies to their parent
  comments.forEach((comment) => {
    if (comment.parent_comment_id) {
      const parent = commentMap[comment.parent_comment_id];
      if (parent) {
        parent.replies!.push(commentMap[comment.comment_id]);
      }
    } else {
      tree.push(commentMap[comment.comment_id]);
    }
  });

  // Sort replies by created_at
  tree.forEach((comment) => {
    if (comment.replies) {
      comment.replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
  });

  return tree;
};

const ForumPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<CommentPost[]>([]);
  const [mainCommentText, setMainCommentText] = useState("");
  const [replyCommentTexts, setReplyCommentTexts] = useState<Record<number, string>>({});
  const [replyingTo, setReplyingTo] = useState<{ commentId: number; username: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isPostLiking, setIsPostLiking] = useState<boolean>(false);
  const [isCommentLiking, setIsCommentLiking] = useState<Record<number, boolean>>({});
  const [reportingComment, setReportingComment] = useState<number | null>(null);
  const [showReportPopup, setShowReportPopup] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");

  const loadInitialData = useCallback(async () => {
    if (!id) {
      toast.error("Invalid post ID.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      await requestPost.loadPostPageById(
        id,
        setLoading,
        setPost,
        (rawComments: CommentPost[]) => {
          const commentTree = buildCommentTree(rawComments);
          setComments(commentTree);
        },
        (errorMessage) => toast.error(errorMessage),
        (successMessage) => toast.success(successMessage)
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to load post details.");
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const onCommentSubmit = async (parentId?: number) => {
    const text = parentId
      ? replyCommentTexts[parentId]?.trim()
      : mainCommentText.trim();

    if (!text || !post) return;

    try {
      const parentDepth = parentId
        ? comments.find((c) => c.comment_id === parentId)?.depth || 0
        : 0;

      await requestComment.addCommenttoPost(
        id || "",
        text,
        parentId?.toString(),
        parentId ? parentDepth + 1 : 0,
        () => {
          if (parentId) {
            const newReplyTexts = { ...replyCommentTexts };
            delete newReplyTexts[parentId];
            setReplyCommentTexts(newReplyTexts);
          } else {
            setMainCommentText("");
          }
        },
        (errorMessage) => toast.error(errorMessage),
        async () => {
          setReplyingTo(null);
          await loadInitialData();
        }
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to submit comment");
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!editCommentContent.trim()) {
      toast.error("Comment content cannot be empty");
      return;
    }

    try {
      await requestComment.updateComment(
        commentId.toString(),
        editCommentContent,
        setLoading,
        (errorMessage) => toast.error(errorMessage),
        () => {
          setEditingComment(null);
          setEditCommentContent("");
          loadInitialData();
        }
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update comment");
    }
  };

  const handleReportComment = async (commentId: number) => {
    if (!reportReason.trim()) {
      toast.error("Please provide a reason for reporting");
      return;
    }

    try {
      await requestReport.reportCommentFE(
        commentId.toString(),
        reportReason,
        (errorMessage) => toast.error(errorMessage),
        (successMessage) => toast.success(successMessage),
        () => {
          setReportReason("");
          setReportingComment(null);
        }
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to report comment");
    }
  };

  const handlePostLike = async () => {
    if (!post) {
      toast.error("Post not found.");
      return;
    }

    try {
      setIsPostLiking(true);
      if (post.is_liked) {
        await requestLike.unlikePostFE(
          post.post_id.toString(),
          (errorMessage) => toast.error(errorMessage),
          () => loadInitialData()
        );
      } else {
        await requestLike.likePostFE(
          post.post_id.toString(),
          (errorMessage) => toast.error(errorMessage),
          () => loadInitialData()
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to like post");
    } finally {
      setIsPostLiking(false);
    }
  };

  const handleCommentLike = async (comment: CommentPost) => {
    try {
      setIsCommentLiking((prev) => ({ ...prev, [comment.comment_id]: true }));

      if (comment.is_liked) {
        await requestLike.unlikeCommentFE(
          comment.comment_id.toString(),
          post?.post_id.toString() || "",
          (errorMessage) => toast.error(errorMessage),
          () => loadInitialData()
        );
      } else {
        await requestLike.likeCommentFE(
          comment.comment_id.toString(),
          (errorMessage) => toast.error(errorMessage),
          () => loadInitialData()
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to like comment");
    } finally {
      setIsCommentLiking((prev) => ({ ...prev, [comment.comment_id]: false }));
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;
    setIsDeleting(true);
    try {
      await requestPost.deletePostFE(
        post.post_id.toString(),
        setLoading,
        (errorMessage) => toast.error(errorMessage),
        (successMessage) => toast.success(successMessage),
        () => navigate("/forum")
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to delete post");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;
    setIsDeleting(true);
    try {
      await requestComment.deleteCommentFromPost(
        commentToDelete.toString(),
        setLoading,
        (errorMessage) => toast.error(errorMessage),
        () => {
          loadInitialData();
          setCommentToDelete(null);
        }
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to delete comment");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleReportSubmit = async () => {
    if (!post) return;
    if (!reportReason.trim()) {
      toast.error("Reason is required.");
      return;
    }

    setReportSubmitting(true);
    try {
      await requestReport.reportPostFE(
        post.post_id.toString(),
        reportReason,
        (errorMessage) => toast.error(errorMessage),
        (successMessage) => toast.success(successMessage),
        () => {
          setShowReportPopup(false);
          setReportReason("");
        }
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to report post");
    } finally {
      setReportSubmitting(false);
    }
  };

  const renderComments = (comments: CommentPost[]) => {
    return comments.map((comment) => (
      <div
        key={comment.comment_id}
        className={`${styles.commentCard} ${comment.parent_comment_id ? styles.replyComment : ""}`}
        style={{ marginLeft: `${(comment.depth || 0) * 20}px` }}
      >
        <div className={styles.commentHeader}>
          <span className={styles.commentAuthor}>{comment.commented_by}</span>
          <span className={styles.commentDate}>
            {formatDate(comment.created_at)}
            {comment.created_at !== comment.last_updated && (
              <span
                className={styles.updatedBadge}
                title={`Last updated ${formatDate(comment.last_updated)}`}
              >
                (edited)
              </span>
            )}
          </span>
        </div>

        <div className={styles.commentContent}>
          {editingComment === comment.comment_id ? (
            <div className={styles.editForm}>
              <textarea
                className={styles.formTextarea}
                value={editCommentContent}
                onChange={(e) => setEditCommentContent(e.target.value)}
                rows={3}
              />
              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setEditingComment(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => handleEditComment(comment.comment_id)}
                  disabled={!editCommentContent.trim()}
                >
                  Update Comment
                </button>
              </div>
            </div>
          ) : (
            <p>{comment.content}</p>
          )}
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
              {comment.like_count && comment.like_count > 0 ? comment.like_count : ""}
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
                  : { commentId: comment.comment_id, username: comment.commented_by }
              )
            }
          >
            <FaReply /> Reply
          </button>

          <button
            className={styles.actionButton}
            onClick={() => {
              setReportingComment(comment.comment_id);
              setReportReason("");
            }}
          >
            <FaFlag /> Report
          </button>

          {comment.is_owner ? (
            <>
              <button
                className={`${styles.actionButton} ${styles.updateButton}`}
                onClick={() => {
                  setEditingComment(comment.comment_id);
                  setEditCommentContent(comment.content);
                }}
              >
                <GrUpdate /> Update
              </button>
              <button
                className={`${styles.actionButton} ${styles.deleteButton}`}
                onClick={() => {
                  setCommentToDelete(comment.comment_id);
                  setShowDeleteModal(true);
                }}
              >
                <FaTrash /> Delete
              </button>
            </>
          ) : null}
        </div>

        {replyingTo?.commentId === comment.comment_id && (
          <div className={styles.replyForm}>
            <textarea
              className={styles.formTextarea}
              placeholder={`Reply to @${comment.commented_by}...`}
              value={replyCommentTexts[comment.comment_id] || ""}
              onChange={(e) =>
                setReplyCommentTexts({
                  ...replyCommentTexts,
                  [comment.comment_id]: e.target.value,
                })
              }
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

  if (!post && loading) {
    return (
      <div className={styles.forumContainer}>
        <ToastContainer />
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

  if (!post) {
    return (
      <div className={styles.forumContainer}>
        <ToastContainer />
        <div className={styles.main_navbar}>
          <Navbar />
        </div>
        <div className={styles.emptyState}>
          <p className={styles.emptyMessage}>Post not found.</p>
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
      <ToastContainer />
      <div className={styles.main_navbar}>
        <Navbar />
      </div>

      <div className={styles.headerContainer}>
        {/* Breadcrumbs */}
        <div className={styles.breadcrumbs}>
          <span onClick={() => navigate("/forum")} className={styles.breadcrumbLink}>
            Forum
          </span>
          <span className={styles.breadcrumbSeparator}> &gt; </span>
          <span
            onClick={() => navigate(`/forum/categories/${post.category_id}`)}
            className={styles.breadcrumbLink}
          >
            {post.category_name}
          </span>
          <span className={styles.breadcrumbSeparator}> &gt; </span>
          <span
            onClick={() => navigate(`/forum/threads/${post.thread_id}`)}
            className={styles.breadcrumbLink}
          >
            {post.thread_name}
          </span>
        </div>

        {/* Post section */}
        <div className={styles.postHeader}>
          <div className={styles.postMeta}>
            <div className={styles.metaGroup}>
              <span className={styles.metaItem}>
                <FaUser className={styles.metaIcon} />
                {post.created_by}
              </span>
              <span className={styles.metaItem}>
                <FaCalendar className={styles.metaIcon} />
                {formatDate(post.created_at)}
                {post.created_at !== post.last_updated && (
                  <span
                    className={styles.updatedBadge}
                    title={`Last updated ${formatDate(post.last_updated)}`}
                  >
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
              className={`${styles.likeButton} ${post.is_liked ? styles.unlike : ""}`}
              onClick={handlePostLike}
              disabled={isPostLiking}
            >
              <FaHeart className={post.is_liked ? styles.heartIcon : ""} />
              <span className={styles.likeCount}>{post.like_count}</span>
              {isPostLiking && (
                <span className={styles.spinner} aria-hidden="true" />
              )}
            </button>

            <div className={styles.tagContainer}>
              {post.tags.map((tag) => (
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
            <div className={styles.dropdown}>
              <button className={styles.dropdownToggle}>
                <FiMoreVertical />
              </button>
              <div className={styles.dropdownMenu}>
                <button
                  className={styles.dropdownItem}
                  onClick={() => navigate(`/forum/posts/${post.post_id}/update`)}
                >
                  <FaEdit className={styles.dropdownIcon} /> Edit Post
                </button>
                <button
                  className={`${styles.dropdownItem} ${styles.deleteItem}`}
                  onClick={() => setShowDeleteModal(true)}
                >
                  <AiFillDelete className={styles.dropdownIcon} /> Delete Post
                </button>
                <button
                  className={styles.reportButton}
                  onClick={() => setShowReportPopup(true)}
                >
                  <MdReportProblem className={styles.reportIcon} /> Report
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className={styles.postContent}>
          <ReactMarkdown>
            {post.content || "*No content to display*"}
          </ReactMarkdown>
        </div>

        {/* Comment section */}
        <div className={styles.commentsSection}>
          <h2 className={styles.pageTitle}>
            Comments ({requestComment.countTotalComments(comments)})
          </h2>

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
                <p className={styles.emptyMessage}>
                  No comments yet. Be the first to comment!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Popup */}
      {showReportPopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popup}>
            <h3>Report Post</h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Enter reason for reporting"
              className={styles.textarea}
            />
            <div className={styles.popupActions}>
              <button
                className={styles.primaryButton}
                onClick={handleReportSubmit}
                disabled={reportSubmitting}
              >
                {reportSubmitting ? "Submitting..." : "Submit Report"}
              </button>
              <button
                className={styles.cancelButton}
                onClick={() => setShowReportPopup(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title={commentToDelete ? "Delete Comment" : "Delete Post"}
        message={
          commentToDelete
            ? "Are you sure you want to delete this comment? This action cannot be undone."
            : "Are you sure you want to delete this post? All comments will be permanently removed. This action cannot be undone."
        }
        onConfirm={commentToDelete ? handleDeleteComment : handleDeletePost}
        onCancel={() => {
          setShowDeleteModal(false);
          setCommentToDelete(null);
        }}
        confirmText={commentToDelete ? "Delete Comment" : "Delete Post"}
        cancelText="Cancel"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ForumPage;