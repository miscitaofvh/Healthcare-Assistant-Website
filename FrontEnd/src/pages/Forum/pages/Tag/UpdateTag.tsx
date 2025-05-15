import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import requestTag from "../../../../utils/service/Forum/tag";
import { Tag, NewTag } from "../../../../types/Forum/tag";

const UpdateTag: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tag, setTag] = useState<Tag | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTag = async () => {
      try {
        await requestTag.loadTagByID(
          parseInt(id || ""),
          setInitialLoad,
          setTag,
          (error) => toast.error(error),
          () => {
            toast.success("Tag loaded successfully");
          }
        );
      } catch (err) {
        toast.error("An unexpected error occurred while loading tag");
      }
    };

    fetchTag();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tag?.tag_id) return;

    const updatedTag: NewTag = {
      tag_name: tag.tag_name.trim(),
      description: tag.description?.trim() || "",
    };

    try {
      setFormLoading(true);
      await requestTag.handleUpdateTag(
        tag.tag_id,
        updatedTag,
        (error) => toast.error(error),
        (success) => toast.success(success),
        () => {
          toast.success("Tag updated successfully!");
          navigate(`/forum/tags/${tag.tag_id}`);
        },
        setFormLoading
      );
    } catch (err) {
      toast.error("An unexpected error occurred while updating the tag");
    } finally {
      setFormLoading(false);
    }
  };

  const handleInputChange = (field: keyof Tag, value: string) => {
    if (!tag) return;
    setTag({ ...tag, [field]: value });
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
          <p>Loading tag information...</p>
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
          <h1 className={styles.pageTitle}>Update Tag</h1>
          <p className={styles.pageSubtitle}>Modify your tag details below</p>
        </div>

        {tag ? (
          <div className={styles.forumCard}>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="tagName" className={styles.metaLabel}>
                  Tag Name *
                </label>
                <input
                  id="tagName"
                  className={styles.formInput}
                  value={tag.tag_name}
                  onChange={(e) => handleInputChange("tag_name", e.target.value)}
                  required
                  maxLength={30}
                  placeholder="Enter tag name (required)"
                  disabled={formLoading}
                />
                <small className={styles.characterCount}>
                  {tag.tag_name.length}/30 characters
                </small>

                <label htmlFor="tagDescription" className={styles.metaLabel}>
                  Description
                </label>
                <textarea
                  id="tagDescription"
                  className={styles.formTextarea}
                  value={tag.description || ""}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  maxLength={150}
                  placeholder="Enter tag description (optional)"
                  rows={4}
                  disabled={formLoading}
                />
                <small className={styles.characterCount}>
                  {(tag.description?.length || 0)}/150 characters
                </small>
              </div>

              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => navigate("/forum/tags")}
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.primaryButton} 
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <span className={styles.spinnerSmall}></span>
                      Updating...
                    </>
                  ) : (
                    "Update Tag"
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyMessage}>Tag not found</p>
            <button
              className={styles.primaryButton}
              onClick={() => navigate("/forum/tags")}
            >
              Back to Tags
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateTag;