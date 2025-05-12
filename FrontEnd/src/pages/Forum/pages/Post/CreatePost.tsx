import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReactMarkdown from "react-markdown";

import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import requestCategory from "../../../../utils/service/Forum/category";
import requestThread from "../../../../utils/service/Forum/thread";
import requestTag from "../../../../utils/service/Forum/tag";
import requestPost from "../../../../utils/service/Forum/post";
import requestImage from "../../../../utils/service/Forum/image";

import { SummaryCategory } from "../../../../types/Forum/category";
import { ThreadDropdown } from "../../../../types/Forum/thread";
import { NewPost } from "../../../../types/Forum/post";
import { SummaryTag } from "../../../../types/Forum/tag";
import tag from "../../../../utils/api/Forum/tag";

const CreatePost: React.FC = () => {
  const [searchParams] = useSearchParams();
  const categoryIdFromUrl = searchParams.get("category");
  const threadIdFromUrl = searchParams.get("thread");

  const [post, setPost] = useState<NewPost>({
    category_id: categoryIdFromUrl ? parseInt(categoryIdFromUrl) : 0,
    thread_id: threadIdFromUrl ? parseInt(threadIdFromUrl) : 0,
    title: "",
    content: "",
    tags: [],
  });

  const [categories, setCategories] = useState<SummaryCategory[]>([]);
  const [categoryId, setCategoryId] = useState<number>(
    categoryIdFromUrl ? parseInt(categoryIdFromUrl) : 0
  );
  const [threads, setThreads] = useState<ThreadDropdown[]>([]);
  const [tags, setTags] = useState<SummaryTag[]>([]);
  const [availableTags, setAvailableTags] = useState<SummaryTag[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);
  const [tagsLoading, setTagsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setCategoriesLoading(true);
        setTagsLoading(true);

        await requestCategory.loadCategoriesSummary(
          (categories) => setCategories(categories),
          (error) => toast.error(error)
        );

        await requestTag.loadTagsSummary(
          setTagsLoading,
          setTags,
          (error) => toast.error(error),
          () => {}
        );
      } catch (err) {
        toast.error("Failed to load initial data");
      } finally {
        setCategoriesLoading(false);
        setTagsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const loadThreads = async () => {
      if (categoryId > 0) {
        try {
          await requestThread.loadThreadsByCategory(
            categoryId,
            (threads) => setThreads(threads),
            (error) => toast.error(error)
          );
        } catch (err) {
          toast.error("Failed to load threads");
        }
      } else {
        setThreads([]);
      }
    };

    loadThreads();
  }, [categoryId]);

  useEffect(() => {
    const filtered = tags.filter(
      (tag) => !post.tags.includes(tag.tag_name)
    );
    setAvailableTags(filtered);
  }, [tags, post.tags]);

  const handleAddTag = (tagName: string) => {
    if (tagName && !post.tags.includes(tagName)) {
      setPost((prev) => ({
        ...prev,
        tags: [...prev.tags, tagName],
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setPost((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await requestPost.createPostFE(
        setLoading,
        post,
        (error) => toast.error(error),
        (success) => toast.success(success),
        () => {
          toast.success("Post created successfully!");
          navigate("/forum/posts");
        }
      );
    } catch (err) {
      toast.error("Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.kind === "file" && item.type.startsWith("image/")) {
        e.preventDefault();

        const file = item.getAsFile();
        if (!file) {
          toast.error("Cannot read image from clipboard.");
          return;
        }

        const maxSizeMB = 5;
        const maxSizeBytes = maxSizeMB * 1024 * 1024;

        if (file.size > maxSizeBytes) {
          toast.error(`File size too large. Limit is ${maxSizeMB}MB.`);
          return;
        }

        try {
          toast.info("Uploading image...");

          const formData = new FormData();
          formData.append("forumImage", file);
          formData.append("folder", "forum-images");
          formData.append("subfolder", "forum-posts");
          formData.append("fileName", file.name || `image-${Date.now()}.png`);

          const markdownImage = await requestImage.uploadPostImageFE(formData);

          if (markdownImage) {
            const cursorPos = textareaRef.current?.selectionStart || 0;
            setPost((prev) => ({
              ...prev,
              content:
                prev.content.substring(0, cursorPos) +
                markdownImage +
                prev.content.substring(cursorPos),
            }));
            toast.success("Image inserted into the post!");
          } else {
            throw new Error("Failed to upload image");
          }
        } catch (error: any) {
          console.error("Error uploading image:", error);
          toast.error(
            error.response?.data?.message || "Failed to upload image"
          );
        }
      }
    }
  };

  return (
    <div className={styles.forumContainer}>
      <ToastContainer position="top-right" autoClose={5000} />
      <div className={styles.main_navbar}>
        <Navbar />
      </div>

      <div className={styles.headerContainer}>
        <div className={styles.headerSection}>
          <h1 className={styles.pageTitle}>Create New Post</h1>
          <p className={styles.pageSubtitle}>
            Share your thoughts with the community
          </p>
        </div>

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
                  setPost((prev) => ({ ...prev, thread_id: 0 }));
                }}
                required
                disabled={loading || categoriesLoading}
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
                  setPost((prev) => ({
                    ...prev,
                    thread_id: parseInt(e.target.value),
                  }))
                }
                required
                disabled={!categoryId || loading || categoriesLoading}
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
                value={post.title}
                onChange={(e) =>
                  setPost((prev) => ({ ...prev, title: e.target.value }))
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

              <div className={styles.tabButtons}>
                <button
                  type="button"
                  className={`${styles.tabButton} ${
                    activeTab === "write" ? styles.activeTab : ""
                  }`}
                  onClick={() => setActiveTab("write")}
                >
                  ✏️ Write
                </button>
                <button
                  type="button"
                  className={`${styles.tabButton} ${
                    activeTab === "preview" ? styles.activeTab : ""
                  }`}
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
                  onChange={(e) =>
                    setPost((prev) => ({ ...prev, content: e.target.value }))
                  }
                  onPaste={handlePaste}
                  required
                  rows={8}
                  maxLength={5000}
                  disabled={loading}
                  placeholder="Write your post content (you can paste images directly here)..."
                />
              ) : (
                <div className={styles.markdownPreview}>
                  <ReactMarkdown>
                    {post.content || "*No content to display*"}
                  </ReactMarkdown>
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
                {post.tags.map((tag) => (
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