import React, { useState } from "react";
import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { handleCreateTag } from "../../../../utils/service/Forum/tag";
import { NewTag } from "../../../../types/forum";
import { useNavigate } from "react-router-dom";

const CreateTag: React.FC = () => {
    const [newTag, setNewTag] = useState<NewTag>({ tag_name: "", description: "" });
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleCreateTag(newTag, setFormLoading, setError, setSuccess, () => {
            navigate("/forum/tags");
        });
    };

    return (
        <div>
            <div className={styles.main_navbar}>
                <Navbar />
            </div>
            <div className={styles.container}>
                <h1 className={styles.text_center}>Create New Tag</h1>

                {error && <div className={styles.alert}>{error}</div>}
                {success && <div className={styles.alertSuccess}>{success}</div>}

                <div className={styles.card}>
                    <form onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <label htmlFor="tagName">Tag Name</label>
                            <input
                                type="text"
                                id="tagName"
                                value={newTag.tag_name}
                                onChange={(e) =>
                                    setNewTag({ ...newTag, tag_name: e.target.value })
                                }
                                required
                            />
                            <label htmlFor="tagDescription">Tag Description</label>
                            <input
                                type="text"
                                id="tagDescription"
                                value={newTag.description}
                                onChange={(e) =>
                                    setNewTag({ ...newTag, description: e.target.value })
                                }
                                required
                            />
                        </div>
                        <button type="submit" className={styles.btnPrimary} disabled={formLoading}>
                            {formLoading ? "Creating..." : "Create Tag"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateTag;