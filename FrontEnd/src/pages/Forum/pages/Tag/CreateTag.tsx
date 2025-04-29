import React, { useState } from "react";
import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { handleCreateTag } from "../../../../utils/service/Forum/tag";
import { NewTag } from "../../../../types/forum";
import { useNavigate } from "react-router-dom";

const CreateTag: React.FC = () => {
    const [newTag, setNewTag] = useState<NewTag>({ 
        tag_name: "", 
        description: "" 
    });
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newTag.tag_name) {
            setError("Tag name is required");
            return;
          }
      
          if (newTag.tag_name.length > 50 || newTag.tag_name.length < 1) {
            setError("Tag name must be from 2 to 50 characters long");
            return;
          }
      
          if (newTag.description && (newTag.description.length > 200 || newTag.description.length < 10)) {
            setError("Description must be from 10 to 200 characters long");
            return;
          }

        setError("");
        setFormLoading(true);

        try {
            await handleCreateTag(
                {
                    tag_name: newTag.tag_name.trim(),
                    description: newTag.description?.trim() || undefined
                }, 
                setFormLoading, 
                setError, 
                setSuccess, 
                () => navigate("/forum/tags")
            );
        } catch (err) {
            setError("An unexpected error occurred while creating the tag");
            console.error("Tag creation error:", err);
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className={styles.forumContainer}>
            <div className={styles.main_navbar}>
                <Navbar />
            </div>
            
            <div className={styles.tagListContainer}>
                <div className={styles.headerSection}>
                    <h1 className={styles.pageTitle}>Create New Tag</h1>
                    <p className={styles.pageSubtitle}>Add a new tag to categorize forum content</p>
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
                                value={newTag.tag_name}
                                onChange={(e) => 
                                    setNewTag({ ...newTag, tag_name: e.target.value })
                                }
                                required
                                maxLength={100}
                                placeholder="Enter tag name (required)"
                            />
                            <small className={styles.characterCount}>
                                {newTag.tag_name.length}/100 characters
                            </small>

                            <label htmlFor="tagDescription" className={styles.metaLabel}>
                                Description
                            </label>
                            <textarea
                                id="tagDescription"
                                className={styles.formTextarea}
                                value={newTag.description}
                                onChange={(e) => 
                                    setNewTag({ ...newTag, description: e.target.value })
                                }
                                maxLength={1000}
                                placeholder="Enter tag description (optional)"
                                rows={4}
                            />
                            <small className={styles.characterCount}>
                                {newTag.description?.length || 0}/1000 characters
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
                                        Creating...
                                    </>
                                ) : (
                                    "Create Tag"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateTag;