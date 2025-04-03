import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom"; // If using React Router
import axios from "axios";
import Navbar from "../../components/Navbar";
import styles from "./Article.module.css";



const API_BASE_URL = "http://localhost:5000/api/article";

interface Article {
  article_id: number;
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
}

const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get<Article>(`${API_BASE_URL}/${id}`);
      setArticle(response.data);
    } catch (error) {
      setError("Không thể tải bài viết. Vui lòng thử lại sau.");
      console.error("Error fetching article:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center">Đang tải...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!article) return <div className="alert alert-warning">Không tìm thấy bài viết.</div>;

  return (
    <div className={styles.articleDetailContainer}>
      <Navbar />
      <div className="container mt-4">
        <h1 className="text-center">{article.title}</h1>
        <p className="text-muted text-center">{new Date(article.created_at).toLocaleDateString()}</p>
        {article.image_url && <img src={article.image_url} alt={article.title} className={styles.articleImage} />}
        <div className={styles.articleContent}>
          <p>{article.content}</p>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;
