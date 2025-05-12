import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import InteractiveThread from "../../../utils/api/Forum/thread";

import { Thread, NewThread, ThreadSummary, ThreadDropdown } from "../../../types/Forum/thread";
import { Post } from "../../../types/Forum/post";
import { PaginationData } from "../../../types/Forum/pagination";
import InteractiveCategory from "../../../utils/api/Forum/category";
import { Dispatch, SetStateAction } from "react";


const validateInputs = (thread: NewThread): string | null => {
    const threadName = thread.thread_name.trim();
    const description = thread.description?.trim() || "";

    if (!threadName) return "Category name is required";
    if (threadName.length < 3 || threadName.length > 50) {
        return "Category name must be from 3 to 50 characters";
    }
    if (description && (description.length < 10 || description.length > 200)) {
        return "Description must be from 10 to 200 characters long";
    }
    return null;
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
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            throw new Error(data?.message ?? "Failed to load threads");
        }

        setThreads(data.threads ?? []);
        setPagination({
            currentPage: data.page || page,
            totalPages: Math.ceil(data.totalCount / data.limit) || 1,
            limit: data.limit || limit,
            totalItems: data.totalCount || 0,
            sortBy: data.sortBy || sortBy,
            sortOrder: data.sortOrder || sortOrder
        });

        showSuccess("Threads loaded successfully");
    } catch (err: unknown) {
        const errorMsg =
            (err as any)?.response?.data?.message ??
            (err instanceof Error ? err.message : "Failed to load threads");
        showError(errorMsg);
    } finally {
        setLoading(false);
    }
};

