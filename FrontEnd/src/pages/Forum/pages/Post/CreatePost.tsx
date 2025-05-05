import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { loadCategoriesSummary } from "../../../../utils/service/Forum/category";
import { loadThreadsByCategory } from "../../../../utils/service/Forum/thread";
import { loadTagsSummary } from "../../../../utils/service/Forum/tag";
import { createPostFE } from "../../../../utils/service/Forum/post";
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
    title: "",
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
    try {
      loadCategoriesSummary(setLoading, setCategories, setError, () => { });
      loadTagsSummary(setTagsLoading, setTags, setError, () => { });
    } catch (err) {
      setError("Failed to load categories or tags. Please try again.");
    }
  }, []);

  useEffect(() => {
    if (categoryId > 0) {
      loadThreadsByCategory(categoryId, setThreads, setError);
    } else {
      setThreads([]);
    }
  }, [categoryId]);

  useEffect(() => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPostFE(setLoading, post, setError, setSuccess, () => {
        navigate("/forum/posts");
      }
      );
    } catch (err) {
      setError("Failed to create post. Please try again.");
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
            {/* Category */}
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
                  setPost({ ...post, thread_id: 0 }); // Reset thread
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

            {/* Thread */}
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

            {/* Title input */}
            <div className={styles.formGroup}>
              <label htmlFor="title" className={styles.metaLabel}>
                Title *
              </label>
              <input
                id="title"
                type="text"
                className={styles.formInput}
                value={post.title || ""}
                onChange={(e) =>
                  setPost({ ...post, title: e.target.value })
                }
                required
                maxLength={150}
                disabled={loading}
              />
              <small className={styles.characterCount}>
                {post.title.length}/150 characters
              </small>
            </div>

            {/* Content */}
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

            {/* Image URL */}
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

            {/* Tags */}
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
                    e.target.value = "";
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

            {/* Buttons */}
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
                disabled={
                  loading ||
                  !post.thread_id ||
                  !post.title.trim() ||
                  !post.content.trim()
                }
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
