import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { handleUpdateCategory, loadCategorieById } from "../../../../utils/service/Forum/category";
import { Category, NewCategory } from "../../../../types/forum";

const UpdateCategory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [initialLoad, setInitialLoad] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        await loadCategorieById(parseInt(id || ""), setInitialLoad, setCategory, setError, () => { });
      } catch {
        setError("An unexpected error occurred");
      }
    };

    fetchCategory();
  }, [id]);

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
    if (!category?.category_id) return;

    const updatedCategory: NewCategory = {
      category_name: category.category_name.trim(),
      description: category.description?.trim() || undefined,
    };

    const validationError = validateInputs(updatedCategory);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await handleUpdateCategory(
        category.category_id,
        updatedCategory,
        setFormLoading,
        setError,
        setSuccess,
        () => navigate("/forum/categories")
      );
    } catch (err) {
      setError("An unexpected error occurred while updating the category");
    }
  };

  const handleInputChange = (field: keyof Category, value: string) => {
    if (!category) return;
    setError("");
    setSuccess("");
    setCategory({ ...category, [field]: value });
  };

  if (initialLoad) {
    return (
      <div className={styles.forumContainer}>
        <div className={styles.main_navbar}>
          <Navbar />
        </div>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading category information...</p>
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
          <h1 className={styles.pageTitle}>Update Category</h1>
          <p className={styles.pageSubtitle}>Modify your category details below</p>
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

        {category ? (
          <div className={styles.tagCard}>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="categoryName" className={styles.metaLabel}>
                  Category Name *
                </label>
                <input
                  id="categoryName"
                  className={styles.formInput}
                  value={category.category_name}
                  onChange={(e) => handleInputChange("category_name", e.target.value)}
                  required
                  maxLength={50}
                  placeholder="Enter category name (required)"
                />
                <small className={styles.characterCount}>
                  {category.category_name.length}/50 characters
                </small>

                <label htmlFor="categoryDescription" className={styles.metaLabel}>
                  Description
                </label>
                <textarea
                  id="categoryDescription"
                  className={styles.formTextarea}
                  value={category.description || ""}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  maxLength={200}
                  placeholder="Enter category description (optional)"
                  rows={4}
                />
                <small className={styles.characterCount}>
                  {(category.description?.length || 0)}/200 characters
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
                <button type="submit" className={styles.primaryButton} disabled={formLoading}>
                  {formLoading ? (
                    <>
                      <span className={styles.spinnerSmall}></span>
                      Updating...
                    </>
                  ) : (
                    "Update Category"
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyMessage}>Category not found</p>
            <button
              className={styles.primaryButton}
              onClick={() => navigate("/forum/categories")}
            >
              Back to Categories
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateCategory;
