import React, { useEffect, useState } from "react";
import { getCategories, getArticles, createArticle, deleteArticle, getCategoryById, getArticleById, updateArticle } from "../../utils/service/article";
import { useNavigate } from "react-router-dom";
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [newArticle, setNewArticle] = useState({
    title: "",
    content: "",
    image_url: "",
    category_name: "", // Add category_name to newArticle state
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    fetchArticles();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await getCategories();
      setCategories(response.data);
    } catch (error) {
      setError("Không thể tải danh mục.");
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await getArticles();
      setArticles(response.data);
    } catch (error) {
      setError("Không thể tải bài viết.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Add category_name to the article data
      const response = await createArticle({
        ...newArticle,
        category_name: newArticle.category_name, // Pass category_name as part of the article data
      });
      setShowModal(false);
      setNewArticle({ title: "", content: "", image_url: "", category_name: "" }); // Clear category_name
      fetchArticles();
    } catch (error) {
      setError("Không thể tạo bài viết.");
    }
  };

  const handleDeleteArticle = async (id: number) => {
    try {
      await deleteArticle(id.toString());
      fetchArticles();
    } catch (error) {
      setError("Không thể xóa bài viết.");
    }
  };

  return (
    <div>
      <Navbar />
      <div className={styles.container}>
        <h1 className={styles.text_center}>Healthcare News</h1>
        <button onClick={() => setShowModal(true)} className={styles.btn_primary}>
          + Create New Article
        </button>
        <div className={styles.row}>
          <div className={styles.col_md_3}>
            <h4>Categories</h4>
            <ul className={styles.list_group}>
              <li
                className={`${styles.list_group_item} ${!selectedCategory ? "active" : ""}`}
                onClick={() => setSelectedCategory(null)}
              >
                All Articles
              </li>
              {categories.map((category) => (
                <li
                  key={category.category_id}
                  className={styles.list_group_item}
                  onClick={() => setSelectedCategory(category.category_id)}
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
                        <img src={article.image_url} className={styles.card_img_top} alt={article.title} />
                      )}
                      <div className={styles.card_body}>
                        <h5 className={styles.card_title}>{article.title}</h5>
                        <p className={styles.card_text}>{article.content.substring(0, 100)}...</p>
                        <button
                          className={styles.btn_primary}
                          onClick={() => navigate(`/article/${article.article_id}`)}
                        >
                          Read More
                        </button>
                        <button
                          className={styles.btn_danger}
                          onClick={() => handleDeleteArticle(article.article_id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {showModal && (
          <div className={styles.modal_overlay}>
            <div className={styles.modal_content}>
              <h2>Create New Article</h2>
              <form onSubmit={handleCreateArticle}>
                <input
                  type="text"
                  placeholder="Title"
                  value={newArticle.title}
                  onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                  required
                />
                <textarea
                  placeholder="Content"
                  value={newArticle.content}
                  onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Image URL"
                  value={newArticle.image_url}
                  onChange={(e) => setNewArticle({ ...newArticle, image_url: e.target.value })}
                />

                <input
                  type="text"
                  placeholder="Enter Category Name"
                  value={newArticle.category_name}
                  onChange={(e) => setNewArticle({ ...newArticle, category_name: e.target.value })}
                  required
                />

                <button type="submit" className={styles.btn_primary}>
                  Submit
                </button>
                <button onClick={() => setShowModal(false)} className={styles.btn_secondary}>
                  Cancel
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthcareNews;
