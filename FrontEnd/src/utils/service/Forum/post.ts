import { toast } from 'react-toastify';
import { Dispatch, SetStateAction } from "react";

import InteractPost from "../../../utils/api/Forum/post";
import { PostListMain, Post, NewPost } from "../../../types/Forum/post";
import { CommentPost } from "../../../types/Forum/comment";
import { PaginationData } from "../../../types/Forum/pagination";
import { SummaryTag } from "../../../types/Forum/tag";
import { SummaryCategory } from "../../../types/Forum/category";
import { ThreadDropdown } from "../../../types/Forum/thread";

// Posts list functions
const loadPosts = async (
    setLoading: Dispatch<SetStateAction<boolean>>,
    setPosts: (posts: PostListMain[]) => void,
    setPagination: Dispatch<SetStateAction<PaginationData>>,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'created_at',
    sortOrder: string = 'DESC'
): Promise<void> => {
    try {
        setLoading(true);

        const response = await InteractPost.getPosts(page, limit, sortBy, sortOrder);
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            showError(data?.message ?? "Lỗi không xác định từ máy chủ.");
            return;
        }
        setPosts(data.posts ?? []);

        setPagination({
            currentPage: data.page || page,
            totalPages: Math.ceil(data.totalCount / data.limit) || 1,
            limit: data.limit || limit,
            totalItems: data.totalCount || 0,
            sortBy: data.sortBy || sortBy,
            sortOrder: data.sortOrder || sortOrder
        });

        showSuccess("Posts loaded successfully");
    } catch (err: any) {
        const errorMsg =
            err?.response?.data?.message ??
            err?.message ??
            "Đã xảy ra lỗi khi tải danh sách category";
        showError(errorMsg);
    } finally {
        setLoading(false);
    }
};

const loadPostPageById = async (
    id: string,
    setLoading: Dispatch<SetStateAction<boolean>>,
    setPost: (post: Post | null) => void,
    setComments: (comments: CommentPost[]) => void,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    onSuccess?: () => void
): Promise<void> => {
    try {
        setLoading(true);

        const response = await InteractPost.getPostById(`${id}?includeComments=true&includeStats=true&includeCommentReplies=true`);

        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            showError(data?.message ?? "Lỗi không xác định từ máy chủ.");
            return;
        }
        const post = data.post;

        if (!post) {
            alert("Post not found");
        }

        const comments = Array.isArray(post.comments) ? post.comments : [];
        setPost(post);
        setComments(comments);

        showSuccess("Post loaded successfully");

        setTimeout(() => {
            if (onSuccess) {
                onSuccess();
            }
        }, 2000);

    } catch (err: unknown) {
        let errorMessage = 'Failed to load post';

        if (err instanceof Error) {
            errorMessage = err.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        }

        showError(errorMessage);
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
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    onSuccess?: () => void
): Promise<void> => {
    try {
        setLoading(true);
        const response = await InteractPost.getPostById(id);
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            showError(data?.message ?? "Lỗi không xác định từ máy chủ.");
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

        showSuccess("Post loaded successfully");

        if (onSuccess) {
            setTimeout(onSuccess, 2000);
        }
    } catch (err: unknown) {
        let errorMessage = "Failed to load post";
        if (err instanceof Error) errorMessage = err.message;
        else if (typeof err === "string") errorMessage = err;

        showError(errorMessage);
    } finally {
        setLoading(false);
    }
};

const createPostFE = async (
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    postNew: NewPost,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    onSuccess?: () => void
): Promise<void> => {
    try {
        setLoading(true);

        const response = await InteractPost.createPost(postNew);

        const { status, data } = response;

        if (status !== 201 || !data?.success) {
            showError(data?.message || 'Failed to create post: Server error');
            return;
        }

        showSuccess('Post created successfully');

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

        showError(errorMessage);
    } finally {
        setLoading(false);
    }
};

const updatePostFE = async (
    id: string,
    postData: any,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    onSuccess?: () => void
): Promise<void> => {
    try {
        setLoading(true);

        const response = await InteractPost.updatePost(id || '', postData);

        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            showError(response.data?.message || 'Failed to delete post: Server error');
            return;
        }

        showSuccess('Post updated successfully');

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

        showError(errorMessage);
    } finally {
        setLoading(false);
    }
};

const deletePostFE = async (
    id: string,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    onSuccess?: () => void
): Promise<void> => {
    try {
        setLoading(true);

        const response = await InteractPost.deletePost(id);

        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            showError(data?.message || 'Failed to delete post: Server error');
            return;
        }

        showSuccess('Post deleted successfully');

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

        showError(errorMessage);
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