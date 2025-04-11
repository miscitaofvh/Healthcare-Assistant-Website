import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import styles from "./Forum.module.css";
import { createPost } from "../../utils/service/forum";

const API_BASE_URL = "http://localhost:5000/api/forum";

const CreatePost: React.FC = () => {
  const [categoryName, setCategoryName] = useState<string>("");
  const [threadName, setThreadName] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const postData = {
        category_name: categoryName,
        thread_name: threadName,
        content,
        image_url: imageUrl || null,
      };

      const response = await createPost(postData);
      alert(response.data.message);

      navigate("/forum");
    } catch (err) {
      console.error("Lỗi khi tạo bài viết:", err);
      setError("Không thể tạo bài viết. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className={styles.main_navbar}>
        <Navbar />
      </div>
      <div className={styles.container}>
        <h2 className={styles.text_center}>Tạo Bài Viết Mới</h2>
        {error && <div className={styles.alert}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group mb-3">
            <label htmlFor="categoryName">Category Name</label>
            <input
              type="text"
              id="categoryName"
              className="form-control"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
            />
          </div>
          <div className="form-group mb-3">
            <label htmlFor="threadName">Thread Name</label>
            <input
              type="text"
              id="threadName"
              className="form-control"
              value={threadName}
              onChange={(e) => setThreadName(e.target.value)}
              required
            />
          </div>
          <div className="form-group mb-3">
            <label htmlFor="content">Nội dung</label>
            <textarea
              id="content"
              className="form-control"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              required
            ></textarea>
          </div>
          <div className="form-group mb-3">
            <label htmlFor="imageUrl">Hình ảnh (URL, không bắt buộc)</label>
            <input
              type="text"
              id="imageUrl"
              className="form-control"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.png"
            />
          </div>
          <div className="d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/forum")}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Đang tạo..." : "Tạo bài viết"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
