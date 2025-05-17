import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import InteractiveThread from "../../../utils/api/Forum/thread";
import InteractiveCategory from "../../../utils/api/Forum/category";
import { Dispatch, SetStateAction } from "react";
import { Thread, NewThread, SummaryThread, ThreadDropdown } from "../../../types/forum/thread";
import { Post } from "../../../types/forum/post";
import { PaginationData } from "../../../types/forum/pagination";
import { THREAD_MESSAGES } from "../../constants/forum-messages";

const validateThreadInputs = (thread: NewThread): string | null => {
    const threadName = thread.thread_name.trim();
    const description = thread.description?.trim() || "";

    if (!threadName) return THREAD_MESSAGES.ERROR.VALIDATION.NAME_REQUIRED;
    if (threadName.length < 3 || threadName.length > 50) {
        return THREAD_MESSAGES.ERROR.VALIDATION.NAME_LENGTH;
    }
    if (description && (description.length < 10 || description.length > 200)) {
        return THREAD_MESSAGES.ERROR.VALIDATION.DESC_LENGTH;
    }
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
            ? response.data.errors.map((err: { message: string }) => err.message).join("\n")
            : "";
        showError(`${errorMsg}${detailedMsg ? `\n${detailedMsg}` : ""}`);
        return false;
    }
    return true;
};

const loadThreads = async (
    setLoading: Dispatch<SetStateAction<boolean>>,
    setThreads: Dispatch<SetStateAction<Thread[]>>,
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
        const response = await InteractiveThread.getAllThreads(page, limit, sortBy, sortOrder);

        if (!handleApiResponse(response, 200, THREAD_MESSAGES.ERROR.LOAD, showError)) {
            return;
        }

        setThreads(response.data.threads ?? []);
        setPagination({
            currentPage: response.data.page || page,
            totalPages: Math.ceil(response.data.totalCount / response.data.limit) || 1,
            limit: response.data.limit || limit,
            totalItems: response.data.totalCount || 0,
            sortBy: response.data.sortBy || sortBy,
            sortOrder: response.data.sortOrder || sortOrder
        });

        showSuccess(THREAD_MESSAGES.SUCCESS.LOAD);
    } catch (err: any) {
        showError(err?.response?.data?.message ?? err?.message ?? THREAD_MESSAGES.ERROR.LOAD);
    } finally {
        setLoading(false);
    }
};

const loadSummaryThreads = async (
    setLoading: Dispatch<SetStateAction<boolean>>,
    setThreads: Dispatch<SetStateAction<SummaryThread[]>>,
    showError: (message: string) => void = toast.error
): Promise<void> => {
    try {
        setLoading(true);
        const response = await InteractiveThread.getSummaryThreads();

        if (!handleApiResponse(response, 200, THREAD_MESSAGES.ERROR.LOAD, showError)) {
            return;
        }

        setThreads(response.data.threads ?? []);
    } catch (err: any) {
        showError(err?.response?.data?.message ?? err?.message ?? THREAD_MESSAGES.ERROR.LOAD);
    } finally {
        setLoading(false);
    }
};

const loadPopularThreads = async (
    setLoading: Dispatch<SetStateAction<boolean>>,
    setThreads: Dispatch<SetStateAction<SummaryThread[]>>,
    showError: (message: string) => void = toast.error
): Promise<void> => {
    try {
        setLoading(true);
        const response = await InteractiveThread.getPopularThreads();

        if (!handleApiResponse(response, 200, THREAD_MESSAGES.ERROR.LOAD, showError)) {
            return;
        }

        setThreads(response.data.threads ?? []);
    } catch (err: any) {
        showError(err?.response?.data?.message ?? err?.message ?? THREAD_MESSAGES.ERROR.LOAD);
    } finally {
        setLoading(false);
    }
};

const loadThreadByID = async (
    id: number,
    setLoading: Dispatch<SetStateAction<boolean>>,
    setThread: Dispatch<SetStateAction<SummaryThread | null>>,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    onSuccess: () => void = () => { }
): Promise<void> => {
    try {
        setLoading(true);
        const response = await InteractiveThread.getThreadById(id);

        if (!handleApiResponse(response, 200, THREAD_MESSAGES.ERROR.LOAD_SINGLE, showError)) {
            return;
        }

        setThread(response.data.thread || null);
        showSuccess(THREAD_MESSAGES.SUCCESS.LOAD_SINGLE);
        onSuccess();
    } catch (err: any) {
        showError(err?.response?.data?.message ?? err?.message ?? THREAD_MESSAGES.ERROR.LOAD_SINGLE);
    } finally {
        setLoading(false);
    }
};

