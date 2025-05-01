import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum1.module.css";
import { createPost } from "../../../../utils/api/Forum/main";
import { loadCategoriesSummary } from "../../../../utils/service/Forum/category";
import { loadThreadsByCategory } from "../../../../utils/service/Forum/thread";
import { CategorySummary, ThreadDropdown, PostNew } from "../../../../types/forum";

const CreatePost: React.FC = () => {
  const [categoryId, setCategoryId] = useState<number>(0);
  const [post, setPost] = useState<PostNew>({
    thread_id: 0,
    content: "",
    image_url: null,
    tag_name: [],
  });
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [threads, setThreads] = useState<ThreadDropdown[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCategoriesSummary(() => {}, setCategories, setError, () => {});
  }, []);

  useEffect(() => {
    if (categoryId > 0) {
      loadThreadsByCategory(categoryId, setThreads, setError);
    } else {
      setThreads([]);
    }
  }, [categoryId]);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const input = e.currentTarget.value.trim();
      if (input && !post.tag_name.includes(input)) {
        setPost((prev) => ({ ...prev, tag_name: [...prev.tag_name, input] }));
      }
      e.currentTarget.value = "";
    }
  };

  const removeTag = (tagToRemove: string) => {
    setPost((prev) => ({
      ...prev,
      tag_name: prev.tag_name.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await createPost(post);
      alert(response.data.message);
      navigate("/forum");
    } catch (err) {
      console.error("Error creating post:", err);
      setError("Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.title}>📝 Create New Post</h2>
          {error && <div className={styles.alert}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Category</label>
              <select
                value={categoryId}
                onChange={(e) => {
                  const selected = parseInt(e.target.value);
                  setCategoryId(selected);
                  setPost({ ...post, thread_id: 0 });
                }}
                required
              >
                <option value={0}>Select category</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Thread</label>
              <select
                value={post.thread_id}
                onChange={(e) =>
                  setPost({ ...post, thread_id: parseInt(e.target.value) })
                }
                required
                disabled={!categoryId}
              >
                <option value={0}>Select thread</option>
                {threads.map((th) => (
                  <option key={th.thread_id} value={th.thread_id}>
                    {th.thread_name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Content</label>
              <textarea
                value={post.content}
                onChange={(e) =>
                  setPost({ ...post, content: e.target.value })
                }
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Image URL (optional)</label>
              <input
                type="text"
                value={post.image_url || ""}
                onChange={(e) =>
                  setPost({ ...post, image_url: e.target.value })
                }
              />
            </div>

            <div className={styles.formGroup}>
              <label>Tags (press Enter to add)</label>
              <input type="text" onKeyDown={handleAddTag} />
              <div className={styles.tagList}>
                {post.tag_name.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}>
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? "Creating..." : "Create Post"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;