import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { loadCategoriesSummary } from "../../../../utils/service/Forum/category";
import { loadThreadsByCategory } from "../../../../utils/service/Forum/thread";
import { loadTagsSummary } from "../../../../utils/service/Forum/tag";
import { getPostById, updatePost } from "../../../../utils/api/Forum/main";
import {
  CategorySummary,
  ThreadDropdown,
  PostNew,
  TagSummary,
  Post,
} from "../../../../types/forum";

const UpdatePost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<PostNew | null>(null);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [threads, setThreads] = useState<ThreadDropdown[]>([]);
  const [tags, setTags] = useState<TagSummary[]>([]);
  const [availableTags, setAvailableTags] = useState<TagSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const postId = id || "0";
        const response = await getPostById(postId);
        const data: Post = response.data.post;

        setPost({
          thread_id: data.thread_id,
          content: data.content,
          image_url: data.image_url,
          tag_name: data.tags.map(tag => tag.tag_name),
        });

        await loadCategoriesSummary(() => {}, setCategories, setError, () => {});
        await loadTagsSummary(setTagsLoading, setTags, setError, () => {});
        await loadThreadsByCategory(data.category_id, setThreads, setError);
      } catch (err) {
        setError("Failed to load post details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    const filtered = tags.filter(tag => !post?.tag_name.includes(tag.tag_name));
    setAvailableTags(filtered);
  }, [tags, post?.tag_name]);

  const handleAddTag = (tagName: string) => {
    if (post && tagName && !post.tag_name.includes(tagName)) {
      setPost(prev => ({
        ...prev!,
        tag_name: [...prev!.tag_name, tagName],
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setPost(prev => ({
      ...prev!,
      tag_name: prev!.tag_name.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;

    setLoading(true);
    setError("");
    try {
      await updatePost(id || "", post);
      setSuccess("Post updated successfully!");
      setTimeout(() => navigate(`/forum/posts/${id}`), 2000);
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
              <label htmlFor="thread" className={styles.metaLabel}>Thread *</label>
              <select
                id="thread"
                className={styles.formInput}
                value={post.thread_id}
                onChange={(e) =>
                  handleInputChange("thread_id", parseInt(e.target.value))
                }
                required
                disabled={loading}
              >
                <option value={0}>Select thread</option>
                {threads.map(thread => (
                  <option key={thread.thread_id} value={thread.thread_id}>
                    {thread.thread_name}
                  </option>
                ))}
              </select>
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
              <label htmlFor="imageUrl" className={styles.metaLabel}>
                Image URL (optional)
              </label>
              <input
                id="imageUrl"
                type="text"
                className={styles.formInput}
                value={post.image_url || ""}
                onChange={(e) => handleInputChange("image_url", e.target.value)}
                disabled={loading}
              />
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
                {post.tag_name.map(tag => (
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