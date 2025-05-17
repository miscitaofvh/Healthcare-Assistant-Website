import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Dispatch, SetStateAction } from 'react';
import InteractPost from '../../../utils/api/Forum/post';
import { PostListMain, Post, NewPost, SummaryPost } from '../../../types/Forum/post';
import { CommentPost } from '../../../types/Forum/comment';
import { PaginationData } from '../../../types/Forum/pagination';
import { SummaryTag } from '../../../types/Forum/tag';
import { SummaryCategory } from '../../../types/Forum/category';
import { ThreadDropdown } from '../../../types/Forum/thread';
import { POST_MESSAGES } from '../../constants/forum-messages';

const validatePostInputs = (post: NewPost): string | null => {
    const title = post.title?.trim() || '';
    const content = post.content?.trim() || '';

    if (!title) return POST_MESSAGES.ERROR.VALIDATION.TITLE_REQUIRED;
    if (title.length < 3 || title.length > 100) {
        return POST_MESSAGES.ERROR.VALIDATION.TITLE_LENGTH;
    }
    if (!content) return POST_MESSAGES.ERROR.VALIDATION.CONTENT_REQUIRED;
    if (content.length < 10 || content.length > 2000) {
        return POST_MESSAGES.ERROR.VALIDATION.CONTENT_LENGTH;
    }
    if (!post.thread_id) return POST_MESSAGES.ERROR.VALIDATION.THREAD_REQUIRED;

    return null;
};

const handleApiResponse = (
    response: any,
    successStatus: number,
    errorMessage: string,
    showError: (message: string) => void
): boolean => {
    if (response.status !== successStatus || !response.data?.success) {
        const errorMsg = response.data?.message || errorMessage;
        const detailedMsg = Array.isArray(response.data?.errors)
            ? response.data.errors.map((err: { message: string }) => err.message).join('\n')
            : '';
        showError(`${errorMsg}${detailedMsg ? `\n${detailedMsg}` : ''}`);
        return false;
    }
    return true;
};

const loadPosts = async (
    setLoading: Dispatch<SetStateAction<boolean>>,
    setPosts: Dispatch<SetStateAction<PostListMain[]>>,
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

        if (!handleApiResponse(response, 200, POST_MESSAGES.ERROR.LOAD, showError)) {
            return;
        }

        setPosts(response.data.posts ?? []);
        setPagination({
            currentPage: response.data.page || page,
            totalPages: Math.ceil(response.data.totalCount / response.data.limit) || 1,
            limit: response.data.limit || limit,
            totalItems: response.data.totalCount || 0,
            sortBy: response.data.sortBy || sortBy,
            sortOrder: response.data.sortOrder || sortOrder
        });

        showSuccess(POST_MESSAGES.SUCCESS.LOAD);
    } catch (err: any) {
        showError(err?.response?.data?.message ?? err?.message ?? POST_MESSAGES.ERROR.LOAD);
    } finally {
        setLoading(false);
    }
};

const loadSummaryPosts = async (
    setLoading: Dispatch<SetStateAction<boolean>>,
    setPosts: Dispatch<SetStateAction<PostListMain[]>>,
    showError: (message: string) => void = toast.error
): Promise<void> => {
    try {
        setLoading(true);
        const response = await InteractPost.getSummaryPosts();

        if (!handleApiResponse(response, 200, POST_MESSAGES.ERROR.LOAD, showError)) {
            return;
        }

        setPosts(response.data.posts ?? []);

    } catch (err: any) {
        showError(err?.response?.data?.message ?? err?.message ?? POST_MESSAGES.ERROR.LOAD);
    } finally {
        setLoading(false);
    }
};

const loadPopularPosts = async (
    setLoading: Dispatch<SetStateAction<boolean>>,
    setPosts: Dispatch<SetStateAction<PostListMain[]>>,
    showError: (message: string) => void = toast.error
): Promise<void> => {
    try {
        setLoading(true);
        const response = await InteractPost.getPopularPosts();

        if (!handleApiResponse(response, 200, POST_MESSAGES.ERROR.LOAD, showError)) {
            return;
        }

        setPosts(response.data.posts ?? []);

    } catch (err: any) {
        showError(err?.response?.data?.message ?? err?.message ?? POST_MESSAGES.ERROR.LOAD);
    } finally {
        setLoading(false);
    }
};

