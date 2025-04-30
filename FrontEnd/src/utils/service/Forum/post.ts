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
import { Dispatch, SetStateAction } from "react";
import { PostListResponse, Post } from "../../../types/forum";
import { PostComment } from "../../../types/forum";
import { on } from "events";

// Posts list functions
export const loadPosts = async (
    setLoading: Dispatch<SetStateAction<boolean>>,
    setPosts: (posts: PostListResponse[]) => void,
    setError: Dispatch<SetStateAction<string>>,
    setSuccess: Dispatch<SetStateAction<string>>
): Promise<void> => {
    const handleError = (message: string) => {
        setError(`Không thể tải posts: ${message}`);
        setSuccess("");
    };
    try {
        setLoading(true);
        const response = await getPosts();
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            const errorMsg = data?.message ?? "Lỗi không xác định từ máy chủ.";
            return handleError(errorMsg);
        }
        setPosts(data.data.posts ?? []);
        setSuccess("Tải danh sách posts thành công");
    } catch (err: any) {
        const errorMsg =
            err?.response?.data?.message ??
            err?.message ??
            "Đã xảy ra lỗi khi tải danh sách category";
        handleError(errorMsg);
    } finally {
        setLoading(false);
    }
};

// Post detail functions
export const loadPostPageById = async (
    id: string,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setPost: (post: Post | null) => void,
    setComments: (comments: PostComment[]) => void,
    setError: React.Dispatch<React.SetStateAction<string>>,
    setSuccess: React.Dispatch<React.SetStateAction<string>>,
    onSuccess?: () => void
): Promise<void> => {
    const handleError = (message: string) => {
        setError(`Không thể tải posts: ${message}`);
        setSuccess("");
    };
    try {
        setLoading(true);
        setError('');
        setSuccess('');

        const response = await getPostById(`${id}?includeComments=true`);

        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            const errorMsg = data?.message ?? "Lỗi không xác định từ máy chủ.";
            return handleError(errorMsg);
        }
        const post = data.post;
        if (!post) {
          throw new Error("Post not found");
        }
    
        const comments = Array.isArray(post.comments) ? post.comments : [];
        setPost(post);
        setComments(comments);
        setSuccess('Post loaded successfully');

        if (onSuccess) {
            onSuccess();
        }
    } catch (err: unknown) {
        let errorMessage = 'Failed to load post';

        if (err instanceof Error) {
            errorMessage = err.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        }

        setError(errorMessage);
        setPost(null);
        setComments([]);
    } finally {
        setLoading(false);
    }
};

export const deletePostFE = async (
    id: string,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setError: React.Dispatch<React.SetStateAction<string>>,
    setSuccess: React.Dispatch<React.SetStateAction<string>>,
    onSuccess?: () => void
): Promise<void> => {
    try {
        setLoading(true);
        setError('');
        setSuccess('');

        const response = await deletePost(id);

        if (response.status !== 200 || !response.data?.success) {
            throw new Error(response.data?.message || 'Failed to delete post: Server error');
        }

        setSuccess('Post deleted successfully');

        if (onSuccess) {
            setTimeout(onSuccess, 2000); // Delay redirect to show success message
        }
    } catch (err: unknown) {
        let errorMessage = 'Failed to delete post';

        if (err instanceof Error) {
            errorMessage = err.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        }

        setError(errorMessage);
    } finally {
        setLoading(false);
    }
};


export const handleCommentSubmit = async (
    postId: string,
    commentText: string,
    setCommentText: (text: string) => void,
    setError: React.Dispatch<React.SetStateAction<string>>,
    setSuccess: React.Dispatch<React.SetStateAction<string>>,
    fetchComments: () => Promise<void>
): Promise<void> => {
    try {
        if (!postId) {
            throw new Error('Invalid post ID');
        }

        const trimmedComment = commentText.trim();
        if (!trimmedComment) {
            throw new Error('Comment cannot be empty');
        }

        setError('');
        setSuccess('');

        const response = await createComment(postId, { content: trimmedComment });

        if (response.status !== 200 || !response.data?.success) {
            throw new Error(response.data?.message || 'Failed to create comment');
        }

        setCommentText('');
        setSuccess('Comment posted successfully');

        await fetchComments();

    } catch (err: unknown) {
        let errorMessage = 'Failed to post comment';

        if (err instanceof Error) {
            errorMessage = err.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        }

        setError(errorMessage);
        setSuccess('');
    }
};