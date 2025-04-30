import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum1.module.css";
import { createPost } from "../../../../utils/api/Forum/main";

interface PostData {
  category_name: string;
  thread_name: string;
  content: string;
  image_url?: string | null;
  tag_name: string[]; // NEW: tag_name as an array of strings
}

const CreatePost: React.FC = () => {
  const [new_forum_post, setNewForumPost] = useState<PostData>({
    category_name: "",
    thread_name: "",
    content: "",
    image_url: null,
    tag_name: [], // Initialize tag_name as an empty array
  });
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await createPost(new_forum_post);
      alert(response.data.message);
      navigate("/forum");
    } catch (err) {
      console.error("Lỗi khi tạo bài viết:", err);
      setError("Không thể tạo bài viết. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const input = e.currentTarget.value.trim();
      if (input && !new_forum_post.tag_name.includes(input)) {
        setNewForumPost((prev) => ({
          ...prev,
          tag_name: [...prev.tag_name, input],
        }));
      }
      e.currentTarget.value = "";
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewForumPost((prev) => ({
      ...prev,
      tag_name: prev.tag_name.filter((tag) => tag !== tagToRemove),
    }));
  };

  return (
    <div className={styles.pageWrapper}>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.title}>📝 Tạo Bài Viết Mới</h2>

          {error && <div className={styles.alert}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="categoryName">Chuyên mục</label>
              <input
                type="text"
                id="categoryName"
                value={new_forum_post.category_name}
                onChange={(e) =>
                  setNewForumPost((prev) => ({
                    ...prev,
                    category_name: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="threadName">Tiêu đề</label>
              <input
                type="text"
                id="threadName"
                value={new_forum_post.thread_name}
                onChange={(e) =>
                  setNewForumPost((prev) => ({
                    ...prev,
                    thread_name: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="content">Nội dung</label>
              <textarea
                id="content"
                value={new_forum_post.content}
                onChange={(e) =>
                  setNewForumPost((prev) => ({
                    ...prev,
                    content: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="imageUrl">Image URL (optional)</label>
              <input
                type="text"
                id="imageUrl"
                value={new_forum_post.image_url || ""}
                placeholder="https://example.com/image.jpg"
                onChange={(e) =>
                  setNewForumPost((prev) => ({
                    ...prev,
                    image_url: e.target.value,
                  }))
                }
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="tags">Tags (nhấn Enter để thêm)</label>
              <input
                type="text"
                id="tags"
                placeholder="Thêm tag"
                onKeyDown={handleAddTag}
              />
              <div className={styles.tagList}>
                {new_forum_post.tag_name.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className={styles.removeTagBtn}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? "Đang tạo..." : "Tạo Bài Viết"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