const loadThreadByID = async (
    id: number,
    setLoading: Dispatch<SetStateAction<boolean>>,
    setThread: Dispatch<SetStateAction<ThreadSummary | null>>,
    showError: (message: string) => void = toast.error,
    onSuccess: () => void,
): Promise<void> => {
    try {
        setLoading(true);
        const response = await InteractiveThread.getThreadById(id);

        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            showError(data?.message ?? "Lỗi không xác định từ máy chủ.");
            return;
        }

        setThread(data.thread || null);
        onSuccess();
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

const loadPostsandThreadByCategory = async (
    threadId: string,
    setLoading: Dispatch<SetStateAction<boolean>>,
    setThread: Dispatch<SetStateAction<Thread | null>>,
    setPosts: Dispatch<SetStateAction<Post[]>>,
    setPagination: Dispatch<SetStateAction<PaginationData>>,
    errorCallback: (message: string) => void,
    successCallback: (message: string) => void,
    page: number = 1,
    limit: number = 10,
    sortBy: string = "created_at",
    sortOrder: string = "DESC"
) => {
    try {
        setLoading(true);
        const response = await InteractiveThread.getPostsByThread(
            Number(threadId),
            page,
            limit,
            sortBy,
            sortOrder
        );

        const { status, data } = response;
        if (status !== 200 || !data?.success) {
            const errorMsg = data?.message || "Unknown error occurred while loading thread data.";
            errorCallback(`Failed to load thread: ${errorMsg}`);
            return;
        }

        if (data?.thread) {
            setThread(data.thread);
            setPosts(data.posts || []);

            // Update pagination data from response
            setPagination(prev => ({
                ...prev,
                currentPage: page,
                totalPages: data.totalPages || 1,
                totalItems: data.totalItems || 0,
                limit: limit,
                sortBy: sortBy,
                sortOrder: sortOrder
            }));

            successCallback("Thread loaded successfully");
        } else {
            errorCallback("No thread data found in response.");
        }
    } catch (error: any) {
        errorCallback(error.message || "Failed to load thread data. Please try again later.");
        console.error("Error loading thread:", error);
    } finally {
        setLoading(false);
    }
};

const handleCreateThread = async (
    newThread: NewThread,
    showError: (error: string) => void,
    showSuccess: (message: string) => void = toast.success,
    onSuccess: () => void,
    setFormLoading?: Dispatch<SetStateAction<boolean>> // Optional for backward compatibility
): Promise<void> => {
    try {
        setFormLoading?.(true);

        const validationError = validateInputs(newThread);
        if (validationError) {
            showError(validationError);
            return;
        }

        const response = await InteractiveThread.createThread(newThread);

        const { status, data } = response;

        if (status !== 201 || !data?.success) {
            const defaultMsg = "Không thể tạo danh mục.";
            const errorMsg = typeof data === "string" ? data : data?.message || "Lỗi không xác định khi tạo danh mục.";
            const detailedMsg = Array.isArray(data?.errors) && data.errors.length > 0
                ? data.errors.map((err: { message: string }) => err.message).join("\n")
                : "";

            showError(`${defaultMsg}\n${errorMsg}${detailedMsg ? `\n${detailedMsg}` : ""}`);
            return;
        }

        showSuccess("Thread created successfully!");
        setTimeout(() => {
            onSuccess?.();
        }, 2000);
    } catch (err: any) {
        const errorMsg = err?.response?.data?.message ?? err.message ?? "Failed to create thread.";
        showError(errorMsg);
        console.error("Thread creation error:", err);
    } finally {
        setFormLoading?.(false);
    }
};

const handleUpdateThread = async (
    thread_id: number,
    newThread: NewThread,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    onSuccess: () => void,
    setFormLoading?: Dispatch<SetStateAction<boolean>> // Optional for backward compatibility
): Promise<void> => {
    try {
        setFormLoading?.(true);
        
        const validationError = validateInputs(newThread);
        if (validationError) {
            showError(validationError);
            return;
        }

        const response = await InteractiveThread.updateThread(thread_id, newThread);

        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            const defaultMsg = "Không thể tạo danh mục.";
            const errorMsg = typeof data === "string" ? data : data?.message || "Lỗi không xác định khi tạo danh mục.";
            const detailedMsg = Array.isArray(data?.errors) && data.errors.length > 0
                ? data.errors.map((err: { message: string }) => err.message).join("\n")
                : "";

            showError(`${defaultMsg}\n${errorMsg}${detailedMsg ? `\n${detailedMsg}` : ""}`);
            return;
        }

        showSuccess(data?.message || "Category updated successfully!");
        setTimeout(() => {
            onSuccess?.();
        }, 2000);

    } catch (err: any) {
        showError(err?.response?.data?.message ?? err.message ?? "Failed to create thread.");
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

        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            const defaultMsg = "Không thể tạo danh mục.";
            const errorMsg = typeof data === "string" ? data : data?.message || "Lỗi không xác định khi tạo danh mục.";
            const detailedMsg = Array.isArray(data?.errors) && data.errors.length > 0
                ? data.errors.map((err: { message: string }) => err.message).join("\n")
                : "";

            showError(`${defaultMsg}\n${errorMsg}${detailedMsg ? `\n${detailedMsg}` : ""}`);
            return;
        }

        showSuccess(data?.message || "Category updated successfully!");
        setTimeout(() => {
            onSuccess?.();
        }, 2000);

    } catch (err: any) {
        showError(err?.response?.data?.message ?? err.message ?? "Failed to create thread.");
    } finally {
        setFormLoading?.(false);
    }
};

const loadThreadsByCategory = async (
    category_id: number,
    setThreads: Dispatch<SetStateAction<ThreadDropdown[] | []>>,
    showError: (message: string) => void = toast.error
): Promise<void> => {
    try {
        const response = await InteractiveCategory.getThreadsSummaryByCategory(category_id);
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            const errorMsg = data?.message || "Unknown error occurred while update thread.";
            showError(`Không thể cập nhật thread: ${errorMsg}`);
            return;
        }

        setThreads(data?.threads || []);

    } catch (err: any) {
        showError(err?.response?.data?.message ?? err.message ?? "Failed to create thread.");
    }
};

export default {
    loadThreads,
    loadThreadByID,
    loadPostsandThreadByCategory,
    handleCreateThread,
    handleUpdateThread,
    handleDeleteThread,
    loadThreadsByCategory
};