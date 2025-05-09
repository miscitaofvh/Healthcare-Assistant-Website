import React, { useEffect, useState } from "react";
import { getArticles, createArticle } from "../../utils/service/article";
import { useAuth } from "../../contexts/AuthContext";
import { formatTimeAgo } from "../../utils/format/date";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import Navbar from "../../components/Navbar";
import styles from "./Article.module.css";

interface Article {
  article_id: number;
  title: string;
  content: string;
  image_url?: string;
  author_id?: number;
  author_name?: string;
  category_name?: string;
  tag_name?: string[];
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  publication_date?: string;
  last_updated?: string;
}

const HealthcareNews: React.FC = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = parseInt(searchParams.get("page") || "1");
  const [page, setPage] = useState<number>(pageParam);
  const navigate = useNavigate();
  const location = useLocation();

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category_name: "",
    tag_names: "",
    image_url: "",
  });

  const updatePage = (newPage: number) => {
    setPage(newPage);
    setSearchParams({ page: String(newPage) });
  };

  const fetchArticle = async () => {
    try {
      const response = await getArticles(page);
      setArticles(response.data);
    } catch (error) {
      console.error("Failed to fetch articles:", error);
    }
  };

  const handleCreateArticle = async () => {
    try {
      const newArticle = {
        title: formData.title,
        content: formData.content,
        category_name: formData.category_name,
        tag_name: formData.tag_names
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        image_url: formData.image_url,
      };
      await createArticle(newArticle);
      setShowModal(false);
      setFormData({
        title: "",
        content: "",
        category_name: "",
        tag_names: "",
        image_url: "",
      });
      fetchArticle();
    } catch (error) {
      console.error("Tạo bài báo thất bại:", error);
    }
  };

  useEffect(() => {
    const isFirstPageURL =
      location.pathname === "/article" && !searchParams.has("page");
    if (isFirstPageURL && page !== 1) {
      setPage(1);
      setSearchParams({}, { replace: true });
    }
  }, [location.pathname, location.key]);

  useEffect(() => {
    fetchArticle();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  return (
    <div>
      <Navbar />

      <div className={styles.wrapper}>
        {user?.role === "Admin" && (
          <div className={styles.createButtonWrapper}>
            <button
              className={styles.createButton}
              onClick={() => setShowModal(true)}
            >
              Tạo bài báo mới
            </button>
          </div>
        )}

        <div className={styles.grid}>
          {articles.map((article) => (
            <div
              key={article.article_id}
              className={styles.card}
              onClick={() => navigate(`/article/${article.article_id}`)}
            >
              <img
                src={article.image_url}
                alt={article.title}
                className={styles.image}
              />
              <div className={styles.cardContent}>
                <h2 className={styles.title}>{article.title}</h2>
                <p className={styles.description}>
                  {article.content.slice(0, 100)}...
                </p>
                <div className={styles.meta}>
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                    alt="avatar"
                    className={styles.avatar}
                  />
                  <div>
                    <span className={styles.author}>{article.author_name}</span>
                    <br />
                    <span className={styles.date}>
                      {formatTimeAgo(article.last_updated || "")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.pagination}>
          <button onClick={() => updatePage(page - 1)} disabled={page === 1}>
            Previous
          </button>
          <span>Page {page}</span>
          <button onClick={() => updatePage(page + 1)}>Next</button>
        </div>
      </div>

      {/* Modal tạo bài báo */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Tạo bài báo mới</h2>

            <label>Tiêu đề</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />

            <label>Nội dung</label>
            <textarea
              rows={5}
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
            />

            <label>Danh mục (category_name)</label>
            <input
              type="text"
              value={formData.category_name}
              onChange={(e) =>
                setFormData({ ...formData, category_name: e.target.value })
              }
            />

            <label>Tags (phân cách bằng dấu phẩy)</label>
            <input
              type="text"
              value={formData.tag_names}
              onChange={(e) =>
                setFormData({ ...formData, tag_names: e.target.value })
              }
            />

            <label>URL Hình ảnh</label>
            <input
              type="text"
              value={formData.image_url}
              onChange={(e) =>
                setFormData({ ...formData, image_url: e.target.value })
              }
            />

            <div className={styles.modalActions}>
              <button onClick={() => setShowModal(false)}>Hủy</button>
              <button onClick={handleCreateArticle}>Tạo bài báo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthcareNews;
