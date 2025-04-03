import React, { useEffect, useState } from "react";
import { getCategories, getCategoryById, getArticles, getArticleById } from "../../utils/service/article";
// import { useModal } from "../../contexts/Modalcontext";
const API_BASE_URL = "http://localhost:5000/api/article";
import Navbar from "../../components/Navbar";
import styles from "./Article.module.css";
interface Category {
  category_id: number;
  category_name: string;
}

interface Article {
  article_id: number;
  title: string;
  content: string;
  image_url?: string;
}

const HealthcareNews: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchCategories();
    fetchArticles();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getCategories();
      setCategories(response.data);
    } catch (error) {
      setError("Không thể tải danh mục. Vui lòng thử lại sau.");
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getArticles();
      setArticles(response.data);
    } catch (error) {
      setError("Không thể tải bài viết. Vui lòng thử lại sau.");
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticleById = async (id: number | null) => {
    try {
      const response = await getArticleById(id?.toString() || "");
      setSelectedArticle(response.data);
    } catch (error) {
      setError("Không thể tải bài viết. Vui lòng thử lại sau.");
      console.error("Error fetching article:", error);
    }
  };

  const fetchCategoryById = async (id: number | null) => {
    try {
      const response = await getCategoryById(id?.toString() || "");
      setSelectedCategory(response.data);
    } catch (error) {
      setError("Không thể tải danh mục. Vui lòng thử lại sau.");
      console.error("Error fetching category:", error);
    }
  };

  const handleCategoryClick = (categoryId: number | null) => {
    try {
      setSelectedCategory(categoryId);
      if (categoryId !== null) {
        fetchCategoryById(categoryId);
      }
    } catch (error) {
      setError("Không thể tải bài viết. Vui lòng thử lại sau.");
      console.error("Error fetching articles:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.main_navbar}>
        <Navbar />
      </div>

      <div className={styles.container}>
        <h1 className={styles.text_center} mb-4>Healthcare News</h1>
        <div className={styles.row}>
          <div className={styles.col_md_3}>
            <h4>Categories</h4>
            <ul className={styles.list_group}>
              <li
                className={`${styles.list_group_item} ${!selectedCategory ? "active" : ""}`}
                onClick={() => handleCategoryClick(null)}
                style={{ cursor: "pointer" }}
              >
                All Articles
              </li>
              {categories.map((category) => (
                <li
                  key={category.category_id}
                  className={`list-group-item ${selectedCategory === category.category_id ? "active" : ""
                    }`}
                  onClick={() => handleCategoryClick(category.category_id)}
                  style={{ cursor: "pointer" }}
                >
                  {category.category_name}
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.col_md_9}>
            <h4>Articles</h4>
            {articles.length === 0 ? (
              <div className={styles.alert}>Không có bài viết nào.</div>
            ) : (
              <div className={styles.row}>
                {articles.map((article) => (
                  <div className={styles.col_md_4} key={article.article_id}>
                    <div className={styles.card}>
                      {article.image_url && (
                        <img
                          src={article.image_url}
                          className={styles.card_img_top}
                          alt={article.title}
                          style={{ height: "200px", objectFit: "cover" }}
                        />
                      )}
                      <div className={styles.card_body}>
                        <h5 className={styles.card_title}>{article.title}</h5>
                        <p className={styles.card_text}>
                          {article.content.substring(0, 100)}...
                        </p>
                        <a href={`/article/${article.article_id}`} className={styles.btn_primary}>
                          Read More
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthcareNews;
