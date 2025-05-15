import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import requestTag from "../../../../utils/service/Forum/tag";
import { NewTag } from "../../../../types/Forum/tag";

const CreateTag: React.FC = () => {
    const [newTag, setNewTag] = useState<NewTag>({
        tag_name: "",
        description: ""
    });
    const [formLoading, setFormLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setFormLoading(true);
            await requestTag.handleCreateTag(
                {
                    tag_name: newTag.tag_name.trim(),
                    description: newTag.description?.trim() || ""
                },
                (error) => toast.error(error),
                (success) => toast.success(success),
                () => {
                    toast.success("Tag created successfully!");
                    navigate("/forum/tags");
                },
                setFormLoading
            );
        } catch (err) {
            toast.error("An unexpected error occurred while creating the tag");
        } finally {
            setFormLoading(false);
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
                    <h1 className={styles.pageTitle}>Create New Tag</h1>
                    <p className={styles.pageSubtitle}>Add a new tag to categorize forum content</p>
                </div>

                <div className={styles.forumCard}>
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
                                maxLength={30}
                                placeholder="Enter tag name (required)"
                                disabled={formLoading}
                            />
                            <small className={styles.characterCount}>
                                {newTag.tag_name.length}/30 characters
                            </small>

                            <label htmlFor="tagDescription" className={styles.metaLabel}>
                                Description
                            </label>
                            <textarea
                                id="tagDescription"
                                className={styles.formTextarea}
                                value={newTag.description || ""}
                                onChange={(e) =>
                                    setNewTag({ ...newTag, description: e.target.value })
                                }
                                maxLength={150}
                                placeholder="Enter tag description (optional)"
                                rows={4}
                                disabled={formLoading}
                            />
                            <small className={styles.characterCount}>
                                {newTag.description?.length || 0}/150 characters
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
                                        <span className={styles.spinnerSmall}></span> Creating...
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