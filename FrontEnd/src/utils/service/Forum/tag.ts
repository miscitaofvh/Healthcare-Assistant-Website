import { Dispatch, SetStateAction } from "react";
import { toast } from "react-toastify";
import InteractTag from "../../../utils/api/Forum/tag";
import { Tag, NewTag, SummaryTag } from "../../../types/Forum/tag";
import { PostbyTag } from "../../../types/Forum/post";
import { PaginationData } from "../../../types/Forum/pagination";
import { set } from "date-fns";
import { on } from "events";

const validateTagInputs = (tag: NewTag): string | null => {
    const tagName = tag.tag_name.trim();
    const description = tag.description?.trim() || "";

    if (!tagName) return "Tag name is required";
    if (tagName.length < 2 || tagName.length > 30) {
        return "Tag name must be from 2 to 30 characters";
    }
    if (description && (description.length < 5 || description.length > 150)) {
        return "Description must be from 5 to 150 characters long";
    }
    return null;
};

const loadTags = async (
    setLoading: Dispatch<SetStateAction<boolean>>,
    setTags: Dispatch<SetStateAction<Tag[]>>,
    setPagination: Dispatch<SetStateAction<PaginationData>>,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'tag_name',
    sortOrder: string = 'ASC'
): Promise<void> => {
    try {
        setLoading(true);

        const response = await InteractTag.getAllTags(page, limit, sortBy, sortOrder);
        
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            showError(data?.message ?? "Error occurred while loading tags.");
            return;
        }

        setTags(data.tags ?? []);
        setPagination(data.pagination ?? {
            currentPage: page,
            totalPages: 1,
            limit,
            totalItems: 0,
            sortBy,
            sortOrder
        });

        showSuccess(data.message || "Tags loaded successfully!");
    } catch (err: any) {
        const errorMsg = err?.response?.data?.message ?? err?.message ?? "Error occurred while loading tags.";
        showError(errorMsg);
    } finally {
        setLoading(false);
    }
};

const loadTagByID = async (
    id: number,
    setLoading: Dispatch<SetStateAction<boolean>>,
    setTag: Dispatch<SetStateAction<Tag | null>>,
    showError: (message: string) => void = toast.error,
    onSuccess: () => void
): Promise<void> => {
    try {
        setLoading(true);
        
        const response = await InteractTag.getTagById(id);
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            showError(data?.message ?? "Unknown server error occurred");
            return;
        }

        setTag(data.tag || null);
        onSuccess();
    } catch (err: unknown) {
        const errorMsg = (err as any)?.response?.data?.message ?? 
                        (err instanceof Error ? err.message : "Failed to load tag");
        showError(errorMsg);
    } finally {
        setLoading(false);
    }
};

const loadTagsSummary = async (
    setLoading: Dispatch<SetStateAction<boolean>>,
    setTags: (tags: SummaryTag[]) => void,
    showError: (message: string) => void = toast.error,
    onSuccess?: () => void
    
): Promise<void> => {
    try {
        setLoading(true);

        const response = await InteractTag.getAllTagsSummary();

        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            showError(data?.message ?? "Unknown server error occurred");
            return;
        }

        setTags(data.tags ?? []);
        onSuccess?.();

    } catch (err: any) {
        const errorMsg = err?.response?.data?.message ?? err?.message ?? "Error occurred while loading tag summary";
        showError(errorMsg);
    } finally {
        setLoading(false);
    }
};

const loadTagsPostSummary = async (
    setTagsLoading: Dispatch<SetStateAction<boolean>>,
    setTags: (tags: SummaryTag[]) => void,
    showError: (message: string) => void = toast.error,
    onSuccess: () => void,
): Promise<void> => {
    try {
        setTagsLoading(true);
        const response = await InteractTag.getAllTagsLittleSummary();
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            showError(data?.message ?? "Unknown server error occurred");
            return;
        }

        setTags(data.tags ?? []);
        onSuccess?.();
    } catch (err: any) {
        const errorMsg = err?.response?.data?.message ?? err?.message ?? "Error occurred while loading tag post summary";
        showError(errorMsg);
    } finally {
        setTagsLoading(false);
    }
};

const loadPostsandTagByTag = async (
    id: string,
    setLoading: Dispatch<SetStateAction<boolean>>,
    setTag: Dispatch<SetStateAction<Tag | null>>,
    setPosts: Dispatch<SetStateAction<PostbyTag[]>>,
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

        const response = await InteractTag.getPostsByTag(
            Number(id),
            page,
            limit,
            sortBy,
            sortOrder
        );

        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            showError(data?.message ?? "Error occurred while loading tag posts.");
            return;
        }

        setTag(data.tag ?? null);
        setPosts(data.posts ?? []);
        setPagination(prev => ({
            ...prev,
            ...data.pagination,
            currentPage: page,
            limit,
            sortBy,
            sortOrder
        }));

        showSuccess(data.message || "Tag posts loaded successfully!");
    } catch (err: any) {
        const errorMsg = err?.response?.data?.message ?? err?.message ?? "Error occurred while loading tag posts.";
        showError(errorMsg);
    } finally {
        setLoading(false);
    }
};

const handleCreateTag = async (
    tag: NewTag,
    showError: (message: string) => void = toast.error,
    onSuccess: () => void,
    setFormLoading?: Dispatch<SetStateAction<boolean>>
): Promise<void> => {
    try {
        setFormLoading?.(true);
        
        const validationError = validateTagInputs(tag);
        if (validationError) {
            showError(validationError);
            return;
        }

        const response = await InteractTag.createTag(tag);
        const { status, data } = response;

        if (status !== 201 || !data?.success) {
            const defaultMsg = "Failed to create tag.";
            const errorMsg = typeof data === "string" ? data : data?.message || "Unknown error occurred when creating tag.";
            const detailedMsg = Array.isArray(data?.errors) && data.errors.length > 0
                ? data.errors.map((err: { message: string }) => err.message).join("\n")
                : "";

            showError(`${defaultMsg}\n${errorMsg}${detailedMsg ? `\n${detailedMsg}` : ""}`);
            return;
        }

        toast.success(data?.message || "Tag created successfully!");
        setTimeout(onSuccess, 2000);
    } catch (err: any) {
        const errorMessage = err?.response?.data?.message ?? err.message ?? "Failed to create tag.";
        showError(errorMessage);
    } finally {
        setFormLoading?.(false);
    }
};

const handleUpdateTag = async (
    id: number,
    tag: NewTag,
    showError: (message: string) => void = toast.error,
    onSuccess: () => void,
    setFormLoading?: Dispatch<SetStateAction<boolean>>
): Promise<void> => {
    try {
        setFormLoading?.(true);
        
        const validationError = validateTagInputs(tag);
        if (validationError) {
            showError(validationError);
            return;
        }

        const response = await InteractTag.updateTag(id, tag);
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            const defaultMsg = "Failed to update tag.";
            const errorMsg = typeof data === "string" ? data : data?.message || "Unknown error occurred when updating tag.";
            const detailedMsg = Array.isArray(data?.errors) && data.errors.length > 0
                ? data.errors.map((err: { message: string }) => err.message).join("\n")
                : "";

            showError(`${defaultMsg}\n${errorMsg}${detailedMsg ? `\n${detailedMsg}` : ""}`);
            return;
        }

        toast.success(data?.message || "Tag updated successfully!");
        setTimeout(onSuccess, 2000);
    } catch (err: any) {
        const errorMessage = err?.response?.data?.message ?? err.message ?? "Failed to update tag.";
        showError(errorMessage);
    } finally {
        setFormLoading?.(false);
    }
};

const handleDeleteTag = async (
    id: number,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    setFormLoading?: Dispatch<SetStateAction<boolean>>,
    onSuccess?: () => void
): Promise<void> => {
    try {
        setFormLoading?.(true);

        const response = await InteractTag.deleteTag(id);
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            const defaultMsg = "Failed to delete tag.";
            const errorMsg = typeof data === "string" ? data : data?.message || "Unknown error occurred when deleting tag.";
            const detailedMsg = Array.isArray(data?.errors) && data.errors.length > 0
                ? data.errors.map((err: { message: string }) => err.message).join("\n")
                : "";

            showError(`${defaultMsg}\n${errorMsg}${detailedMsg ? `\n${detailedMsg}` : ""}`);
            return;
        }

        showSuccess(data?.message || "Tag deleted successfully!");
        setTimeout(() => {
            onSuccess?.();
        }, 2000);
    } catch (err: any) {
        const errorMessage = err?.response?.data?.message ?? err.message ?? "Failed to delete tag.";
        showError(errorMessage);
    } finally {
        setFormLoading?.(false);
    }
};

export default {
    validateTagInputs,
    loadTags,
    loadTagByID,
    loadTagsSummary,
    loadTagsPostSummary,
    loadPostsandTagByTag,
    handleCreateTag,
    handleUpdateTag,
    handleDeleteTag
};