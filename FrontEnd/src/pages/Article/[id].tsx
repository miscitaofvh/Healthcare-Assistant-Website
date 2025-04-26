import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getArticleById } from "../../utils/service/article";
import Navbar from "../../components/Navbar";
import styles from "./ArticleDetail.module.css";

interface Article {
  article_id: number;
  title: string;
  content: string;
  image_url?: string;
  author_id?: number;
  author_name?: string;
  publication_date?: string;
}

const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArticleDetail = async () => {
      try {
        const response = await getArticleById(Number(id));
        setArticle(response.data);
      } catch (error) {
        console.error("Failed to fetch article detail:", error);
      }
    };

    fetchArticleDetail();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  if (!article) {
    return (
      <div className={styles.loading}>
        Loading article...
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className={styles.container}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>← Back</button>

        {article.image_url && (
          <img src={article.image_url} alt={article.title} className={styles.image} />
        )}

        <h1 className={styles.title}>{article.title}</h1>
        
        <div className={styles.meta}>
          <span className={styles.author}>{article.author_name || "Unknown Author"}</span> •
          <span className={styles.date}>{article.publication_date || "Unknown Date"}</span>
        </div>

        <div className={styles.content}>
          {article.content}
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;
