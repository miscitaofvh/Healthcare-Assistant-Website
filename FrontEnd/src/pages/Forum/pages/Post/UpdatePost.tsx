import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { toast } from "react-toastify";
import ReactMarkdown from "react-markdown";
import {
  loadUpdatePostFE,
  updatePostFE,
  uploadPostImageFE,
} from "../../../../utils/service/Forum/post";
import { loadTagsPostSummary } from "../../../../utils/service/Forum/tag";
import {
  CategorySummary,
  ThreadDropdown,
  TagPost,
  Post,
  PostNew,
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
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await loadUpdatePostFE(id || "", setLoading, setPost, setCategories, setThreads, setError, () => {});
        await loadTagsPostSummary(setTagsLoading, setTags, setError, () => {});
      } catch {
        setError("Failed to load post details.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!post) return;
    const filtered = tags.filter(tag => !post.tags.some(t => t.tag_name === tag.tag_name));
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

  const handleInputChange = (field: keyof Post, value: any) => {
    if (!post) return;
    setError("");
    setSuccess("");
    setPost({ ...post, [field]: value });
  };

  const handleAddTag = (tagName: string) => {
    if (!post || !tagName || post.tags.some(t => t.tag_name === tagName)) return;
    const tag = tags.find(t => t.tag_name === tagName);
    if (tag) setPost(prev => ({ ...prev!, tags: [...prev!.tags, tag] }));
  };

  const removeTag = (tagName: string) => {
    if (!post) return;
    setPost(prev => ({ ...prev!, tags: prev!.tags.filter(t => t.tag_name !== tagName) }));
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return toast.error("Không thể đọc ảnh từ clipboard.");
        const maxSizeMB = 5;
        if (file.size > maxSizeMB * 1024 * 1024) return toast.error(`Kích thước file quá lớn. Giới hạn ${maxSizeMB}MB.`);

        try {
          toast.info("Đang tải hình ảnh lên...");
          const formData = new FormData();
          formData.append("forumImage", file);
          formData.append("folder", "forum-images");
          formData.append("subfolder", "forum-posts");
          formData.append("fileName", file.name || "image.png");

          const markdownImage = await uploadPostImageFE(formData);
          if (!markdownImage) throw new Error("Upload failed");

          const cursorPos = textareaRef.current?.selectionStart || 0;
          setPost(prev => ({
            ...prev!,
            content:
              prev!.content.slice(0, cursorPos) +
              markdownImage +
              prev!.content.slice(cursorPos),
          }));
          toast.success("Hình ảnh đã được chèn vào bài viết!");
        } catch (err: any) {
          toast.error(err?.response?.data?.message || "Không thể tải lên hình ảnh");
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return setError("Invalid post data.");

    try {
      const updatePayload: PostNew = {
        thread_id: post.thread_id,
        title: post.title,
        content: post.content,
        tag_name: post.tags.map(tag => tag.tag_name),
      };

      await updatePostFE(id || "", updatePayload, setLoading, setError, setSuccess, () => {
        navigate(`/forum/posts/${id}`);
      });
    } catch {
      setError("Failed to update post.");
    } finally {
      setLoading(false);
    }
  };

  if (!post) {
    return (
      <div className={styles.forumContainer}>
        <div className={styles.main_navbar}><Navbar /></div>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading post data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.forumContainer}>
      <div className={styles.main_navbar}><Navbar /></div>

      <div className={styles.tagListContainer}>
        <div className={styles.headerSection}>
          <h1 className={styles.pageTitle}>Update Post</h1>
          <p className={styles.pageSubtitle}>Modify your post content below</p>
        </div>

        {error && <div className={styles.errorAlert}><span className={styles.errorIcon}>⚠️</span> {error}</div>}
        {success && <div className={styles.alertSuccess}><span className={styles.successIcon}>✅</span> {success}</div>}

        <div className={styles.tagCard}>
          <form onSubmit={handleSubmit}>
            {/* Read-only Category & Thread */}
            <div className={styles.formGroup}>
              <div className={styles.readOnlyField}>
                <span className={styles.metaLabel}>Category:</span>
                <span className={styles.readOnlyValue}>
                  {categories.find(c => c.category_id === post.category_id)?.category_name || "Unknown"}
                </span>
              </div>

              <div className={styles.readOnlyField}>
                <span className={styles.metaLabel}>Thread:</span>
                <span className={styles.readOnlyValue}>
                  {threads.find(t => t.thread_id === post.thread_id)?.thread_name || "Unknown"}
                </span>
              </div>
            </div>

            {/* Title */}
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

            {/* Content */}
            <div className={styles.formGroup}>
              <label htmlFor="content" className={styles.metaLabel}>Content *</label>
              <div className={styles.tabButtons}>
                <button
                  type="button"
                  className={`${styles.tabButton} ${activeTab === "write" ? styles.activeTab : ""}`}
                  onClick={() => setActiveTab("write")}
                >
                  ✏️ Write
                </button>
                <button
                  type="button"
                  className={`${styles.tabButton} ${activeTab === "preview" ? styles.activeTab : ""}`}
                  onClick={() => setActiveTab("preview")}
                >
                  👁️ Preview
                </button>
              </div>

              {activeTab === "write" ? (
                <textarea
                  id="content"
                  ref={textareaRef}
                  className={styles.formTextarea}
                  value={post.content}
                  onChange={(e) => handleInputChange("content", e.target.value)}
                  onPaste={handlePaste}
                  required
                  rows={8}
                  maxLength={5000}
                  disabled={loading}
                  placeholder="Chỉnh sửa nội dung bài viết (có thể dán ảnh)..."
                />
              ) : (
                <div className={styles.markdownPreview}>
                  <ReactMarkdown>{post.content || "*Không có nội dung để hiển thị*"}</ReactMarkdown>
                </div>
              )}
              <small className={styles.characterCount}>{post.content.length}/5000 characters</small>
            </div>

            {/* Tags */}
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
                  <option key={tag.tag_id} value={tag.tag_name}>#{tag.tag_name}</option>
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
                disabled={loading || !post.title.trim() || !post.content.trim()}
              >
                {loading ? (
                  <>
                    <span className={styles.spinnerSmall}></span> Updating...
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