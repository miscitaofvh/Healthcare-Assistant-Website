import React, { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar";
import styles from "../styles/Forum.module.css";
import { PostSummary } from "../../../types/forum";
import { loadPosts } from "../../../utils/service/Forum/post";

const PostList: React.FC = () => {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    loadPosts(setLoading, setPosts, setError);
  }, []);

  return (
    <div>
      <div className={styles.main_navbar}>
        <Navbar />
      </div>
      <div className={styles.container}>
        {loading ? (
          <p>Loading posts...</p>
        ) : error ? (
          <div className={styles.alert}>{error}</div>
        ) : posts.length > 0 ? (
          <div className={styles.grid}>
            {posts.map((post) => (
              <div key={post.post_id} className={styles.card}>
                <h3>{post.title}</h3>
                <p>{post.content}</p>
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt="Post"
                    style={{ maxWidth: "100%", height: "auto", marginTop: "10px" }}
                  />
                )}
                <div style={{ marginTop: "10px" }}>
                  <small>By {post.author}</small>
                  <br />
                  <small>Posted at {new Date(post.created_at).toLocaleString()}</small>
                  <br />
                  <small>Last updated at {new Date(post.last_updated).toLocaleString()}</small>
                  <div style={{ marginTop: "5px" }}>
                    <small>Likes: {post.like_count}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No posts available.</p>
        )}
      </div>
    </div>
  );
};

export default PostList;