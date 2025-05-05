import {
    getPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost,
    likePost,
    getTagByForumPost
} from "../../../utils/api/Forum/post";
import { Dispatch, SetStateAction } from "react";
import { PostListResponse, Post, PostComment, PostNew, TagPost } from "../../../types/forum";
import { CategorySummary, ThreadDropdown, TagSummary } from "../../../types/forum";
import { on } from "events";

// Posts list functions
export const loadPosts = async (
    setLoading: Dispatch<SetStateAction<boolean>>,
    setPosts: (posts: PostListResponse[]) => void,
    setError: Dispatch<SetStateAction<string>>,
    setSuccess: Dispatch<SetStateAction<string>>
): Promise<void> => {
    try {
        setLoading(true);
        const response = await getPosts();
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

export const loadPostPageById = async (
    id: string,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setPost: (post: Post | null) => void,
    setComments: (comments: PostComment[]) => void,
    setError: React.Dispatch<React.SetStateAction<string>>,
    setSuccess: React.Dispatch<React.SetStateAction<string>>,
    onSuccess?: () => void
): Promise<void> => {
    try {
        setLoading(true);
        setError('');
        setSuccess('');

        const response = await getPostById(`${id}?includeComments=true&includeStats=true`);

        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            setError(data?.message ?? "Lỗi không xác định từ máy chủ.");
            setSuccess("");
            return;
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

export const loadUpdatePostFE = async (
    id: string,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setPost: (post: Post | null) => void,
    setCategories: (categories: CategorySummary[]) => void,
    setThreads: (threads: ThreadDropdown[]) => void,
    setError: React.Dispatch<React.SetStateAction<string>>,
    setSuccess: React.Dispatch<React.SetStateAction<string>>,
    onSuccess?: () => void
): Promise<void> => {
    try {
        setLoading(true);
        setError('');
        setSuccess('');

        const response = await getPostById(id);
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            setError(data?.message ?? "Lỗi không xác định từ máy chủ.");
            setSuccess("");
        }

        const post = data.post;

        setPost({
            ...post,
            tag_name: post.tags.map((tag: TagSummary) => tag.tag_name),
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

export const createPostFE = async (
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    postNew: PostNew,
    setError: React.Dispatch<React.SetStateAction<string>>,
    setSuccess: React.Dispatch<React.SetStateAction<string>>,
    onSuccess?: () => void
): Promise<void> => {
    try {
        setLoading(true);
        setError('');
        setSuccess('');

        const response = await createPost(postNew);
        const { status, data } = response;
        alert(JSON.stringify(response));
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

export const updatePostFE = async (
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

        const response = await updatePost(id || '', postData);
        if (response.status !== 200 || !response.data?.success) {
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

export const likePostFE = async (
    postId: string,
    setError: React.Dispatch<React.SetStateAction<string>>,
    setSuccess: React.Dispatch<React.SetStateAction<string>>,
    refetchPost: () => Promise<void>
): Promise<void> => {
    try {
        if (!postId) {
            throw new Error('Invalid post ID');
        }

        setError('');
        setSuccess('');

        const response = await likePost(postId);

        if (response.status !== 200 || !response.data?.success) {
            throw new Error(response.data?.message || 'Failed to like post');
        }

        setSuccess(response.data.message || 'Post like updated');
        await refetchPost();

    } catch (err: unknown) {
        let errorMessage = 'Failed to like post';

        if (err instanceof Error) {
            errorMessage = err.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        }

        setError(errorMessage);
        setSuccess('');
    }
};