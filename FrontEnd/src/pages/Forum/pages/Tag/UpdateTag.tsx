import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { handleUpdateTag, loadTags } from "../../../../utils/service/Forum/tag";
import { Tag, NewTag } from "../../../../types/forum";

const UpdateTag: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tag, setTag] = useState<Tag | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const [initialLoad, setInitialLoad] = useState(true);
  useEffect(() => {
    const fetchTag = async () => {
      setInitialLoad(true);
      setError("");
      try {
        await loadTags(
          () => {}, 
          (tags: Tag[]) => {
            const found = tags.find((t) => t.tag_id === parseInt(id || ""));
            if (found) {
              setTag(found); 
            } else {
              setError("Tag not found"); 
            }
          },
          setError,
          () => setInitialLoad(false)
        );
      } catch (err) {
        setError("An unexpected error occurred"); 
        setInitialLoad(false); 
      }
    };
  
    fetchTag();
  }, [id]); 
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tag?.tag_id) return;

    const updatedTag: NewTag = {
      tag_id: tag.tag_id,
      tag_name: tag.tag_name.trim(),
      description: tag.description?.trim() || undefined,
    };

    if (!updatedTag.tag_name) {
      setError("Tag name is required");
      return;
    }

    if (updatedTag.tag_name.length > 50 || updatedTag.tag_name.length < 1) {
      setError("Tag name must be from 2 to 50 characters long");
      return;
    }

    if (updatedTag.description && (updatedTag.description.length > 200 || updatedTag.description.length < 10)) {
      setError("Description must be from 10 to 200 characters long");
      return;
    }

    try {
      await handleUpdateTag(
        tag.tag_id,
        updatedTag,
        setFormLoading,
        setError,
        setSuccess,
        () => {
          navigate("/forum/tags");
        }
      );
    } catch (err) {
      setError("Failed to update tag. Please try again.");
    }
  };

  if (initialLoad) {
    return (
      <div className={styles.forumContainer}>
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
      <div className={styles.main_navbar}>
        <Navbar />
      </div>

      <div className={styles.tagListContainer}>
        <div className={styles.headerSection}>
          <h1 className={styles.pageTitle}>Update Tag</h1>
          <p className={styles.pageSubtitle}>Modify your tag details below</p>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <span className={styles.errorIcon}>⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className={styles.alertSuccess}>
            <span className={styles.errorIcon}>✅</span>
            {success}
          </div>
        )}

        {tag ? (
          <div className={styles.tagCard}>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="tagName" className={styles.metaLabel}>
                  Tag Name *
                </label>
                <input
                  type="text"
                  id="tagName"
                  className={styles.formInput}
                  value={tag.tag_name}
                  onChange={(e) => setTag({ ...tag, tag_name: e.target.value })}
                  required
                  maxLength={50}
                  placeholder="Enter tag name (required)"
                />
                <small className={styles.characterCount}>
                  {tag.tag_name.length}/50 characters
                </small>

                <label htmlFor="tagDescription" className={styles.metaLabel}>
                  Description
                </label>
                <textarea
                  id="tagDescription"
                  className={styles.formTextarea}
                  value={tag.description || ""}
                  onChange={(e) => setTag({ ...tag, description: e.target.value })}
                  maxLength={200}
                  placeholder="Enter tag description (optional)"
                  rows={4}
                />
                <small className={styles.characterCount}>
                  {(tag.description?.length || 0)}/200 characters
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