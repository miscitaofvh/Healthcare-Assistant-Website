import InteractPost from "../../../utils/api/Forum/post";
import { Dispatch, SetStateAction } from "react";
import { PostListResponse, Post, NewPost } from "../../../types/Forum/post";
import { CommentPost } from "../../../types/Forum/comment";
import { Tag, SummaryTag } from "../../../types/Forum/tag";
import { SummaryCategory } from "../../../types/Forum/category";
import { ThreadDropdown } from "../../../types/Forum/thread";

// Posts list functions
const loadPosts = async (
    setLoading: Dispatch<SetStateAction<boolean>>,
    setPosts: (posts: PostListResponse[]) => void,
    setError: Dispatch<SetStateAction<string>>,
    setSuccess: Dispatch<SetStateAction<string>>
): Promise<void> => {
    try {
        setLoading(true);
        const response = await InteractPost.getPosts();
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            setError(data?.message ?? "Lỗi không xác định từ máy chủ.");
            setSuccess("");
            return;
        }
        setPosts(data.data.posts ?? []);
        setSuccess("Tải danh sách posts thành công");
    } catch (err: any) {
        const errorMsg =
            err?.response?.data?.message ??
            err?.message ??
            "Đã xảy ra lỗi khi tải danh sách category";
        setError(errorMsg);
        setSuccess("");
    } finally {
        setLoading(false);
    }
};

const loadPostPageById = async (
    id: string,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setPost: (post: Post | null) => void,
    setComments: (comments: CommentPost[]) => void,
    setError: React.Dispatch<React.SetStateAction<string>>,
    setSuccess: React.Dispatch<React.SetStateAction<string>>,
    onSuccess?: () => void
): Promise<void> => {
    try {
        setLoading(true);
        setError('');
        setSuccess('');

        const response = await InteractPost.getPostById(`${id}?includeComments=true&includeStats=true&includeCommentReplies=true`);

        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            setError(data?.message ?? "Lỗi không xác định từ máy chủ.");
            setSuccess("");
            return;
        }
        const post = data.post;

        if (!post) {
            alert("Post not found");
        }

        const comments = Array.isArray(post.comments) ? post.comments : [];
        setPost(post);
        setComments(comments);
        // setSuccess('Post loaded successfully');

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

const loadUpdatePostFE = async (
    id: string,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setPost: (post: Post | null) => void,
    setCategories: (categories: SummaryCategory[]) => void,
    setThreads: (threads: ThreadDropdown[]) => void,
    setError: React.Dispatch<React.SetStateAction<string>>,
    setSuccess: React.Dispatch<React.SetStateAction<string>>,
    onSuccess?: () => void
): Promise<void> => {
    try {
        setLoading(true);
        setError('');
        setSuccess('');

        const response = await InteractPost.getPostById(id);
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            setError(data?.message ?? "Lỗi không xác định từ máy chủ.");
            setSuccess("");
        }

        const post = data.post;

        setPost({
            ...post,
            tag_name: post.tags.map((tag: SummaryTag) => tag.tag_name),
        });

        setCategories([
            {
                category_id: post.category_id,
                category_name: post.category_name,
            },
        ]);

        setThreads([
            {
                thread_id: post.thread_id,
                thread_name: post.thread_name,
            },
        ]);

        setSuccess("Post loaded successfully");

        if (onSuccess) {
            setTimeout(onSuccess, 2000);
        }
    } catch (err: unknown) {
        let errorMessage = "Failed to load post";
        if (err instanceof Error) errorMessage = err.message;
        else if (typeof err === "string") errorMessage = err;

        setError(errorMessage);
    } finally {
        setLoading(false);
    }
};

const createPostFE = async (
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    postNew: NewPost,
    setError: React.Dispatch<React.SetStateAction<string>>,
    setSuccess: React.Dispatch<React.SetStateAction<string>>,
    onSuccess?: () => void
): Promise<void> => {
    try {
        setLoading(true);
        setError('');
        setSuccess('');

        const response = await InteractPost.createPost(postNew);

        const { status, data } = response;

        if (status !== 201 || !data?.success) {
            setError(data?.message || 'Failed to create post: Server error');
            setSuccess('');
            return;
        }

        setSuccess('Post created successfully');

        if (onSuccess) {
            setTimeout(onSuccess, 2000);
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

const updatePostFE = async (
    id: string,
    postData: any,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setError: React.Dispatch<React.SetStateAction<string>>,
    setSuccess: React.Dispatch<React.SetStateAction<string>>,
    onSuccess?: () => void
): Promise<void> => {
    try {
        setLoading(true);
        setError('');
        setSuccess('');

        const response = await InteractPost.updatePost(id || '', postData);

        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            setError(response.data?.message || 'Failed to delete post: Server error');
            setSuccess('');
            return;
        }

        setSuccess('Post updated successfully');

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

const deletePostFE = async (
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

        const response = await InteractPost.deletePost(id);

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

export default {
    loadPosts,
    loadPostPageById,
    loadUpdatePostFE,
    createPostFE,
    updatePostFE,
    deletePostFE
};