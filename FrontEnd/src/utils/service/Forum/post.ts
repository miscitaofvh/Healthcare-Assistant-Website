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

import { PostSummary, Post } from "../../../types/forum";
import { PostComment } from "../../../types/forum";

// Posts list functions
export const loadPosts = async (
    setLoading: (loading: boolean) => void,
    setPosts: (posts: PostSummary[]) => void,
    setError: (error: string) => void
) => {
    try {
        setLoading(true);
        const res = await getPosts();
        if (res.status !== 200) {
            throw new Error("Failed to load posts");
        }
        setPosts(res.data.data);
    } catch (err: any) {
        console.error("Error loading posts:", err);
        setError(err.message || "Something went wrong while loading posts.");
    } finally {
        setLoading(false);
    }
};

// Post detail functions
export const fetchPost = async (
    id: string,
    setLoading: (loading: boolean) => void,
    setPost: (post: Post) => void,
    setError: (error: string) => void
) => {
    try {
        setLoading(true);
        const response = await getPostById(id);
        setPost(response.data.data);
    } catch (error) {
        console.error("Error loading post:", error);
        setError("Không thể tải bài viết.");
    } finally {
        setLoading(false);
    }
};

export const fetchComments = async (
    id: string,
    setLoading: (loading: boolean) => void,
    setComments: (comments: PostComment[]) => void, // Set state with an array of PostComment
    setError: (error: string) => void
) => {
    try {
        const response = await getComments(id);
        setComments(response.data); // Ensure response.data is an array of PostComment
    } catch (error) {
        console.error("Error loading comments:", error);
        setError("Không thể tải bình luận.");
    } finally {
        setLoading(false);
    }
};

export const deletePostFE = async (
    id: string,
    setLoading: (loading: boolean) => void,
    setError: (error: string) => void
) => {
    try {
        const response = await deletePost(id); // Ensure you're calling the correct API method here.
        if (response.status !== 200) {
            throw new Error("Failed to delete post");
        }
        setLoading(true);
        alert("Bài viết đã được xoá.");
        window.location.href = "/forum"; // Redirect to forum list after deleting.
    } catch (error) {
        console.error("Lỗi khi xoá bài viết:", error);
        setError("Không thể xoá bài viết.");
        alert("Không thể xoá bài viết.");
    }
};


export const handleCommentSubmit = async (
    id: string,
    commentText: string,
    setCommentText: (text: string) => void,
    fetchComments: () => void
) => {
    if (!commentText.trim()) return;
    try {
        const response = await createComment(id, { content: commentText });
        if (response.status !== 200) {
            throw new Error("Failed to create comment");
        }
        alert("Bình luận đã được gửi.");
        setCommentText("");
        fetchComments();
    } catch (error) {
        console.error("Lỗi khi đăng bình luận:", error);
        alert("Không thể đăng bình luận.");
    }
};