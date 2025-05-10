import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { handleCreateCategory } from "../../../../utils/service/Forum/category";
import { NewCategory } from "../../../../types/forum";

const CreateCategory: React.FC = () => {
    const [newCategory, setNewCategory] = useState<NewCategory>({
        category_name: "",
        description: "",
    });
    const [formLoading, setFormLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setFormLoading(true);
            await handleCreateCategory(
                newCategory,
                (error) => toast.error(error),
                () => {
                    toast.success("Category created successfully!");
                    navigate("/forum/categories");
                }
            );
        } catch (err) {
            toast.error("An unexpected error occurred while creating the category");
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
                    <h1 className={styles.pageTitle}>Create New Category</h1>
                    <p className={styles.pageSubtitle}>Add a new category to organize forum content</p>
                </div>

                <div className={styles.tagCard}>
                    <form onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <label htmlFor="categoryName" className={styles.metaLabel}>
                                Category Name *
                            </label>
                            <input
                                type="text"
                                id="categoryName"
                                className={styles.formInput}
                                value={newCategory.category_name}
                                onChange={(e) =>
                                    setNewCategory({ ...newCategory, category_name: e.target.value })
                                }
                                required
                                maxLength={50}
                                placeholder="Enter category name (required)"
                                disabled={formLoading}
                            />
                            <small className={styles.characterCount}>
                                {newCategory.category_name.length}/50 characters
                            </small>

                            <label htmlFor="categoryDescription" className={styles.metaLabel}>
                                Description
                            </label>
                            <textarea
                                id="categoryDescription"
                                className={styles.formTextarea}
                                value={newCategory.description || ""}
                                onChange={(e) =>
                                    setNewCategory({ ...newCategory, description: e.target.value })
                                }
                                maxLength={200}
                                placeholder="Enter category description (optional)"
                                rows={4}
                                disabled={formLoading}
                            />
                            <small className={styles.characterCount}>
                                {newCategory.description?.length || 0}/200 characters
                            </small>
                        </div>

                        <div className={styles.buttonGroup}>
                            <button
                                type="button"
                                className={styles.secondaryButton}
                                onClick={() => navigate("/forum/categories")}
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
                                    "Create Category"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateCategory;