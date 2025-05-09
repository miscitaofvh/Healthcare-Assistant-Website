import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { handleUpdateThread, loadThreadByID } from "../../../../utils/service/Forum/thread";
import { NewThread, ThreadSummary } from "../../../../types/forum";

const UpdateThread: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [thread, setThread] = useState<ThreadSummary | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchThread = async () => {
            try {
                await loadThreadByID(parseInt(id || ""), setInitialLoad, setThread, setError, () => { });
            } catch {
                setError("An unexpected error occurred");
            }
        };
        fetchThread();
    }, [id]);

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
        if (!thread?.thread_id) return;

        const updatedThread: NewThread = {
            thread_id: thread.thread_id,
            thread_name: thread.thread_name.trim(),
            description: thread.description.trim() || "",
            category_id: thread.category_id
        };

        const validationError = validateInputs(updatedThread);
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            await handleUpdateThread(
                thread.thread_id,
                updatedThread,
                setFormLoading,
                setError,
                setSuccess,
                () => navigate(`/forum/threads/${thread.thread_id}`)
            );
        } catch (err) {
            setError("Failed to update thread. Please try again.");
        }
    };

    const handleInputChange = (field: keyof NewThread, value: string | number) => {
        if (!thread) return;
        setError("");
        setSuccess("");
        setThread({ ...thread, [field]: value });
    };

    if (initialLoad) {
        return (
            <div className={styles.forumContainer}>
                <div className={styles.main_navbar}>
                    <Navbar />
                </div>
                <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Loading thread information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.forumContainer}>
            <div className={styles.main_navbar}>
                <Navbar />
            </div>

            <div className={styles.headerContainer}>
                <div className={styles.headerSection}>
                    <h1 className={styles.pageTitle}>Update Thread</h1>
                    <p className={styles.pageSubtitle}>Edit your thread content below</p>
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

                {thread ? (
                    <div className={styles.tagCard}>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>

                                <label htmlFor="threadCategory" className={styles.readOnlyField}>
                                    Category *
                                </label>

                                <p className={styles.readOnlyValue}>
                                    {thread.category_name}
                                </p>

                                <label htmlFor="threadTitle" className={styles.metaLabel}>
                                    Thread Title *
                                </label>
                                <input
                                    id="threadTitle"
                                    className={styles.formInput}
                                    value={thread.thread_name}
                                    onChange={(e) => handleInputChange("thread_name", e.target.value)}
                                    required
                                    maxLength={50}
                                    placeholder="Enter thread title (required)"
                                    disabled={formLoading}
                                />
                                <small className={styles.characterCount}>
                                    {thread.thread_name.length}/50 characters
                                </small>

                                <label htmlFor="threadContent" className={styles.metaLabel}>
                                    Content *
                                </label>
                                <textarea
                                    id="threadContent"
                                    className={styles.formTextarea}
                                    value={thread.description}
                                    onChange={(e) => handleInputChange("description", e.target.value)}
                                    required
                                    maxLength={200}
                                    placeholder="Enter thread content (required)"
                                    rows={8}
                                    disabled={formLoading}
                                />
                                <small className={styles.characterCount}>
                                    {thread.description?.length}/200 characters
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
                                    disabled={formLoading || initialLoad}
                                >
                                    {formLoading ? (
                                        <>
                                            <span className={styles.spinnerSmall}></span>
                                            Updating...
                                        </>
                                    ) : (
                                        "Update Thread"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <p className={styles.emptyMessage}>Thread not found</p>
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

export default UpdateThread;