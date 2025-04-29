// src/components/Forum/pages/ThreadPage.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import styles from "../styles/Forum.module.css";
import { ThreadResponse } from "../../../types/forum";
import { loadThreadById, loadPostsByThread } from "../../../utils/service/Forum/thread";
import { getThreadById } from "../../../utils/api/Forum/thread";
import { getPostsByThread } from "../../../utils/api/Forum/thread";
import { PostResponse } from "../../../types/forum"; // Keep this import

const ThreadPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [thread, setThread] = useState<ThreadResponse | null>(null);
  const [posts, setPosts] = useState<any[]>([]); // Notice: any[] because backend doesn't return exactly PostResponse
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    loadThreadById(id, setLoading, setThread, setError).catch((err) => {
      console.error(err);
      setError(err.message || "Something went wrong");
    });
    loadPostsByThread(id, setLoading, setPosts, setError).catch((err) => {
      console.error(err);
      setError(err.message || "Something went wrong");
    });
  }, [id]);

  return (
    <div>
      <div className={styles.main_navbar}>
        <Navbar />
      </div>
      <div className={styles.container}>
        {loading ? (
          <p>Loading thread...</p>
        ) : error ? (
          <div className={styles.alert}>{error}</div>
        ) : thread ? (
          <div className={styles.card}>
            <h1>{thread.thread_name}</h1>
            <p>{thread.description}</p>

            <h2>Posts</h2>
            {posts.length > 0 ? (
              <ul className={styles.listGroup}>
                {posts.map((post) => (
                  <li key={post.post_id} className={styles.listGroupItem}>
                    <p>{post.content}</p>
                    {post.image_url && (
                      <img src={post.image_url} alt="Post" style={{ maxWidth: "100%", height: "auto" }} />
                    )}
                    <small>By user {post.user.username}</small><br />
                    <small>Posted at {new Date(post.created_at).toLocaleString()}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No posts yet in this thread.</p>
            )}
          </div>
        ) : (
          <p>Thread not found.</p>
        )}
      </div>
    </div>
  );
};

export default ThreadPage;