import React, { useState } from "react";
import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { handleCreateCategory } from "../../../../utils/service/Forum/category";
import { NewCategory } from "../../../../types/forum";
import { useNavigate } from "react-router-dom";

const CreateCategory: React.FC = () => {
    const [newCategory, setNewCategory] = useState<NewCategory>({
        category_name: "",
        description: "",
    });
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();

    const validateInputs = (category: NewCategory): string | null => {
        const categoryName = category.category_name.trim();
        let description = category.description?.trim() || "";
        if (!categoryName) return "Category name is required";
        if (categoryName.length < 3 || categoryName.length > 50) return "Category name must be from 3 to 50 characters";
        if (description && (description.length < 10 || description.length > 200)) {
            return "Description must be from 10 to 200 characters long";
        }
        return null;
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationError = validateInputs(newCategory);
        if (validationError) {
            setError(validationError);
            return;
        }
        try {
            await handleCreateCategory(
                newCategory,
                setFormLoading,
                setError,
                setSuccess,
                () => navigate("/forum/categories")
            );
        }
        catch (err) {
            setError("An unexpected error occurred while creating the category");
        }
    };

    return (
        <div className={styles.forumContainer}>
            <div className={styles.main_navbar}>
                <Navbar />
            </div>

            <div className={styles.tagListContainer}>
                <div className={styles.headerSection}>
                    <h1 className={styles.pageTitle}>Create New Category</h1>
                    <p className={styles.pageSubtitle}>Add a new category to organize forum content</p>
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