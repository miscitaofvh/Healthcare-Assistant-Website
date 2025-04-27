import React, { useEffect, useState, FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {getArticleById, getCommentsByArticleId, postComment} from "../../utils/service/article";
import Navbar from "../../components/Navbar";
import styles from "./ArticleDetail.module.css";

interface Article {
  article_id: number;
  title: string;
  content: string;
  image_url?: string;
  author_id?: number;
  author_name?: string;
  publication_date?: string;
}

interface Comment {
  comment_id: number;
  article_id: number;
  author_id?: number;
  author_name?: string;
  comment_content: string;
  created_at: string;
}

const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const artRes = await getArticleById(Number(id));
        setArticle(artRes.data);

        const comRes = await getCommentsByArticleId(Number(id));
        setComments(comRes.data);
      } catch (error) {
        console.error("Fetch failed:", error);
      }
    };

    fetchData();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await postComment(Number(id), newComment.trim());
      // Thêm comment mới vào đầu danh sách:
      setComments(prev => [res.data, ...prev]);
      setNewComment("");
    } catch (error) {
      console.error("Failed to post comment:", error);
    }
  };

  if (!article) {
    return <div className={styles.loading}>Loading article...</div>;
  }

  return (
    <div>
      <Navbar />
      <div className={styles.container}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          ← Back
        </button>

        {article.image_url && (
          <img
            src={article.image_url}
            alt={article.title}
            className={styles.image}
          />
        )}

        <h1 className={styles.title}>{article.title}</h1>

        <div className={styles.meta}>
          <span className={styles.author}>
            {article.author_name || "Unknown Author"}
          </span>{" "}
          •{" "}
          <span className={styles.date}>
            {article.publication_date || "Unknown Date"}
          </span>
        </div>

        <div className={styles.content}>{article.content}</div>

        {/* ========= Comments Section ========= */}
        <div className={styles.commentsSection}>
          <h2>Comments ({comments.length})</h2>

          <form onSubmit={handleSubmit} className={styles.commentForm}>
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className={styles.textarea}
            />
            <button type="submit" className={styles.submitButton}>
              Post Comment
            </button>
          </form>

          <ul className={styles.commentList}>
            {comments.map(c => (
              <li key={c.comment_id} className={styles.commentItem}>
                <div className={styles.commentHeader}>
                  <strong>{c.author_name || "Anonymous"}</strong>{" "}
                  <span className={styles.commentDate}>
                    {new Date(c.created_at).toLocaleString()}
                  </span>
                </div>
                <p className={styles.commentContent}>{c.comment_content}</p>
              </li>
            ))}
            {comments.length === 0 && (
              <li className={styles.noComments}>No comments yet.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;
