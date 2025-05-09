import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { PostListResponse } from "../../../../types/forum";
import { loadPosts } from "../../../../utils/service/Forum/post";
import { formatDate, stripMarkdown } from "../../../../utils/helpers/dateFormatter";

const PostList: React.FC = () => {
  const [posts, setPosts] = useState<PostListResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    try {
      loadPosts(setLoading, setPosts, setError, setSuccess);
    } catch (err: any) {
      setError(err || "Failed to load posts.");
    }
  }, []);

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

  const handlePostClick = (postId: number) => {
    navigate(`/forum/posts/${postId}`);
  };

  const handleCreateClick = () => {
    navigate(`/forum/posts/create`);
  };

  return (
    <div className={styles.forumContainer}>
      <div className={styles.main_navbar}>
        <Navbar />
      </div>

      <div className={styles.headerContainer}>
        <div className={styles.headerSection}>
          <h1 className={styles.pageTitle}>Forum Posts</h1>
          <p className={styles.pageSubtitle}>Browse all recent discussions</p>

          <button
            className={`${styles.primaryButton} ${styles.createButton}`}
            onClick={handleCreateClick}
          >
            + Create New Post
          </button>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <span className={styles.errorIcon}>⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className={styles.alertSuccess}>
            <span className={styles.successIcon}>✅</span>
            {success}
          </div>
        )}

        <div className={styles.contentCard}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading posts...</p>
            </div>
          ) : posts.length > 0 ? (
            <div className={styles.postsContainer}>
              {posts.map((post) => (
                <div
                  key={post.post_id}
                  className={styles.postCard}
                  onClick={() => handlePostClick(post.post_id)}
                >
                  <div className={styles.postHeader}>
                    <div>
                      <h3 className={styles.tagName}>{post.title}</h3>
                      <span className={styles.postAuthor}>By {post.author}</span>
                    </div>
                    <div className={styles.metaValue}>
                      {formatDate(post.created_at)}
                    </div>
                  </div>

                  <div className={styles.tagDescription}>
                    {stripMarkdown(post.content).length > 200
                      ? `${stripMarkdown(post.content).substring(0, 200)}...`
                      : stripMarkdown(post.content)}
                  </div>


                  <div className={styles.tagMeta}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Category:</span>
                      <span className={styles.metaValue}>{post.category_name}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Thread:</span>
                      <span className={styles.metaValue}>{post.thread_name}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Likes:</span>
                      <span className={styles.metaValue}>{post.like_count}</span>
                    </div>
                    {post.tags.length > 0 && (
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Tags:</span>
                        <span className={styles.metaValue}>
                          {post.tags.map(tag => tag.tag_name).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyMessage}>No posts available yet.</p>
              <button
                className={styles.primaryButton}
                onClick={handleCreateClick}
              >
                Create First Post
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostList;