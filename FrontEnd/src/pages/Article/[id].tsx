import React, { useEffect, useState, KeyboardEvent, FormEvent } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import {
  getArticleById,
  getCommentsByArticleId,
  postComment,
} from "../../utils/service/article";
import { formatTimeAgo } from "../../utils/format/date";
import { useAuth } from "../../contexts/AuthContext";
import { useModal } from "../../contexts/ModalContext";
import styles from "./ArticleDetail.module.css";

interface Article {
  article_id: number;
  title: string;
  content: string;
  image_url?: string;
  author_name?: string;
  last_updated?: string;
}

interface Comment {
  comment_id: number;
  article_id: number;
  parent_id?: number;
  author_id?: number;
  author_name?: string;
  comment_content: string;
  created_at: string;
  replies?: Comment[];
}

const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { openModal } = useModal();

  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState<{ [key: number]: string }>(
    {}
  );
  const [hoveredComment, setHoveredComment] = useState<number | null>(null);

  // Fetch article + comments
  useEffect(() => {
    (async () => {
      try {
        const artRes = await getArticleById(Number(id));
        setArticle(artRes.data);

        const comRes = await getCommentsByArticleId(Number(id));
        // backend trả về nested `replies`
        setComments(comRes.data);
      } catch (err) {
        console.error("Fetch failed:", err);
      }
    })();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  // Post comment or reply
  const submitComment = async (parentId?: number) => {
    if (!user) {
      openModal("login");
      return;
    }
    const content = parentId ? replyContent[parentId] : newComment;
    if (!content.trim() || !article) return;

    try {
      await postComment(
        article.article_id,
        user.user_id,
        content.trim(),
        parentId ?? null
      );
      // reload
      const updated = await getCommentsByArticleId(article.article_id);
      setComments(updated.data);
      if (parentId) {
        setReplyContent((p) => ({ ...p, [parentId]: "" }));
        setReplyTo(null);
      } else {
        setNewComment("");
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  };

  // Enter vs Shift+Enter
  const handleKeyDown = (
    e: KeyboardEvent<HTMLTextAreaElement>,
    parentId?: number
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitComment(parentId);
    }
  };

  // Render recursively
  const renderComments = (list: Comment[], level = 0) =>
    list.map((c) => (
      <li
        key={c.comment_id}
        className={styles.commentItem}
        style={{ marginLeft: level * 20 }}
        onMouseEnter={() => setHoveredComment(c.comment_id)}
        onMouseLeave={() => setHoveredComment(null)}
      >
        <div className={styles.commentHeader}>
          <strong>{c.author_name || "Anonymous"}</strong>
          <span className={styles.commentDate}>
            {new Date(c.created_at).toLocaleString()}
          </span>
        </div>
        <p className={styles.commentContent}>{c.comment_content}</p>

        {/* chỉ hiện khi đúng hover */}
        {hoveredComment === c.comment_id && (
          <button
            className={styles.replyButton}
            onClick={() => setReplyTo(c.comment_id)}
          >
            Phản hồi
          </button>
        )}

        {replyTo === c.comment_id && (
          <div className={styles.replyForm}>
            <textarea
              className={styles.textarea}
              placeholder="Viết phản hồi..."
              value={replyContent[c.comment_id] || ""}
              onChange={(e) =>
                setReplyContent((p) => ({
                  ...p,
                  [c.comment_id]: e.target.value,
                }))
              }
              onKeyDown={(e) => handleKeyDown(e, c.comment_id)}
            />
            <button
              className={styles.submitButton}
              onClick={() => submitComment(c.comment_id)}
              disabled={!replyContent[c.comment_id]?.trim()}
            >
              Gửi
            </button>
          </div>
        )}

        {Array.isArray(c.replies) && c.replies.length > 0 && (
          <ul className={styles.commentList}>
            {renderComments(c.replies, level + 1)}
          </ul>
        )}
      </li>
    ));

  if (!article) {
    return <div className={styles.loading}>Đang tải bài viết…</div>;
  }

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        {article.image_url && (
          <img
            src={article.image_url}
            alt={article.title}
            className={styles.image}
          />
        )}

        <h1 className={styles.title}>{article.title}</h1>

        <div className={styles.meta}>
          <span className={styles.author}>{article.author_name}</span> •{" "}
          <span className={styles.date}>
            {formatTimeAgo(article.last_updated || "")}
          </span>
        </div>

        <div className={styles.content}>{article.content}</div>

        <section className={styles.commentsSection}>
          <h2>Bình luận ({comments.length})</h2>

          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              submitComment();
            }}
            className={styles.commentForm}
          >
            <textarea
              className={styles.textarea}
              placeholder="Viết bình luận..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e)}
            />
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!newComment.trim()}
            >
              Gửi
            </button>
          </form>

          <ul className={styles.commentList}>
            {comments.length > 0 ? (
              renderComments(comments)
            ) : (
              <li className={styles.noComments}>Chưa có bình luận nào.</li>
            )}
          </ul>
        </section>
      </div>
    </>
  );
};

export default ArticleDetail;
