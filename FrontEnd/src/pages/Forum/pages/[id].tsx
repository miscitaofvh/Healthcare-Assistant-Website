import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../../../components/Navbar";
import styles from "../styles/Forum.module.css";

const API_BASE_URL = "http://localhost:5000/api/forum";

interface Post {
  id: number;
  title: string;
  content: string;
  created_at: string;
  author: string;
}

interface Comment {
  id: number;
  content: string;
  author: string;
  created_at: string;
}

const ForumPostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fetchPost();
      fetchComments();
    }
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/posts/${id}`);
      setPost(response.data);
    } catch (error) {
      console.error("Error loading post:", error);
      setError("Không thể tải bài viết.");
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/posts/${id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error("Error loading comments:", error);
      setError("Không thể tải bình luận.");
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async () => {
    if (!id) return;
    try {
      await axios.delete(`${API_BASE_URL}/posts/${id}`);
      alert("Bài viết đã được xoá.");
      window.location.href = "/forum";
    } catch (error) {
      console.error("Lỗi khi xoá bài viết:", error);
      alert("Không thể xoá bài viết.");
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;
    try {
      await axios.post(`${API_BASE_URL}/posts/${id}/comments`, {
        content: commentText,
        user_id: 1, // Replace with actual user ID
      });
      setCommentText("");
      fetchComments();
    } catch (error) {
      console.error("Lỗi khi đăng bình luận:", error);
      alert("Không thể đăng bình luận.");
    }
  };

  if (loading) return <div className={styles.text_center}>Đang tải...</div>;
  if (error) return <div className={styles.alert}>{error}</div>;
  if (!post) return <div className={styles.alert}>Không tìm thấy bài viết.</div>;

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
          <button className={styles.btnDelete} onClick={deletePost}>🗑 Xoá bài viết</button>
        </div>

        <hr />
        <h4>Bình luận</h4>
        {comments.length === 0 ? (
          <p>Chưa có bình luận nào.</p>
        ) : (
          <ul>
            {comments.map((comment) => (
              <li key={comment.id}>
                <strong>{comment.author}</strong> ({new Date(comment.created_at).toLocaleDateString()}):<br />
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
          <button className={styles.btn} onClick={handleCommentSubmit}>Gửi bình luận</button>
        </div>
      </div>
    </div>
  );
};

export default ForumPostDetail;
