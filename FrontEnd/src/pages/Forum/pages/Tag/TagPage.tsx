import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { PostbyTag, Tag } from "../../../../types/forum";
import { loadTagandPostsByTag } from "../../../../utils/service/Forum/tag";

const TagPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [tag, setTag] = useState<Tag | null>(null);
    const [posts, setPosts] = useState<PostbyTag[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [success, setSuccess] = useState<string>("");
    const [error, setError] = useState<string>("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            if (!id) {
                setError("Invalid tag ID.");
                setLoading(false);
                return;
            }

            try {
                loadTagandPostsByTag(id, setLoading, setTag, setPosts, setError, setSuccess);
            } catch (err: any) {
                setError("An unexpected error occurred while loading the tag and posts.");
            }
        };

        fetchData();
    }, [id]);

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(""), 2000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(""), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    return (
        <div className={styles.forumContainer}>
            <div className={styles.main_navbar}>
                <Navbar />
            </div>

            <div className={styles.tagListContainer}>
                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                        <p>Loading tag...</p>
                    </div>
                ) : tag ? (
                    <div>
                        {/* Tag Header Section */}
                        <div className={styles.headerSection}>
                            <h1 className={styles.pageTitle}>#{tag.tag_name}</h1>
                            <p className={styles.pageSubtitle}>{tag.description}</p>
                        </div>

                        {error && (
                            <div className={styles.errorAlert}>
                                <span className={styles.errorIcon}>⚠️</span> {error}
                            </div>
                        )}

                        {success && (
                            <div className={styles.alertSuccess}>
                                <span className={styles.successIcon}>✅</span> {success}
                            </div>
                        )}

                        {/* Tag Info Card */}
                        <div className={styles.tagCard}>
                            <div className={styles.tagMeta}>
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>Created by:</span>
                                    <span className={styles.metaValue}>{tag.created_by}</span>
                                </div>
                            </div>
                            <div className={styles.tagMeta}>
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>Created at:</span>
                                    <span className={styles.metaValue}>{new Date(tag.created_at).toLocaleString()}</span>
                                </div>
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>Last updated:</span>
                                    <span className={styles.metaValue}>{new Date(tag.last_updated).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className={styles.tagMeta}>
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>Usage:</span>
                                    <span className={styles.metaValue}>{tag.usage_count} posts</span>
                                </div>
                            </div>

                            <button
                                className={`${styles.primaryButton} ${styles.createButton}`}
                                onClick={() => navigate(`/forum/tags/${tag.tag_id}/update`)}
                            >
                                Update Tag
                            </button>
                        </div>

                        {/* Posts List */}
                        <div className={styles.headerSection}>
                            <h2 className={styles.pageTitle}>Posts with this Tag</h2>
                        </div>

                        {posts.length > 0 ? (
                            <div className={styles.tagGrid}>
                                {posts.map((post) => (
                                    <div key={post.post_id} className={styles.tagCard}>
                                        <h3 className={styles.tagName}>{post.title}</h3>
                                        <p className={styles.tagDescription}>{post.content.slice(0, 100)}...</p>

                                        <div className={styles.tagMeta}>
                                            <div className={styles.metaItem}>
                                                <span className={styles.metaLabel}>Category:</span>
                                                <span className={styles.metaValue}>{post.category_name}</span>
                                            </div>
                                            <div className={styles.metaItem}>
                                                <span className={styles.metaLabel}>Thread:</span>
                                                <span className={styles.metaValue}>{post.thread_name}</span>
                                            </div>
                                            <div className={styles.metaItem}>
                                                <span className={styles.metaLabel}>Author:</span>
                                                <span className={styles.metaValue}>{post.author}</span>
                                            </div>
                                            <div className={styles.metaItem}>
                                                <span className={styles.metaLabel}>Likes:</span>
                                                <span className={styles.metaValue}>{post.like_count}</span>
                                            </div>
                                        </div>

                                        <button
                                            className={styles.primaryButton}
                                            onClick={() => navigate(`/forum/posts/${post.post_id}`)}
                                        >
                                            View Post
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <p className={styles.emptyMessage}>No posts available for this tag.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <p className={styles.emptyMessage}>Tag not found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TagPage;