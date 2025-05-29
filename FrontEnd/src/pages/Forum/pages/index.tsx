import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from "@components/Navbar";
import styles from '../styles/Forum.module.css';
import CategoryActions from "@utils/service/Forum/category";
import ThreadActions from "@utils/service/Forum/thread";
import PostActions from "@utils/service/Forum/post";
import TagActions from "@utils/service/Forum/tag";
import { SummaryTag, SummaryCategory, SummaryThread, PostListMain } from 'src/types/forum';
import { formatDate, stripMarkdown } from "@utils/helpers/dateFormatter";

// Helper function to truncate text
const truncateText = (text: string | undefined, wordLimit: number, charLimit: number): string => {
  if (!text) return 'No description available';
  let truncated = text.length > charLimit ? text.substring(0, charLimit) + '...' : text;
  const words = truncated.split(/\s+/);
  if (words.length > wordLimit) {
    truncated = words.slice(0, wordLimit).join(' ') + '...';
  }
  return truncated;
};

// Main Forum Homepage Component
const ForumHome: React.FC = () => {
  const [categories, setCategories] = useState<SummaryCategory[]>([]);
  const [threads, setThreads] = useState<SummaryThread[]>([]);
  const [posts, setPosts] = useState<PostListMain[]>([]);
  const [tags, setTags] = useState<SummaryTag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load categories
      await CategoryActions.loadPopularCategories(
        (categories) => setCategories(categories),
        (error) => toast.error(error)
      );

      // Load threads
      await ThreadActions.loadPopularThreads(
        setLoading,
        setThreads,
        (error) => toast.error(error)
      );

      // Load posts
      await PostActions.loadPopularPosts(
        setLoading,
        setPosts,
        (error) => toast.error(error),
      );

      // Load tags
      await TagActions.getPopularTags(
        setLoading,
        (tags) => setTags(tags),
        (error) => toast.error(error)
      );

      toast.success('Forum data loaded successfully');
    } catch (error) {
      toast.error('Error loading forum data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCategoryClick = (categoryId: number) => {
    navigate(`/forum/categories/${categoryId}`);
  };

  const handleThreadClick = (threadId: number) => {
    navigate(`/forum/threads/${threadId}`);
  };

  const handlePostClick = (postId: number) => {
    navigate(`/forum/posts/${postId}`);
  };

  const handleTagClick = (tagId: number) => {
    navigate(`/forum/tags/${tagId}`);
  };

  const handleViewAllClick = (type: string) => {
    navigate(`/forum/${type}`);
  };

  return (
    <div className={styles.forumContainer}>
      <ToastContainer position="top-right" autoClose={5000} />
      <div className={styles.main_navbar}>
        <Navbar />
      </div>

      <div className={styles.headerContainer}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading forum content...</p>
          </div>
        ) : (
          <>
            {/* Categories Section */}
            <section className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Popular Categories</h2>
                <button
                  className={styles.secondaryButton}
                  onClick={() => handleViewAllClick('categories')}
                >
                  View All Categories
                </button>
              </div>
              <br />
              {categories.length > 0 ? (
                <div className={styles.forumGrid}>
                  {categories.slice(0, 6).map((category) => (
                    <div
                      key={category.category_id}
                      className={`${styles.forumCard} cursor-pointer`}
                      onClick={() => handleCategoryClick(category.category_id || 0)}
                    >
                      <h3 className={styles.forumName}>
                        {truncateText(category.category_name, 10, 40)}
                      </h3>
                      <p className={styles.forumDescription}>
                        {truncateText(category.description, 10, 50)}
                      </p>
                      <div className={styles.categoryMeta}>
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>Threads:</span>
                          <span className={styles.metaValue}>{category.thread_count || 0}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>Posts:</span>
                          <span className={styles.metaValue}>{category.post_count || 0}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>Created:</span>
                          <span className={styles.metaValue}>{formatDate(category.created_at || '')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p className={styles.emptyMessage}>No categories available</p>
                </div>
              )}
            </section>

            {/* Threads Section */}
            <section className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Popular Threads</h2>
                <button
                  className={styles.secondaryButton}
                  onClick={() => handleViewAllClick('threads')}
                >
                  View All Threads
                </button>
              </div>
              <br />
              {threads.length > 0 ? (
                <div className={styles.forumGrid}>
                  {threads.slice(0, 6).map((thread) => (
                    <div
                      key={thread.thread_id}
                      className={`${styles.forumCard} cursor-pointer`}
                      onClick={() => handleThreadClick(thread.thread_id)}
                    >
                      <h3 className={styles.forumName}>
                        {truncateText(thread.thread_name, 10, 40)}
                      </h3>
                      <p className={styles.forumDescription}>
                        {truncateText(thread.description, 10, 50)}
                      </p>
                      <div className={styles.forumMeta}>
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>Posts:</span>
                          <span className={styles.metaValue}>{thread.post_count || 0}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>Last Post:</span>
                          <span className={styles.metaValue}>
                            {thread.last_post_date ? formatDate(thread.last_post_date) : 'No posts yet'}
                          </span>
                        </div>
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>Created:</span>
                          <span className={styles.metaValue}>{formatDate(thread.created_at || '')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p className={styles.emptyMessage}>No threads available</p>
                </div>
              )}
            </section>

            {/* Posts Section */}
            <section className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Popular Posts</h2>
                <button
                  className={styles.secondaryButton}
                  onClick={() => handleViewAllClick('posts')}
                >
                  View All Posts
                </button>
              </div>
              <br />
              {posts.length > 0 ? (
                <div className={styles.postsContainer}>
                  {posts.slice(0, 5).map((post) => (
                    <div
                      key={post.post_id}
                      className={`${styles.postCard} cursor-pointer`}
                      onClick={() => handlePostClick(post.post_id)}
                    >
                      <div className={styles.postHeader}>
                        <div>
                          <h3 className={styles.forumName}>{truncateText(post.title, 10, 50)}</h3>
                          <span className={styles.postAuthor}>By {post.created_by}</span>
                        </div>
                        <div className={styles.metaValue}>{formatDate(post.created_at)}</div>
                      </div>
                      <div className={styles.forumDescription}>
                        {stripMarkdown(post.content).length > 200
                          ? `${stripMarkdown(post.content).substring(0, 200)}...`
                          : stripMarkdown(post.content)}
                      </div>
                      <div className={styles.forumMeta}>
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>Category:</span>
                          <span className={styles.metaValue}>{post.category_name}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>Thread:</span>
                          <span className={styles.metaValue}>{post.thread_name}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>Likes:</span>
                          <span className={styles.metaValue}>{post.like_count || 0}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>Comments:</span>
                          <span className={styles.metaValue}>{post.comment_count || 0}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>Views:</span>
                          <span className={styles.metaValue}>{post.view_count || 0}</span>
                        </div>
                        {post.tags.length > 0 && (
                          <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>Tags:</span>
                            <span className={styles.metaValue}>
                              {post.tags.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p className={styles.emptyMessage}>No posts available</p>
                </div>
              )}
            </section>

            {/* Tags Section */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Popular Tags</h2>
                <button
                  className={styles.secondaryButton}
                  onClick={() => handleViewAllClick('tags')}
                >
                  View All Tags
                </button>
              </div>
              <br />
              {tags.length > 0 ? (
                <div className={styles.forumGrid}>
                  {tags.slice(0, 6).map((tag) => (
                    <div
                      key={tag.tag_id}
                      className={`${styles.forumCard} cursor-pointer`}
                      onClick={() => handleTagClick(tag.tag_id)}
                    >
                      <h3 className={styles.forumName}>#{tag.tag_name}</h3>
                      <p className={styles.forumDescription}>
                        {truncateText(tag.description, 10, 100)}
                      </p>
                      <div className={styles.forumMeta}>
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>Created by:</span>
                          <span className={styles.metaValue}>{tag.created_by}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>Post count:</span>
                          <span className={styles.metaValue}>{tag.post_count || 0}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>Last used:</span>
                          <span className={styles.metaValue}>{formatDate(tag.last_used_at || '')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p className={styles.emptyMessage}>No tags available</p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default ForumHome;