import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { toast } from "react-toastify";
import ReactMarkdown from "react-markdown";
import requestCategory from "../../../../utils/service/Forum/category";
import requestThread from "../../../../utils/service/Forum/thread";
import requestTag from "../../../../utils/service/Forum/tag";
import requestPost from "../../../../utils/service/Forum/post";
import requestImage from "../../../../utils/service/Forum/image";

import { SummaryCategory } from "../../../../types/Forum/category";
import { ThreadDropdown } from "../../../../types/Forum/thread";
import { NewPost } from "../../../../types/Forum/post";
import { SummaryTag } from "../../../../types/Forum/tag";

const CreatePost: React.FC = () => {
  const [categoryId, setCategoryId] = useState<number>(0);
  const [post, setPost] = useState<NewPost>({
    thread_id: 0,
    title: "",
    content: "",
    tag_name: [],
  });
  const [categories, setCategories] = useState<SummaryCategory[]>([]);
  const [threads, setThreads] = useState<ThreadDropdown[]>([]);
  const [tags, setTags] = useState<SummaryTag[]>([]);
  const [availableTags, setAvailableTags] = useState<SummaryTag[]>([]);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [tagsLoading, setTagsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      requestCategory.loadCategoriesSummary(
        (categories) => setCategories(categories),
        (error) => toast.error(error)
      );
      // requestTag.loadTagsSummary(setTagsLoading, setTags, setError, () => { });
    } catch (err) {
      setError("Failed to load categories or tags. Please try again.");
    }
  }, []);

  useEffect(() => {
    if (categoryId > 0) {
      requestThread.loadThreadsByCategory(categoryId, setThreads, setError);
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
      await requestPost.createPostFE(setLoading, post, setError, setSuccess, () => {
        navigate("/forum/posts");
      }
      );
    } catch (err) {
      setError("Failed to create post. Please try again.");
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.kind === 'file' && item.type.startsWith('image/')) {
        e.preventDefault();

        const file = item.getAsFile();
        if (!file) {
          toast.error("Không thể đọc ảnh từ clipboard.");
          console.warn("Clipboard item exists but file is null.");
          return;
        }
        const maxSizeMB = 5;
        const maxSizeBytes = maxSizeMB * 1024 * 1024;

        if (file.size > maxSizeBytes) {
          toast.error(`Kích thước file quá lớn. Giới hạn ${maxSizeMB}MB.`);
          return;
        }

        try {
          toast.info('Đang tải hình ảnh lên...');

          const formData = new FormData();
          formData.append('forumImage', file);
          formData.append('folder', 'forum-images');
          formData.append('subfolder', 'forum-posts');
          formData.append('fileName', file.name || 'image.png' + Math.random().toString(36).substring(2, 15));

          const markdownImage = await requestImage.uploadPostImageFE(formData);

          if (markdownImage) {
            const cursorPos = textareaRef.current?.selectionStart || 0;

            setPost(prev => ({
              ...prev,
              content:
                prev.content.substring(0, cursorPos) +
                markdownImage +
                prev.content.substring(cursorPos),
            }));

            toast.success('Hình ảnh đã được chèn vào bài viết!');
          } else {
            throw new Error('Lỗi khi tải ảnh lên');
          }
        } catch (error: any) {
          console.error('Error uploading image:', error);
          toast.error(error.response?.data?.message || 'Không thể tải lên hình ảnh');
        }
      }
    }
  };


  return (
    <div className={styles.forumContainer}>
      <div className={styles.main_navbar}>
        <Navbar />
      </div>

      <div className={styles.headerContainer}>
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

        <div className={styles.forumCard}>
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
              <label htmlFor="content" className={styles.metaLabel}>Content *</label>

              {/* Tab Buttons */}
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

              {/* Content Area */}
              {activeTab === "write" ? (
                <textarea
                  id="content"
                  ref={textareaRef}
                  className={styles.formTextarea}
                  value={post.content}
                  onChange={(e) => setPost({ ...post, content: e.target.value })}
                  onPaste={handlePaste}
                  required
                  rows={8}
                  maxLength={5000}
                  disabled={loading}
                  placeholder="Viết nội dung bài đăng của bạn (có thể dán ảnh trực tiếp vào đây)..."
                />
              ) : (
                <div className={styles.markdownPreview}>
                  <ReactMarkdown>{post.content || "*Không có nội dung để hiển thị*"}</ReactMarkdown>
                </div>
              )}

              <small className={styles.characterCount}>
                {post.content.length}/5000 characters
              </small>
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