const loadPostPageById = async (
    id: string,
    setLoading: Dispatch<SetStateAction<boolean>>,
    setPost: Dispatch<SetStateAction<Post | null>>,
    setComments: (comments: CommentPost[]) => void,
    showError: (message: string) => void = toast.error,
    onSuccess: () => void = () => {}
): Promise<void> => {
    try {
        setLoading(true);
        const response = await InteractPost.getPostById(`${id}?includeComments=true&includeStats=true&includeCommentReplies=true`);

        if (!handleApiResponse(response, 200, POST_MESSAGES.ERROR.LOAD_SINGLE, showError)) {
            setPost(null);
            setComments([]);
            return;
        }

        const post = response.data.post;
        if (!post) {
            showError('Post not found');
            setPost(null);
            setComments([]);
            return;
        }

        setPost(post);
        setComments(Array.isArray(post.comments) ? post.comments : []);
        setTimeout(onSuccess, 2000);
    } catch (err: any) {
        showError(err?.response?.data?.message ?? err?.message ?? POST_MESSAGES.ERROR.LOAD_SINGLE);
        setPost(null);
        setComments([]);
    } finally {
        setLoading(false);
    }
};

const loadUpdatePostFE = async (
    id: string,
    setLoading: Dispatch<SetStateAction<boolean>>,
    setPost: Dispatch<SetStateAction<Post | null>>,
    setCategories: Dispatch<SetStateAction<SummaryCategory[]>>,
    setThreads: Dispatch<SetStateAction<ThreadDropdown[]>>,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    onSuccess: () => void = () => {}
): Promise<void> => {
    try {
        setLoading(true);
        const response = await InteractPost.getPostById(id);

        if (!handleApiResponse(response, 200, POST_MESSAGES.ERROR.LOAD_SINGLE, showError)) {
            setPost(null);
            return;
        }

        const post = response.data.post;
        if (!post) {
            showError('Post not found');
            setPost(null);
            return;
        }

        setPost({
            ...post,
            tag_name: post.tags.map((tag: SummaryTag) => tag.tag_name)
        });

        setCategories([{
            category_id: post.category_id,
            category_name: post.category_name
        }]);

        setThreads([{
            thread_id: post.thread_id,
            thread_name: post.thread_name
        }]);

        showSuccess(POST_MESSAGES.SUCCESS.LOAD_SINGLE);
        setTimeout(onSuccess, 2000);
    } catch (err: any) {
        showError(err?.response?.data?.message ?? err?.message ?? POST_MESSAGES.ERROR.LOAD_SINGLE);
        setPost(null);
    } finally {
        setLoading(false);
    }
};

const createPostFE = async (
    postNew: NewPost,
    setLoading: Dispatch<SetStateAction<boolean>>,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    onSuccess: () => void = () => {}
): Promise<void> => {
    try {
        setLoading(true);
        const validationError = validatePostInputs(postNew);
        if (validationError) {
            showError(validationError);
            return;
        }

        const response = await InteractPost.createPost(postNew);

        if (!handleApiResponse(response, 201, POST_MESSAGES.ERROR.CREATE, showError)) {
            return;
        }

        showSuccess(POST_MESSAGES.SUCCESS.CREATE);
        setTimeout(onSuccess, 2000);
    } catch (err: any) {
        showError(err?.response?.data?.message ?? err?.message ?? POST_MESSAGES.ERROR.CREATE);
    } finally {
        setLoading(false);
    }
};

const updatePostFE = async (
    id: string,
    postData: NewPost,
    setLoading: Dispatch<SetStateAction<boolean>>,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    onSuccess: () => void = () => {}
): Promise<void> => {
    try {
        setLoading(true);

        const validationError = validatePostInputs(postData);
        if (validationError) {
            showError(validationError);
            return;
        }

        const response = await InteractPost.updatePost(id, postData);

        if (!handleApiResponse(response, 200, POST_MESSAGES.ERROR.UPDATE, showError)) {
            return;
        }

        showSuccess(POST_MESSAGES.SUCCESS.UPDATE);
        setTimeout(onSuccess, 2000);
    } catch (err: any) {
        showError(err?.response?.data?.message ?? err?.message ?? POST_MESSAGES.ERROR.UPDATE);
    } finally {
        setLoading(false);
    }
};

const deletePostFE = async (
    id: string,
    setLoading: Dispatch<SetStateAction<boolean>>,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    onSuccess: () => void = () => {}
): Promise<void> => {
    try {
        setLoading(true);
        const response = await InteractPost.deletePost(id);

        if (!handleApiResponse(response, 200, POST_MESSAGES.ERROR.DELETE, showError)) {
            return;
        }

        showSuccess(POST_MESSAGES.SUCCESS.DELETE);
        setTimeout(onSuccess, 2000);
    } catch (err: any) {
        showError(err?.response?.data?.message ?? err?.message ?? POST_MESSAGES.ERROR.DELETE);
    } finally {
        setLoading(false);
    }
};

export default {
    loadPosts,
    loadSummaryPosts,
    loadPopularPosts,
    loadPostPageById,
    loadUpdatePostFE,
    createPostFE,
    updatePostFE,
    deletePostFE
};