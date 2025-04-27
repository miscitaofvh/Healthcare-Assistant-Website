// This page will display a category and allow users to navigate to the associated threads.// src/components/Forum/pages/CategoryDetailPage.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import styles from "../styles/Forum.module.css";
import { CategoryResponse } from "../../../types/forum";
import { loadSingleCategory } from "../../../utils/service/Forum/category"; // You'll need to create this service function

const CategoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [category, setCategory] = useState<CategoryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (id) {
      loadSingleCategory(id, setLoading, setCategory, setError);
    }
  }, [id]);

  return (
    <div>
      <div className={styles.main_navbar}>
        <Navbar />
      </div>
      <div className={styles.container}>
        {loading ? (
          <p>Loading category...</p>
        ) : error ? (
          <div className={styles.alert}>{error}</div>
        ) : category ? (
          <div className={styles.card}>
            <h1>{category.category_name}</h1>
            <p>{category.description}</p>
          </div>
        ) : (
          <p>Category not found.</p>
        )}
      </div>
    </div>
  );
};

export default CategoryDetailPage;