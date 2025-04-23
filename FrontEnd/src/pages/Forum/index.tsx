import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import styles from "./Forum.module.css";
import { useNavigate } from "react-router-dom";
import { getPosts, getTagByForumPost } from "../../utils/service/forum";

interface Post {
  post_id: number;
  thread_id: number;
  thread_name: string;
  user_id: string;
  username: string;
  title: string;
  content: string;
  created_at: string;
  last_updated: string;
  image_url: string | null;
  tag_name: string[];
}

interface Tag {
  tag_id: number;
  tag_name: string;
  description: string | null;
  created_at: string;
  last_updated: string;
}

const Forum: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getPosts();

      const forumPostsWithTags = await Promise.all(
        response.data.map(async (forumPost: Post) => {
          try {
            const tagRes = await getTagByForumPost(forumPost.post_id.toString());
            return {
              ...forumPost,
              tag_name: tagRes.data.map((tag: Tag) => tag.tag_name),
            };
          } catch {
            return { ...forumPost, tag_name: [] }; // fallback if error
          }
        })
      );
      setPosts(forumPostsWithTags);
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

        <div className={styles.text_center}>
          <button className={styles.btn} onClick={() => navigate("/forum/create")}>
            Tạo bài viết mới
          </button>
        </div>

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
                <div
                  key={post.post_id}
                  className={styles.list_group_item}
                  onClick={() => navigate(`/forum/${post.post_id}`)}
                >
                  <h5 className={styles.mb_1}>{post.title}</h5>
                  <p className={styles.mb_1}>{post.content.substring(0, 150)}...</p>

                  {post.tag_name.length > 0 && (
                    <div className={styles.tags}>
                      {post.tag_name.map((tag, index) => (
                        <span key={index} className={styles.tag}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <small>
                    Đăng bởi {post.username} vào{" "}
                    {new Date(post.created_at).toLocaleDateString()}
                  </small>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Forum;
