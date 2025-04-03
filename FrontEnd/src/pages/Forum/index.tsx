import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../../components/Navbar";
import styles from "./Forum.module.css";

const API_BASE_URL = "http://localhost:5000/api/forum"; // Adjust based on your backend route

interface Post {
  id: number;
  title: string;
  content: string;
  created_at: string;
  author: string;
}

const Forum: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get<Post[]>(`${API_BASE_URL}/posts`);
      setPosts(response.data);
    } catch (error) {
      setError("Không thể tải bài viết. Vui lòng thử lại sau.");
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className={styles.main_navbar}>
        <Navbar />
      </div>
      <div className={styles.container}>
        <h1 className={styles.text_center}>Forum Discussions</h1>

        {loading && (
          <div className={styles.text_center}>
            <div className={styles.spinner_border} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}

        {error && <div className={styles.alert}>{error}</div>}

        {!loading && !error && (
          <div className={styles.list_group}>
            {posts.length === 0 ? (
              <div className={styles.alert}>Chưa có bài viết nào.</div>
            ) : (
              posts.map((post) => (
                <a 
                  key={post.id} 
                  href={`/forum/${post.id}`} 
                  className={styles.list_group_item}
                >
                  <h5 className={styles.mb_1}>{post.title}</h5>
                  <p className={styles.mb_1}>{post.content.substring(0, 150)}...</p>
                  <small>Đăng bởi {post.author} vào {new Date(post.created_at).toLocaleDateString()}</small>
                </a>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Forum;
