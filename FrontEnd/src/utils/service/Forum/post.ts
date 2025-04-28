import {
    getPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost,
    getTagByForumPost,
    getComments,
    createComment,
    deleteComment,
} from "../../../utils/api/Forum/post";

import { PostResponse } from "../../../types/forum";

export const loadPosts = async (
    setLoading: (loading: boolean) => void,
    setPosts: (posts: PostResponse[]) => void,
    setError: (error: string) => void
) => {
    try {
        setLoading(true);
        const res = await getPosts();
        if (res.status !== 200) {
            throw new Error("Failed to load posts");
        }

        const mappedPosts = res.data.data.map((post: any) => ({
            post_id: post.post_id,
            content: post.content,
            image_url: post.image_url,
            created_at: post.created_at,
            last_updated: post.last_updated,
            user: {
                user_id: post.user_id,
                username: post.username || "Unknown User",
            },
            thread: {
                thread_id: post.thread_id,
                thread_name: post.thread_name || "Unknown Thread",
            },
            tags: post.tags || [],
            likes: post.likes || 0,
            comments: post.comments || 0,
        }));

        setPosts(mappedPosts);
    } catch (err: any) {
        console.error("Error loading posts:", err);
        setError(err.message || "Something went wrong while loading posts.");
    } finally {
        setLoading(false);
    }
};