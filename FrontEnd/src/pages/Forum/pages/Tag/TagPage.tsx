import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../../../components/Navbar";
import styles from "../../styles/Forum.module.css";
import { PostSummary, Tag } from "../../../../types/forum";
import { loadPostsByTag, loadTagById } from "../../../../utils/service/Forum/tag";

const TagPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [tag, setTag] = useState<Tag | null>(null);
    const [posts, setPosts] = useState<PostSummary[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
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
                setLoading(true);
                loadTagById(id, setLoading, setTag, setError);
                loadPostsByTag(id, setLoading, setTag, setPosts, setError);
            } catch (err: any) {
                console.error("Error fetching tag data:", err);
                setError("Failed to load tag data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    return (
        <div>
            <div className={styles.main_navbar}>
                <Navbar />
            </div>
            <div className={styles.container}>
                {loading ? (
                    <p>Loading tag...</p>
                ) : error ? (
                    <div className={styles.alert}>{error}</div>
                ) : tag ? (
                    <div>
                        <div className={styles.card}>
                            <h1>#{tag.tag_name}</h1>
                            <p>{tag.description}</p>
                            <p>Used in {tag.usage_count} posts</p>

                            <button
                                className={styles.btnSecondary}
                                onClick={() => navigate(`/forum/tags/update/${tag.tag_id}`)}
                            >
                                Update Tag
                            </button>
                        </div>


                        {/* Posts List */}
                        <div className={styles.card}>
                            <h2>Posts with this Tag</h2>
                            {posts.length > 0 ? (
                                <ul className={styles.listGroup}>
                                    {posts.map((post) => (
                                        <li key={post.post_id} className={styles.listGroupItem}>
                                            <h3>{post.title}</h3>
                                            <p>{post.content.slice(0, 100)}...</p>
                                            <p>By: {post.author}</p>
                                            <p>Likes: {post.like_count}</p>
                                            <button
                                                className={styles.btnPrimary}
                                                onClick={() => navigate(`/forum/posts/${post.post_id}`)}
                                            >
                                                View Post
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No posts available for this tag.</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <p>Tag not found.</p>
                )}
            </div>
        </div>
    );
};

export default TagPage;