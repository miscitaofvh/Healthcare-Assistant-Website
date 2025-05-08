import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { loadUpdatePostFE, updatePostFE } from "../../../../utils/service/Forum/post";
import { updatePost } from "../../../../utils/api/Forum/main";
import { loadTagsPostSummary } from "../../../../utils/service/Forum/tag";
import {
  CategorySummary,
  ThreadDropdown,
  PostNew,
  TagPost,
  Post,
} from "../../../../types/forum";

const UpdatePost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [threads, setThreads] = useState<ThreadDropdown[]>([]);
  const [tags, setTags] = useState<TagPost[]>([]);
  const [availableTags, setAvailableTags] = useState<TagPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await loadUpdatePostFE(
          id || "",
          setLoading,
          setPost,
          setCategories,
          setThreads,
          setError,
          () => { }
        );
        await loadTagsPostSummary(setTagsLoading, setTags, setError, () => { });
      } catch (err) {
        setError("Failed to load post details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (!post) return;

    const filtered = tags.filter(tag =>
      !post.tags.some(postTag => postTag.tag_name === tag.tag_name)
    );
    setAvailableTags(filtered);
  }, [tags, post?.tags]);

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

  const handleAddTag = (tagName: string) => {
    if (!post || !tagName || post.tags.some(tag => tag.tag_name === tagName)) return;

    const tagToAdd = tags.find(tag => tag.tag_name === tagName);
    if (!tagToAdd) return;

    setPost(prev => ({
      ...prev!,
      tags: [...prev!.tags, tagToAdd],
    }));
  };

  const removeTag = (tagToRemove: string) => {
    if (!post) return;

    setPost(prev => ({
      ...prev!,
      tags: prev!.tags.filter(tag => tag.tag_name !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post){
      setError("Invalid post data.");
      return;
    }

    try {
      
      const postData = {
        ...post,
        tags: post.tags.map(tag => tag.tag_name),
        tag_name: undefined
      };

      await updatePostFE(id || "", postData, setLoading, setError, setSuccess, () => navigate(`/forum/posts/${id}`));
    } catch {
      setError("Failed to update post.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PostNew, value: any) => {
    if (!post) return;
    setError("");
    setSuccess("");
    setPost({ ...post, [field]: value });
  };

  if (!post) {
    return (
      <div className={styles.forumContainer}>
        <div className={styles.main_navbar}>
          <Navbar />
        </div>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading post data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.forumContainer}>
      <div className={styles.main_navbar}>
        <Navbar />
      </div>

      <div className={styles.tagListContainer}>
        <div className={styles.headerSection}>
          <h1 className={styles.pageTitle}>Update Post</h1>
          <p className={styles.pageSubtitle}>Modify your post content below</p>
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
              <div className={styles.readOnlyField}>
                <span className={styles.metaLabel}>Category:</span>
                <span className={styles.readOnlyValue}>
                  {categories.find(c => c.category_id === post.category_id)?.category_name || "Not selected"}
                </span>
              </div>

              <div className={styles.readOnlyField}>
                <span className={styles.metaLabel}>Thread:</span>
                <span className={styles.readOnlyValue}>
                  {threads.find(t => t.thread_id === post.thread_id)?.thread_name || "Not selected"}
                </span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="title" className={styles.metaLabel}>Title *</label>
              <input
                id="title"
                type="text"
                className={styles.formInput}
                value={post.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="content" className={styles.metaLabel}>Content *</label>
              <textarea
                id="content"
                className={styles.formTextarea}
                value={post.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
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
              <label htmlFor="tags" className={styles.metaLabel}>Tags</label>
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
                {availableTags.map(tag => (
                  <option key={tag.tag_id} value={tag.tag_name}>
                    #{tag.tag_name}
                  </option>
                ))}
              </select>

              <div className={styles.tagContainer}>
                {post.tags.map(tag => (
                  <span key={tag.tag_id} className={styles.tag}>
                    #{tag.tag_name}
                    <button
                      type="button"
                      className={styles.tagRemove}
                      onClick={() => removeTag(tag.tag_name)}
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
                    Updating...
                  </>
                ) : (
                  "Update Post"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdatePost;