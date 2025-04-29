import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { handleUpdateTag, loadTags } from "../../../../utils/service/Forum/tag";
import { Tag, NewTag } from "../../../../types/forum";

const UpdateTag: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tag, setTag] = useState<Tag | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadTags(
      () => {},
      (tags: Tag[]) => {
        const found = tags.find((t) => t.tag_id === parseInt(id || ""));
        if (found) {
          setTag(found);
        } else {
          setError("Tag not found");
        }
      },
      setError,
      () => {}
    );
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tag) {
      const updatedTag: NewTag = {
        tag_name: tag.tag_name,
        description: tag.description || undefined, // Convert null to undefined
      };
      handleUpdateTag(tag.tag_id, updatedTag, setFormLoading, setError, setSuccess, () => {
        navigate("/forum/tags");
      });
    }
  };

  return (
    <div>
      <div className={styles.main_navbar}>
        <Navbar />
      </div>
      <div className={styles.container}>
        <h1 className={styles.text_center}>Update Tag</h1>

        {error && <div className={styles.alert}>{error}</div>}
        {success && <div className={styles.alertSuccess}>{success}</div>}

        {tag && (
          <div className={styles.card}>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="tagName">Tag Name</label>
                <input
                  type="text"
                  id="tagName"
                  value={tag.tag_name}
                  onChange={(e) => setTag({ ...tag, tag_name: e.target.value })}
                  required
                />
                <label htmlFor="tagDescription">Tag Description</label>
                <input
                  type="text"
                  id="tagDescription"
                  value={tag.description || ""} // Handle null by defaulting to an empty string
                  onChange={(e) => setTag({ ...tag, description: e.target.value })}
                />
              </div>
              <button type="submit" className={styles.btnPrimary} disabled={formLoading}>
                {formLoading ? "Updating..." : "Update Tag"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateTag;