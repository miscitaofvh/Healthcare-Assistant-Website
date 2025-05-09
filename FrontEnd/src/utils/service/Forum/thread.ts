import {
    getAllThreads,
    getSummaryThreads,
    createThread,
    updateThread,
    deleteThread,
    getThreadById,
    getPostsByThread
} from "../../../utils/api/Forum/thread";
import { Thread, NewThread, Post, ThreadSummary, ThreadDropdown } from "../../../types/forum";
import InteractiveCategory from "../../../utils/api/Forum/category";
import { Dispatch, SetStateAction } from "react";

export const loadThreads = async (
    setLoading: Dispatch<SetStateAction<boolean>>,
    setThreads: Dispatch<SetStateAction<Thread[]>>,
    setError: Dispatch<SetStateAction<string>>,
    setSuccess: Dispatch<SetStateAction<string>>
): Promise<void> => {
    try {
        setLoading(true);
        const response = await getAllThreads();
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            setError(data?.message ?? "Internal server error.");
            setSuccess("");
        }
        setThreads(data.threads ?? []);
        setSuccess("Threads loaded successfully");
        setError("");
    } catch (err: any) {
        const errorMsg =
            err?.response?.data?.message ??
            err?.message ??
            "Failed to load threads.";
        setError(errorMsg);
        setSuccess("");
    } finally {
        setLoading(false);
    }
};

export const loadThreadByID = async (
    id: number,
    setLoading: Dispatch<SetStateAction<boolean>>,
    setThread: Dispatch<SetStateAction<ThreadSummary | null>>,
    setError: Dispatch<SetStateAction<string>>,
    setSuccess: Dispatch<SetStateAction<string>>
): Promise<void> => {
    try {
        setLoading(true);
        const response = await getThreadById(id);

        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            setError(data?.message ?? "Lỗi không xác định từ máy chủ.");
            setSuccess("");
        }
        setThread(data.thread || null);
        setSuccess("Tải danh sách threads thành công");
        setError("");
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

export const loadPostsandThreadByCategory = async (
    id: string,
    setLoading: Dispatch<SetStateAction<boolean>>,
    setThread: Dispatch<SetStateAction<Thread | null>>,
    setPosts: Dispatch<SetStateAction<any[]>>,
    setError: Dispatch<SetStateAction<string>>,
    setSuccess: Dispatch<SetStateAction<string>>
) => {
    try {
        setLoading(true);
        const response = await getPostsByThread(Number(id));

        const { status, data } = response;
        if (status !== 200 || !data?.success) {
            const errorMsg = data?.message || "Unknown error occurred while loading threads.";
            setError(`Không thể tải threads: ${errorMsg}`);
            return;
        }

        if (response?.data) {
            setThread(data.thread);
            setPosts(data.posts || []);
        } else {
            setError("Failed to load Posts.");
        }
        setSuccess("Thread loaded successfully");
    } catch (error) {
        setError("Failed to load Posts. Please try again later.");
        console.error("Error loading Posts:", error);
    } finally {
        setLoading(false);
    }
};

export const handleCreateThread = async (
    newThread: NewThread,
    setFormLoading: Dispatch<SetStateAction<boolean>>,
    setError: Dispatch<SetStateAction<string>>,
    setSuccess: Dispatch<SetStateAction<string>>,
    onSuccess: () => void
): Promise<void> => {
    try {
        setFormLoading(true);
        setError("");
        setSuccess("");

        const response = await createThread(newThread);

        const { status, data } = response;
        if (status !== 201 || !data?.success) {
            const errorMsg = data?.message || "Unknown error occurred while loading threads.";
            setError(`Không thể tải threads: ${errorMsg}`);
            return;
        }

        setSuccess(data?.message || "Thread created successfully!");

        setTimeout(() => {
            onSuccess();
        }, 2000);

    } catch (err: any) {
        setError(err?.response?.data?.message ?? err.message ?? "Failed to create thread.");
        console.error("Thread creation error:", err);
    } finally {
        setFormLoading(false);
    }
};

export const handleUpdateThread = async (
    thread_id: number,
    newThread: NewThread,
    setFormLoading: Dispatch<SetStateAction<boolean>>,
    setError: Dispatch<SetStateAction<string>>,
    setSuccess: Dispatch<SetStateAction<string>>,
    onSuccess?: () => void
): Promise<void> => {
    try {
        setFormLoading(true);
        setError("");
        setSuccess("");

        const response = await updateThread(thread_id, newThread);

        const { status, data } = response;
        if (status !== 200 || !data?.success) {
            const errorMsg = data?.message || "Unknown error occurred while update thread.";
            setError(`Không thể cập nhật thread: ${errorMsg}`);
            return;
        }
        setSuccess(data?.message || "Thread updated successfully!");

        if (onSuccess) {
            setTimeout(() => {
                onSuccess();
            }, 2000);
        }

    } catch (err: any) {
        setError(err?.response?.data?.message ?? err.message ?? "Failed to create thread.");
        console.error("Thread creation error:", err);
    } finally {
        setFormLoading(false);
    }
};

export const loadThreadsByCategory = async (
    category_id: number,
    setThreads: Dispatch<SetStateAction<ThreadDropdown[] | []>>,
    setError: Dispatch<SetStateAction<string>>,
): Promise<void> => {
    try {
        setError("");

        const response = await InteractiveCategory.getThreadsSummaryByCategory(category_id);
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            const errorMsg = data?.message || "Unknown error occurred while update thread.";
            setError(`Không thể cập nhật thread: ${errorMsg}`);
            return;
        }

        setThreads(data?.threads || []);

    } catch (err: any) {
        setError(err?.response?.data?.message ?? err.message ?? "Failed to create thread.");
        console.error("Thread creation error:", err);
    } finally {
        setError("");}
};
