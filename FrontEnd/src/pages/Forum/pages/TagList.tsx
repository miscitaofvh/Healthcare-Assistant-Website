import React, { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar";
import styles from "../styles/Forum.module.css";
import {
  loadTags,
  handleCreateTag,
  handleUpdateTag,
  handleDeleteTag,
} from "../../../utils/service/Forum/tag";
import { Tag, NewTag } from "../../../types/forum";

const TagPage: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [newTag, setNewTag] = useState<NewTag>({ tag_name: "" });
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formLoading, setFormLoading] = useState<boolean>(false);

  useEffect(() => {
    loadTags(setLoading, setTags, setError, setSuccess);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTag) {
      handleUpdateTag(editingTag.tag_id, newTag, setFormLoading, setError, setSuccess, () => {
        setEditingTag(null);
        setNewTag({ tag_name: "" });
        loadTags(setLoading, setTags, setError, setSuccess);
      });
    } else {
      handleCreateTag(newTag, setFormLoading, setError, setSuccess, () => {
        setNewTag({ tag_name: "" });
        loadTags(setLoading, setTags, setError, setSuccess);
      });
    }
  };

  return (
    <div>
      <div className={styles.main_navbar}>
        <Navbar />
      </div>
      <div className={styles.container}>
        <h1 className={styles.text_center}>Manage Tags</h1>

        {error && <div className={styles.alert}>{error}</div>}
        {success && <div className={styles.alertSuccess}>{success}</div>}

        {/* Create or Update Tag Form */}
        <div className={styles.card}>
          <h2>{editingTag ? "Edit Tag" : "Create New Tag"}</h2>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="tagName">Tag Name</label>
              <input
                type="text"
                id="tagName"
                value={newTag.tag_name}
                onChange={(e) => setNewTag({ tag_name: e.target.value })}
                required
              />
            </div>
            <button type="submit" className={styles.btnPrimary} disabled={formLoading}>
              {formLoading ? (editingTag ? "Updating..." : "Creating...") : (editingTag ? "Update Tag" : "Create Tag")}
            </button>
            {editingTag && (
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => {
                  setEditingTag(null);
                  setNewTag({ tag_name: "" });
                }}
              >
                Cancel
              </button>
            )}
          </form>
        </div>

        {/* Tag List */}
        <div className={styles.card}>
          <h2>Tags</h2>
          {loading ? (
            <div className={styles.text_center}>
              <p>Loading tags...</p>
            </div>
          ) : tags.length > 0 ? (
            <ul className={styles.listGroup}>
              {tags.map((tag) => (
                <li key={tag.tag_id} className={styles.listGroupItem}>
                  <h3>{tag.tag_name}</h3>
                  <div className={styles.btnGroup}>
                    <button
                      className={styles.btnPrimary}
                      onClick={() => {
                        setEditingTag(tag);
                        setNewTag({ tag_name: tag.tag_name });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className={styles.btnDanger}
                      onClick={() =>
                        handleDeleteTag(tag.tag_id, setFormLoading, setError, setSuccess, () =>
                          loadTags(setLoading, setTags, setError, setSuccess)
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>
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

export default TagPage;
