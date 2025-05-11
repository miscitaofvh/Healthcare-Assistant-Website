import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import requestCategory from "../../../../utils/service/Forum/category";
import { Category, NewCategory } from "../../../../types/Forum/category";

const UpdateCategory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        await requestCategory.loadCategorieById(
          parseInt(id || ""),
          setInitialLoad,
          setCategory,
          (error) => toast.error(error),
          () => {
            toast.success("Category loaded successfully");
          }
        );
      } catch (err) {
        toast.error("An unexpected error occurred while loading category");
      }
    };

    fetchCategory();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category?.category_id) return;

    const updatedCategory: NewCategory = {
      category_name: category.category_name.trim(),
      description: category.description?.trim() || "",
    };

    try {
      setFormLoading(true);
      await requestCategory.handleUpdateCategory(
        category.category_id,
        updatedCategory,
        (error) => toast.error(error),
        (success) => toast.success(success),
        () => {
          navigate(`/forum/categories/${category.category_id}`);
        }
      );
    } catch (err) {
      toast.error("An unexpected error occurred while updating the category");
    } finally {
      setFormLoading(false);
    }
  };

  const handleInputChange = (field: keyof Category, value: string) => {
    if (!category) return;
    setCategory({ ...category, [field]: value });
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
          <p>Loading category information...</p>
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
          <h1 className={styles.pageTitle}>Update Category</h1>
          <p className={styles.pageSubtitle}>Modify your category details below</p>
        </div>

        {category ? (
          <div className={styles.forumCard}>
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
                  disabled={formLoading}
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
                  disabled={formLoading}
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