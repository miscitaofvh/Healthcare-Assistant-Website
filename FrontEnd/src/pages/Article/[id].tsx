import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getArticleById } from "../../utils/service/article";
import Navbar from "../../components/Navbar";

import styles from "./Article.module.css";

interface Article {
  article_id: number;
  title: string;
  content: string;
  author_id?: string;
  author_name?: string;
  tag_id?: number;
  category_id?: number;
  publication_date?: string;
  last_updated?: string;
  image_url?: string;
}

const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getArticleById(id || "");

      if (Array.isArray(response.data) && response.data.length > 0) {
        setArticle(response.data[0]);
      } else {
        setError("Bài viết không tồn tại.");
      }
    } catch (error) {
      setError("Không thể tải bài viết. Vui lòng thử lại sau.");
      console.error("Error fetching article:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className={styles.container}>
        {loading ? (
          <div className={styles.text_center}>Đang tải...</div>
        ) : error ? (
          <div className={styles.alert}>{error}</div>
        ) : article ? (
          <div className={styles.article_detail}>
            <h1 className={styles.text_center}>{article.title}</h1>
            {article.publication_date && (
              <p className={styles.text_center}>
                {new Date(article.publication_date).toLocaleDateString()}
              </p>
            )}
            {article.image_url && (
              <img
                src={article.image_url}
                alt={article.title}
                className={styles.article_image}
              />
            )}
            <div className={styles.article_content}>
              <p>{article.content}</p>
            </div>
          </div>
        ) : (
          <div className={styles.alert}>Không tìm thấy bài viết.</div>
        )}
      </div>
    </div>
  );
};

export default ArticleDetail;
