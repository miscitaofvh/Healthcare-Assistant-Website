import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ import here
import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { loadTags } from "../../../../utils/service/Forum/tag";
import { Tag } from "../../../../types/forum";

const TagList: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const navigate = useNavigate(); // ✅ called here, not inside handleClick

  useEffect(() => {
    loadTags(setLoading, setTags, setError, () => { });
  }, []);

  const handleClick = (tagId: number) => {
    navigate(`/forum/tags/${tagId}`);
  };

  return (
    <div>
      <div className={styles.main_navbar}>
        <Navbar />
      </div>
      <div className={styles.container}>
        <h1 className={styles.text_center}>All Tags</h1>

        <button
          className={styles.btnSecondary}
          onClick={() => navigate(`/forum/tags/create`)}
        >
          Create New Tag
        </button>

        {error && <div className={styles.alert}>{error}</div>}

        <div className={styles.card}>
          {loading ? (
            <p className={styles.text_center}>Loading tags...</p>
          ) : tags.length > 0 ? (
            <ul className={styles.listGroup}>
              {tags.map((tag) => (
                <li
                  key={tag.tag_id}
                  className={styles.listGroupItem}
                  onClick={() => handleClick(tag.tag_id)}
                  style={{ cursor: "pointer" }}
                >
                  <h3>{tag.tag_name}</h3>
                </li>
              ))}
            </ul>
          ) : (
            <p>No tags available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TagList;
