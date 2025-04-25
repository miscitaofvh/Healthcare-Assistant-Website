import React, { useEffect, useState } from "react";
import { getCategories, getArticles, createArticle, deleteArticle, getCategoryById, getArticleById, getTagByArticle } from "../../utils/service/article";
import { useNavigate, useSearchParams  } from "react-router-dom";
import Navbar from "../../components/Navbar";

import styles from "./Article.module.css";

interface Article {
  article_id: number;
  title: string;
  content: string;
  image_url?: string;
  author_id?: number;
  author_name?: string;
  category_id?: number;
  category_name?: string;
  tag_name?: string[]; 
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  publication_date?: string;
  last_updated?: string;
}

const HealthcareNews: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = parseInt(searchParams.get("page") || "1");
  const [page, setPage] = useState<number>(pageParam);
  const navigate = useNavigate();

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
  
  useEffect(() => {
    fetchArticle();
  }, [page]);
  
  return (
    <div>
      <Navbar />
      <div className={styles.wrapper}>
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
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${article.author_name}`}
                    alt="avatar"
                    className={styles.avatar}
                  />
                  <div>
                    <span className={styles.author}>{article.author_name}</span><br />
                    <span className={styles.date}>{article.publication_date}</span>
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
          <button onClick={() => updatePage(page + 1)}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
};


export default HealthcareNews;