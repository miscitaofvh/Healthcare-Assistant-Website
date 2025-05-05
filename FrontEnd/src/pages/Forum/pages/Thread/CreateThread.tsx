import React, { useState, useEffect } from "react";
import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { handleCreateThread } from "../../../../utils/service/Forum/thread";
import { NewThread } from "../../../../types/forum";
import { useNavigate } from "react-router-dom";
import { loadCategoriesSummary } from "../../../../utils/service/Forum/category";
import { CategorySummary } from "../../../../types/forum";

const CreateThread: React.FC = () => {
    const [newThread, setNewThread] = useState<NewThread>({
        thread_id: 0,
        thread_name: "",
        description: "",
        category_id: 0,
    });
    const [categories, setCategories] = useState<CategorySummary[]>([]);
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                await loadCategoriesSummary(
                    setCategoriesLoading,
                    setCategories,
                    setError,
                    () => { }
                );
            } catch (err) {
                setError("Failed to load categories");
            }
        };

        fetchCategories();
    }, []);

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

    const validateInputs = (thread: NewThread): string | null => {
        const title = thread.thread_name.trim();
        let description = thread.description?.trim() || "";
        if (!title) return "Thread title is required";
        if (title.length < 3 || title.length > 50) return "Thread title must be from 3 to 50 characters";
        if (!description) return "Thread content is required";
        if (description.length < 10 || description.length > 200) return "Content must be from 10 to 200 characters";
        if (!thread.category_id || thread.category_id <= 0) return "Please select a valid category";

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationError = validateInputs(newThread);
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            await handleCreateThread(
                newThread,
                setFormLoading,
                setError,
                setSuccess,
                () => navigate(`/forum/categories/${newThread.category_id}`)
            );
        } catch (err) {
            setError("An unexpected error occurred while creating the thread");
        }
    };

    return (
        <div className={styles.forumContainer}>
            <div className={styles.main_navbar}>
                <Navbar />
            </div>

            <div className={styles.tagListContainer}>
                <div className={styles.headerSection}>
                    <h1 className={styles.pageTitle}>Create New Thread</h1>
                    <p className={styles.pageSubtitle}>Start a new discussion in the forum</p>
                </div>

                {error && (
                    <div className={styles.errorAlert}>
                        <span className={styles.errorIcon}>⚠️</span> {error}
                    </div>
                )}

                {success && (
                    <div className={styles.alertSuccess}>
                        <span className={styles.errorIcon}>✅</span> {success}
                    </div>
                )}

                <div className={styles.tagCard}>
                    <form onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <label htmlFor="threadCategory" className={styles.metaLabel}>
                                Category *
                            </label>
                            <select
                                id="threadCategory"
                                className={styles.formInput}
                                value={newThread.category_id}
                                onChange={(e) =>
                                    setNewThread({ ...newThread, category_id: parseInt(e.target.value) })
                                }
                                required
                                disabled={formLoading || categoriesLoading}
                            >
                                <option value="0">Select a category</option>
                                {categories.map((category) => (
                                    <option key={category.category_id} value={category.category_id}>
                                        {category.category_name}
                                    </option>
                                ))}
                            </select>

                            <label htmlFor="threadTitle" className={styles.metaLabel}>
                                Thread Title *
                            </label>
                            <input
                                type="text"
                                id="threadTitle"
                                className={styles.formInput}
                                value={newThread.thread_name}
                                onChange={(e) =>
                                    setNewThread({ ...newThread, thread_name: e.target.value })
                                }
                                required
                                maxLength={100}
                                placeholder="Enter thread title (required)"
                                disabled={formLoading}
                            />
                            <small className={styles.characterCount}>
                                {newThread.thread_name.length}/100 characters
                            </small>

                            <label htmlFor="threadContent" className={styles.metaLabel}>
                                Content *
                            </label>
                            <textarea
                                id="threadContent"
                                className={styles.formTextarea}
                                value={newThread.description}
                                onChange={(e) =>
                                    setNewThread({ ...newThread, description: e.target.value })
                                }
                                required
                                maxLength={5000}
                                placeholder="Enter your thread content (required)"
                                rows={8}
                                disabled={formLoading}
                            />
                            <small className={styles.characterCount}>
                                {newThread.description.length}/5000 characters
                            </small>
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
                                disabled={formLoading || categoriesLoading}
                            >
                                {formLoading ? (
                                    <>
                                        <span className={styles.spinnerSmall}></span> Creating...
                                    </>
                                ) : (
                                    "Create Thread"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateThread;