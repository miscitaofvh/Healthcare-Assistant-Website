import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import styles from "../styles/Forum.module.css";
import { Post } from "../../../types/forum";
import { PostComment } from "../../../types/forum";
import {
  fetchPost,
  fetchComments,
  deletePostFE,
  handleCommentSubmit,
} from "../../../utils/service/Forum/post";

const ForumPostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fetchPost(id, setLoading, setPost, setError);
      fetchComments(id, setLoading, setComments, setError);
    } else {
      setError("Invalid post ID.");
    }
  }, [id]);

  if (loading) return <div className={styles.text_center}>Đang tải...</div>;
  if (error) return <div className={styles.alert}>{error}</div>;
  if (!post) return <div className={styles.alert}>Không tìm thấy bài viết.</div>;

  const onCommentSubmit = async () => {
    if (!commentText.trim()) return;
    if (id) {
      await handleCommentSubmit(id, commentText, setCommentText, () =>
        fetchComments(id, setLoading, setComments, setError)
      );
    }
  };

  const onDeletePost = async () => {
    if (id) {
      await deletePostFE(id, setLoading, setError);
    }
  };

  return (
    <div>
      <Navbar />
      <div className={styles.container}>
        <h2 className={styles.text_center}>{post.title}</h2>
        <p className={styles.text_center}>
          Đăng bởi {post.author} vào {new Date(post.created_at).toLocaleDateString()}
        </p>
        <div className={styles.post_content}>{post.content}</div>

        <div className={styles.text_center}>
          <button className={styles.btnDelete} onClick={onDeletePost}>
            🗑 Xoá bài viết
          </button>
        </div>

        <hr />
        <h4>Bình luận</h4>
        {comments.length === 0 ? (
          <p>Chưa có bình luận nào.</p>
        ) : (
          <ul>
            {comments.map((comment) => (
              <li key={comment.comment_id}>
                <strong>{comment.username}</strong> ({new Date(comment.created_at).toLocaleDateString()}):<br />
                {comment.content}
              </li>
            ))}
          </ul>
        )}

        <div className={styles.commentBox}>
          <textarea
            className={styles.textarea}
            placeholder="Nhập bình luận..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <button className={styles.btn} onClick={onCommentSubmit}>
            Gửi bình luận
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForumPostDetail;