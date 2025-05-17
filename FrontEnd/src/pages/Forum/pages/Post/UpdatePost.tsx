import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "@components/Navbar";
import styles from "../../styles/Forum.module.css";
import ReactMarkdown from "react-markdown";
import requestPost from "@utils/service/Forum/post";
import requestTag from "@utils/service/Forum/tag";
import requestImage from "@utils/service/Forum/image";
import { SummaryCategory, ThreadDropdown, SummaryTag, Post, NewPost } from "forum";

const UpdatePost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [categories, setCategories] = useState<SummaryCategory[]>([]);
  const [threads, setThreads] = useState<ThreadDropdown[]>([]);
  const [tags, setTags] = useState<SummaryTag[]>([]);
  const [availableTags, setAvailableTags] = useState<SummaryTag[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await requestPost.loadUpdatePostFE(
          id || "",
          setInitialLoad,
          setPost,
          setCategories,
          setThreads,
          (error) => toast.error(error),
          () => toast.success("Post loaded successfully")
        );
        requestTag.getSummaryTagsPost(
          setTagsLoading,
          setTags,
          (error) => toast.error(error));
      } catch {
        toast.error("Failed to load post details");
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!post) return;
    setAvailableTags(tags.filter(tag => !post.tags.some(t => t.tag_name === tag.tag_name)));
  }, [tags, post?.tags]);

  const handleInputChange = (field: keyof Post, value: any) => {
    if (!post) return;
    setPost({ ...post, [field]: value });
  };

  const handleAddTag = (tagName: string) => {
    if (!post || !tagName || post.tags.some(t => t.tag_name === tagName)) return;
    const tag = tags.find(t => t.tag_name === tagName);
    if (tag) {
      setPost({ ...post, tags: [...post.tags, tag] });
    }
  };

  const removeTag = (tagName: string) => {
    if (!post) return;
    setPost({ ...post, tags: post.tags.filter(t => t.tag_name !== tagName) });
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (const item of Array.from(items)) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) {
          toast.error("Cannot read image from clipboard");
          return;
        }
        const maxSizeMB = 5;
        if (file.size > maxSizeMB * 1024 * 1024) {
          toast.error(`File size exceeds ${maxSizeMB}MB limit`);
          return;
        }

        try {
          toast.info("Uploading image...");
          const formData = new FormData();
          formData.append("forumImage", file);
          formData.append("folder", "forum-images");
          formData.append("subfolder", "forum-posts");
          formData.append("fileName", file.name || "image.png");

          const markdownImage = await requestImage.uploadPostImageFE(formData);
          if (!markdownImage) throw new Error("Upload failed");

          const cursorPos = textareaRef.current?.selectionStart || 0;
          setPost(prev => ({
            ...prev!,
            content:
              prev!.content.slice(0, cursorPos) +
              markdownImage +
              prev!.content.slice(cursorPos),
          }));
          toast.success("Image inserted successfully!");
        } catch (err: any) {
          toast.error(err?.response?.data?.message || "Failed to upload image");
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !post.thread_id) {
      toast.error("Invalid post data");
      return;
    }

    const updatePayload: NewPost = {
      thread_id: post.thread_id,
      title: post.title.trim(),
      content: post.content.trim(),
      tags: post.tags.map(tag => tag.tag_name),
    };

    try {
      setFormLoading(true);
      await requestPost.updatePostFE(
        id || "",
        updatePayload,
        setFormLoading,
        (error) => toast.error(error),
        (success) => toast.success(success),
        () => {
          toast.success("Post updated successfully!");
          navigate(`/forum/posts/${id}`);
        }
      );
    } catch {
      toast.error("Failed to update post. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  if (initialLoad) {
    return (
      <div className={styles.forumContainer}>
        <ToastContainer position="top-right" autoClose={5000} />
        <div className={styles.main_navbar}>
          <Navbar />
        </div>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading post information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.forumContainer}>
      <ToastContainer position="top-right" autoClose={5000} />
      <div className={styles.main_navbar}>
        <Navbar />
      </div>

      <div className={styles.headerContainer}>
        <div className={styles.headerSection}>
          <h1 className={styles.pageTitle}>Update Post</h1>
          <p className={styles.pageSubtitle}>Edit your post content below</p>
        </div>

        {post ? (
          <div className={styles.forumCard}>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.readOnlyField}>Category *</label>
                <p className={styles.readOnlyValue}>
                  {categories.find(c => c.category_id === post.category_id)?.category_name || "Unknown"}
                </p>

                <label className={styles.readOnlyField}>Thread *</label>
                <p className={styles.readOnlyValue}>
                  {threads.find(t => t.thread_id === post.thread_id)?.thread_name || "Unknown"}
                </p>

                <label htmlFor="title" className={styles.metaLabel}>Title *</label>
                <input
                  id="title"
                  className={styles.formInput}
                  value={post.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  required
                  maxLength={100}
                  placeholder="Enter post title (required)"
                  disabled={formLoading}
                />
                <small className={styles.characterCount}>
                  {post.title.length}/100 characters
                </small>

                <label htmlFor="content" className={styles.metaLabel}>Content *</label>
                <div className={styles.tabButtons}>
                  <button
                    type="button"
                    className={`${styles.tabButton} ${activeTab === "write" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("write")}
                    disabled={formLoading}
                  >
                    ✏️ Write
                  </button>
                  <button
                    type="button"
                    className={`${styles.tabButton} ${activeTab === "preview" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("preview")}
                    disabled={formLoading}
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
                    maxLength={5000}
                    placeholder="Enter post content (you can paste images)..."
                    rows={8}
                    disabled={formLoading}
                  />
                ) : (
                  <div className={styles.markdownPreview}>
                    <ReactMarkdown>{post.content || "*No content to display*"}</ReactMarkdown>
                  </div>
                )}
                <small className={styles.characterCount}>
                  {post.content.length}/5000 characters
                </small>

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
                  disabled={formLoading}
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
                        disabled={formLoading}
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
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={formLoading || !post.title.trim() || !post.content.trim()}
                >
                  {formLoading ? (
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
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyMessage}>Post not found</p>
            <button
              className={styles.primaryButton}
              onClick={() => navigate("/forum")}
            >
              Back to Forum
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdatePost;