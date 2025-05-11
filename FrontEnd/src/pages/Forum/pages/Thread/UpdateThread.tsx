import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import requestThread from "../../../../utils/service/Forum/thread";
import { NewThread, ThreadSummary } from "../../../../types/Forum/thread";

const UpdateThread: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [thread, setThread] = useState<ThreadSummary | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);

    useEffect(() => {
        const fetchThread = async () => {
            try {
                await requestThread.loadThreadByID(
                    parseInt(id || ""),
                    setInitialLoad,
                    setThread,
                    (error) => toast.error(error),
                    () => toast.success("Thread loaded successfully")
                );
            } catch (err) {
                toast.error("An unexpected error occurred while loading thread");
            }
        };
        fetchThread();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!thread?.thread_id) return;

        const updatedThread: NewThread = {
            category_id: thread.category_id,
            thread_id: thread.thread_id,
            thread_name: thread.thread_name.trim(),
            description: thread.description.trim()
        };

        try {
            setFormLoading(true);
            await requestThread.handleUpdateThread(
                thread.thread_id,
                updatedThread,
                (error) => toast.error(error),
                (success) => toast.success(success),
                () => {
                    toast.success("Thread updated successfully!");
                    navigate(`/forum/threads/${thread.thread_id}`);
                }
            );
        } catch (err) {
            toast.error("Failed to update thread. Please try again.");
        } finally {
            setFormLoading(false);
        }
    };

    const handleInputChange = (field: keyof NewThread, value: string | number) => {
        if (!thread) return;
        setThread({ ...thread, [field]: value });
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
                    <p>Loading thread information...</p>
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
                    <h1 className={styles.pageTitle}>Update Thread</h1>
                    <p className={styles.pageSubtitle}>Edit your thread content below</p>
                </div>

                {thread ? (
                    <div className={styles.forumCard}>
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
                                    {thread.description.length}/200 characters
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
                                    disabled={formLoading}
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