const loadPostsAndThreadByCategory = async (
    threadId: string,
    setLoading: Dispatch<SetStateAction<boolean>>,
    setThread: Dispatch<SetStateAction<Thread | null>>,
    setPosts: Dispatch<SetStateAction<Post[]>>,
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
        const response = await InteractiveThread.getPostsByThread(
            Number(threadId),
            page,
            limit,
            sortBy,
            sortOrder
        );

        if (!handleApiResponse(response, 200, THREAD_MESSAGES.ERROR.LOAD_POSTS, showError)) {
            return;
        }

        setThread(response.data.thread || null);
        setPosts(response.data.posts || []);
        setPagination(prev => ({
            ...prev,
            currentPage: page,
            totalPages: response.data.totalPages || 1,
            totalItems: response.data.totalItems || 0,
            limit: limit,
            sortBy: sortBy,
            sortOrder: sortOrder
        }));

        showSuccess(THREAD_MESSAGES.SUCCESS.LOAD_POSTS);
    } catch (err: any) {
        showError(err?.response?.data?.message ?? err?.message ?? THREAD_MESSAGES.ERROR.LOAD_POSTS);
    } finally {
        setLoading(false);
    }
};

const handleCreateThread = async (
    newThread: NewThread,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    onSuccess: () => void = () => { },
    setFormLoading?: Dispatch<SetStateAction<boolean>>
): Promise<void> => {
    try {
        setFormLoading?.(true);
        const validationError = validateThreadInputs(newThread);
        if (validationError) {
            showError(validationError);
            return;
        }

        const response = await InteractiveThread.createThread(newThread);

        if (!handleApiResponse(response, 201, THREAD_MESSAGES.ERROR.CREATE, showError)) {
            return;
        }

        showSuccess(THREAD_MESSAGES.SUCCESS.CREATE);
        setTimeout(onSuccess, 2000);
    } catch (err: any) {
        showError(err?.response?.data?.message ?? err?.message ?? THREAD_MESSAGES.ERROR.CREATE);
    } finally {
        setFormLoading?.(false);
    }
};

const handleUpdateThread = async (
    thread_id: number,
    newThread: NewThread,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    onSuccess: () => void = () => { },
    setFormLoading?: Dispatch<SetStateAction<boolean>>
): Promise<void> => {
    try {
        setFormLoading?.(true);
        const validationError = validateThreadInputs(newThread);
        if (validationError) {
            showError(validationError);
            return;
        }

        const response = await InteractiveThread.updateThread(thread_id, newThread);

        if (!handleApiResponse(response, 200, THREAD_MESSAGES.ERROR.UPDATE, showError)) {
            return;
        }

        showSuccess(THREAD_MESSAGES.SUCCESS.UPDATE);
        setTimeout(onSuccess, 2000);
    } catch (err: any) {
        showError(err?.response?.data?.message ?? err?.message ?? THREAD_MESSAGES.ERROR.UPDATE);
    } finally {
        setFormLoading?.(false);
    }
};

const handleDeleteThread = async (
    thread_id: number,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    setFormLoading?: Dispatch<SetStateAction<boolean>>,
    onSuccess?: () => void
): Promise<void> => {
    try {
        setFormLoading?.(true);
        const response = await InteractiveThread.deleteThread(thread_id);

        if (!handleApiResponse(response, 200, THREAD_MESSAGES.ERROR.DELETE, showError)) {
            return;
        }

        showSuccess(THREAD_MESSAGES.SUCCESS.DELETE);
        setTimeout(() => onSuccess?.(), 2000);
    } catch (err: any) {
        showError(err?.response?.data?.message ?? err?.message ?? THREAD_MESSAGES.ERROR.DELETE);
    } finally {
        setFormLoading?.(false);
    }
};

const loadThreadsByCategory = async (
    category_id: number,
    setThreads: Dispatch<SetStateAction<ThreadDropdown[]>>,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success
): Promise<void> => {
    try {
        const response = await InteractiveCategory.getThreadsSummaryByCategory(category_id);

        if (!handleApiResponse(response, 200, "Failed to load threads by category", showError)) {
            return;
        }

        setThreads(response.data?.threads || []);
        showSuccess("Threads by category loaded successfully");
    } catch (err: any) {
        showError(err?.response?.data?.message ?? err?.message ?? "Failed to load threads by category");
    }
};

export default {
    validateThreadInputs,
    loadThreads,
    loadSummaryThreads,
    loadPopularThreads,
    loadThreadByID,
    loadPostsAndThreadByCategory,
    handleCreateThread,
    handleUpdateThread,
    handleDeleteThread,
    loadThreadsByCategory
};