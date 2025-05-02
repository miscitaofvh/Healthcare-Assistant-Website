import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { createPost } from "../../../../utils/api/Forum/main";
import { loadCategoriesSummary } from "../../../../utils/service/Forum/category";
import { loadThreadsByCategory } from "../../../../utils/service/Forum/thread";
import { loadTagsSummary } from "../../../../utils/service/Forum/tag";
import {
  CategorySummary,
  ThreadDropdown,
  PostNew,
  TagSummary
} from "../../../../types/forum";

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
  const [tags, setTags] = useState<TagSummary[]>([]);
  const [availableTags, setAvailableTags] = useState<TagSummary[]>([]);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [tagsLoading, setTagsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCategoriesSummary(setLoading, setCategories, setError, () => { });
    loadTagsSummary(setTagsLoading, setTags, setError, () => { });
  }, []);

  useEffect(() => {
    if (categoryId > 0) {
      loadThreadsByCategory(categoryId, setThreads, setError);
    } else {
      setThreads([]);
    }
  }, [categoryId]);

  useEffect(() => {
    // Filter out already selected tags
    const filtered = tags.filter(tag => !post.tag_name.includes(tag.tag_name));
    setAvailableTags(filtered);
  }, [tags, post.tag_name]);

  const handleAddTag = (tagName: string) => {
    if (tagName && !post.tag_name.includes(tagName)) {
      setPost(prev => ({
        ...prev,
        tag_name: [...prev.tag_name, tagName]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setPost(prev => ({
      ...prev,
      tag_name: prev.tag_name.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await createPost(post);
      setSuccess(response.data.message || "Post created successfully!");
      setTimeout(() => navigate("/forum"), 2000);
    } catch (err) {
      console.error("Error creating post:", err);
      setError("Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.forumContainer}>
      <div className={styles.main_navbar}>
        <Navbar />
      </div>

      <div className={styles.tagListContainer}>
        <div className={styles.headerSection}>
          <h1 className={styles.pageTitle}>Create New Post</h1>
          <p className={styles.pageSubtitle}>Share your thoughts with the community</p>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <span className={styles.errorIcon}>⚠️</span> {error}
          </div>
        )}

        {success && (
          <div className={styles.alertSuccess}>
            <span className={styles.successIcon}>✅</span> {success}
          </div>
        )}

        <div className={styles.tagCard}>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="category" className={styles.metaLabel}>
                Category *
              </label>
              <select
                id="category"
                className={styles.formInput}
                value={categoryId}
                onChange={(e) => {
                  const selected = parseInt(e.target.value);
                  setCategoryId(selected);
                  setPost({ ...post, thread_id: 0 }); // Reset thread when category changes
                }}
                required
                disabled={loading}
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
              <label htmlFor="thread" className={styles.metaLabel}>
                Thread *
              </label>
              <select
                id="thread"
                className={styles.formInput}
                value={post.thread_id}
                onChange={(e) =>
                  setPost({ ...post, thread_id: parseInt(e.target.value) })
                }
                required
                disabled={!categoryId || loading}
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
              <label htmlFor="content" className={styles.metaLabel}>
                Content *
              </label>
              <textarea
                id="content"
                className={styles.formTextarea}
                value={post.content}
                onChange={(e) => setPost({ ...post, content: e.target.value })}
                required
                rows={8}
                maxLength={5000}
                disabled={loading}
              />
              <small className={styles.characterCount}>
                {post.content.length}/5000 characters
              </small>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="imageUrl" className={styles.metaLabel}>
                Image URL (optional)
              </label>
              <input
                id="imageUrl"
                type="text"
                className={styles.formInput}
                value={post.image_url || ""}
                onChange={(e) =>
                  setPost({ ...post, image_url: e.target.value })
                }
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="tags" className={styles.metaLabel}>
                Tags
              </label>
              <select
                id="tags"
                className={styles.formInput}
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddTag(e.target.value);
                    e.target.value = ""; // Reset selection
                  }
                }}
                disabled={loading || tagsLoading}
              >
                <option value="">Select tag to add</option>
                {availableTags.map((tag) => (
                  <option key={tag.tag_id} value={tag.tag_name}>
                    #{tag.tag_name}
                  </option>
                ))}
              </select>

              <div className={styles.tagContainer}>
                {post.tag_name.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    #{tag}
                    <button
                      type="button"
                      className={styles.tagRemove}
                      onClick={() => removeTag(tag)}
                      disabled={loading}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={loading || !post.thread_id || !post.content}
              >
                {loading ? (
                  <>
                    <span className={styles.spinnerSmall}></span>
                    Creating...
                  </>
                ) : (
                  "Create Post"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;