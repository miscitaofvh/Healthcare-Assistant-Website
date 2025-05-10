import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import requestCategory from "../../../../utils/service/Forum/category";
import requestThread from "../../../../utils/service/Forum/thread";
import { NewThread, CategorySummary } from "../../../../types/forum";

const CreateThread: React.FC = () => {
    const [searchParams] = useSearchParams();
    const categoryIdFromUrl = searchParams.get('category');
    
    const [newThread, setNewThread] = useState<NewThread>({
        thread_id: 0,
        thread_name: "",
        description: "",
        category_id: categoryIdFromUrl ? parseInt(categoryIdFromUrl) : 0,
    });
    
    const [categories, setCategories] = useState<CategorySummary[]>([]);
    const [formLoading, setFormLoading] = useState(false);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setCategoriesLoading(true);
                await requestCategory.loadCategoriesSummary(
                    (categories) => setCategories(categories),
                    (error) => toast.error(error)
                );
            } catch (err) {
                toast.error("Failed to load categories");
            } finally {
                setCategoriesLoading(false);
            }
        };

        fetchCategories();
    }, []);

    // Rest of your component remains the same...
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setFormLoading(true);
            await requestThread.handleCreateThread(
                newThread,
                (error) => toast.error(error),
                (success) => toast.success(success),
                () => {
                    toast.success("Thread created successfully!");
                    navigate(`/forum/categories/${newThread.category_id}`);
                }
            );
        } catch (err) {
            toast.error("An unexpected error occurred while creating the thread");
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
                    <h1 className={styles.pageTitle}>Create New Thread</h1>
                    <p className={styles.pageSubtitle}>Start a new discussion in the forum</p>
                </div>

                <div className={styles.forumCard}>
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
                                {newThread.description?.length || 0}/5000 characters
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