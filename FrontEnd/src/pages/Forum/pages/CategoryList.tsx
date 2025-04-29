import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import styles from "../styles/Forum.module.css";
import {
  loadCategories, handleCreateCategory, handleUpdateCategory,
  handleDeleteCategory, handleInputChange
} from "../../../utils/service/Forum/category";
import { Category, NewCategory } from "../../../types/forum";

const CategoryList: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [newCategory, setNewCategory] = useState<NewCategory>({
    category_name: "",
    description: "",
  });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCategories(setLoading, setCategories, setError, setSuccess);
  }, []);

  return (
    <div>
      <div className={styles.main_navbar}>
        <Navbar />
      </div>
      <div className={styles.container}>
        <h1 className={styles.text_center}>Manage Categories</h1>

        {error && <div className={styles.alert}>{error}</div>}
        {success && <div className={styles.alertSuccess}>{success}</div>}

        {/* Create Category Form */}
        <div className={styles.card}>
          <h2>Create New Category</h2>
          <form onSubmit={(e) => {
            e.preventDefault(); 
            handleCreateCategory(newCategory, setFormLoading, setError, setSuccess, () =>
              loadCategories(setLoading, setCategories, setError, setSuccess))
          }}>
            <div className={styles.formGroup}>
              <label htmlFor="categoryName">Category Name</label>
              <input
                type="text"
                id="categoryName"
                value={newCategory.category_name}
                onChange={(e) => setNewCategory({ ...newCategory, category_name: e.target.value })}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="categoryDescription">Description</label>
              <textarea
                id="categoryDescription"
                value={newCategory.description || ""}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              />
            </div>
            <button type="submit" className={styles.btnPrimary} disabled={formLoading}>
              {formLoading ? "Creating..." : "Create Category"}
            </button>
          </form>
        </div>
        {/* Categories List */}
        <div className={styles.card}>
          <h2>Categories</h2>
          {loading ? (
            <div className={styles.text_center}>
              <p>Loading categories...</p>
            </div>
          ) : categories.length > 0 ? (
            <ul className={styles.listGroup}>
              {categories.map((category) => (
                <li key={category.category_id} className={styles.listGroupItem}>
                  <h3>{category.category_name}</h3>
                  <p>{category.description}</p>
                  <div className={styles.btnGroup}>
                    <button
                      className={styles.btnPrimary}
                      onClick={() => setEditingCategory(category)}
                    >
                      Edit
                    </button>
                    <button
                      className={styles.btnDanger}
                      onClick={() => handleDeleteCategory(category.category_id, setFormLoading, setError, setSuccess, () => loadCategories(setLoading, setCategories, setError, setSuccess))}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No categories available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryList;