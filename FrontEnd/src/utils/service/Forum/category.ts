// src/utils/api/forum/category-actions.ts
import { Dispatch, SetStateAction } from "react";
import { toast } from "react-toastify";

import InteractiveCategory from "../../../utils/api/Forum/category";
import { Category, NewCategory, SummaryCategory } from "../../../types/forum/category";
import { PaginationData } from "../../../types/forum/pagination";
import { Thread } from "../../../types/forum/thread";
import { FORUM_MESSAGES, buildDetailedErrors } from "../../constants/forum-messages";

const validateInputs = (category: NewCategory): string | null => {
    const { category_name, description } = category;
    const trimmedName = category_name.trim();
    const trimmedDesc = description?.trim() || "";

    if (!trimmedName) return FORUM_MESSAGES.ERROR.CATEGORY.VALIDATION.NAME_REQUIRED;
    if (trimmedName.length < 3 || trimmedName.length > 50) {
        return FORUM_MESSAGES.ERROR.CATEGORY.VALIDATION.NAME_LENGTH;
    }
    if (trimmedDesc && (trimmedDesc.length < 10 || trimmedDesc.length > 200)) {
        return FORUM_MESSAGES.ERROR.CATEGORY.VALIDATION.DESC_LENGTH;
    }
    return null;
};

const handleApiError = (
    error: any,
    defaultMessage: string,
    showError: (message: string) => void
): void => {
    const errorMessage = error?.response?.data?.message
        || error?.message
        || defaultMessage;
    const detailedErrors = buildDetailedErrors(error?.response?.data);

    showError(`${errorMessage}${detailedErrors ? `\n${detailedErrors}` : ''}`);
};

const loadCategories = async (
    setLoading: Dispatch<SetStateAction<boolean>>,
    setCategories: Dispatch<SetStateAction<Category[]>>,
    setPagination: Dispatch<SetStateAction<PaginationData>>,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'name',
    sortOrder: string = 'ASC'
): Promise<void> => {
    try {
        setLoading(true);
        const response = await InteractiveCategory.getAllCategories(page, limit, sortBy, sortOrder);

        if (response.status !== 200 || !response.data?.success) {
            handleApiError(
                response.data,
                FORUM_MESSAGES.ERROR.CATEGORY.LOAD,
                showError
            );
            return;
        }

        setCategories(response.data.categories ?? []);
        setPagination(response.data.pagination ?? {});
        showSuccess(FORUM_MESSAGES.SUCCESS.CATEGORY.LOAD);
    } catch (error) {
        handleApiError(
            error,
            FORUM_MESSAGES.ERROR.GENERIC.SERVER,
            showError
        );
    } finally {
        setLoading(false);
    }
};

const loadSummaryCategories = async (
    onSuccess: (categories: SummaryCategory[]) => void,
    onError: (error: string) => void = toast.error
): Promise<void> => {
    try {
        const response = await InteractiveCategory.getSummaryCategories();

        if (response.status !== 200 || !response.data?.success) {
            onError(response.data?.message || FORUM_MESSAGES.ERROR.CATEGORY.LOAD);
            return;
        }

        onSuccess(response.data.categories ?? []);
    } catch (error) {
        handleApiError(
            error,
            FORUM_MESSAGES.ERROR.CATEGORY.LOAD,
            onError
        );
    }
};

const loadPopularCategories = async (
    onSuccess: (categories: SummaryCategory[]) => void,
    onError: (error: string) => void = toast.error
): Promise<void> => {
    try {
        const response = await InteractiveCategory.getPopularCategories();

        if (response.status !== 200 || !response.data?.success) {
            onError(response.data?.message || FORUM_MESSAGES.ERROR.CATEGORY.LOAD);
            return;
        }

        onSuccess(response.data.categories ?? []);
    } catch (error) {
        handleApiError(
            error,
            FORUM_MESSAGES.ERROR.CATEGORY.LOAD,
            onError
        );
    }
};

const loadCategoryById = async (
    id: number,
    setLoading: Dispatch<SetStateAction<boolean>>,
    setCategory: Dispatch<SetStateAction<Category | null>>,
    showError: (message: string) => void = toast.error,
    onSuccess: () => void = () => { }
): Promise<void> => {
    try {
        setLoading(true);
        const response = await InteractiveCategory.getCategoryById(id);

        if (response.status !== 200 || !response.data?.success) {
            handleApiError(
                response.data,
                FORUM_MESSAGES.ERROR.CATEGORY.LOAD_SINGLE,
                showError
            );
            return;
        }

        setCategory(response.data.category || null);
        onSuccess();
    } catch (error) {
        handleApiError(
            error,
            FORUM_MESSAGES.ERROR.CATEGORY.LOAD_SINGLE,
            showError
        );
    } finally {
        setLoading(false);
    }
};

const handleCreateCategory = async (
    newCategory: NewCategory,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    onSuccess: () => void = () => { },
    setFormLoading?: Dispatch<SetStateAction<boolean>>
): Promise<void> => {
    try {
        setFormLoading?.(true);
        const validationError = validateInputs(newCategory);
        if (validationError) {
            showError(validationError);
            return;
        }

        const response = await InteractiveCategory.createCategory({
            category_name: newCategory.category_name.trim(),
            description: newCategory.description?.trim(),
        });

        if (response.status !== 201 || !response.data?.success) {
            handleApiError(
                response.data,
                FORUM_MESSAGES.ERROR.CATEGORY.CREATE,
                showError
            );
            return;
        }

        showSuccess(FORUM_MESSAGES.SUCCESS.CATEGORY.CREATE);
        setTimeout(onSuccess, 2000);
    } catch (error) {
        handleApiError(
            error,
            FORUM_MESSAGES.ERROR.CATEGORY.CREATE,
            showError
        );
    } finally {
        setFormLoading?.(false);
    }
};

const handleUpdateCategory = async (
    categoryId: number,
    updatedCategory: NewCategory,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    onSuccess: () => void = () => { },
    setFormLoading?: Dispatch<SetStateAction<boolean>>
): Promise<void> => {
    try {
        setFormLoading?.(true);
        const validationError = validateInputs(updatedCategory);
        if (validationError) {
            showError(validationError);
            return;
        }

        const response = await InteractiveCategory.updateCategory(categoryId, updatedCategory);

        if (response.status !== 200 || !response.data?.success) {
            handleApiError(
                response.data,
                FORUM_MESSAGES.ERROR.CATEGORY.UPDATE,
                showError
            );
            return;
        }

        showSuccess(FORUM_MESSAGES.SUCCESS.CATEGORY.UPDATE);
        setTimeout(onSuccess, 2000);
    } catch (error) {
        handleApiError(
            error,
            FORUM_MESSAGES.ERROR.CATEGORY.UPDATE,
            showError
        );
    } finally {
        setFormLoading?.(false);
    }
};

const handleDeleteCategory = async (
    id: number,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    setFormLoading?: Dispatch<SetStateAction<boolean>>,
    onSuccess?: () => void
): Promise<void> => {
    try {
        setFormLoading?.(true);
        const response = await InteractiveCategory.deleteCategory(id);

        if (response.status !== 200 || !response.data?.success) {
            handleApiError(
                response.data,
                FORUM_MESSAGES.ERROR.CATEGORY.DELETE,
                showError
            );
            return;
        }

        showSuccess(FORUM_MESSAGES.SUCCESS.CATEGORY.DELETE);
        setTimeout(() => onSuccess?.(), 2000);
    } catch (error) {
        handleApiError(
            error,
            FORUM_MESSAGES.ERROR.CATEGORY.DELETE,
            showError
        );
    } finally {
        setFormLoading?.(false);
    }
};

const loadThreadsAndCategoryByCategory = async (
    id: string,
    setLoading: Dispatch<SetStateAction<boolean>>,
    setCategory: Dispatch<SetStateAction<Category | null>>,
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
        const response = await InteractiveCategory.getThreadsByCategory(
            Number(id),
            page,
            limit,
            sortBy,
            sortOrder
        );

        if (response.status !== 200 || !response.data?.success) {
            handleApiError(
                response.data,
                FORUM_MESSAGES.ERROR.THREAD.LOAD,
                showError
            );
            return;
        }

        setCategory(response.data.category ?? null);
        setThreads(response.data.threads ?? []);
        setPagination(response.data.pagination ?? {});
        showSuccess(FORUM_MESSAGES.SUCCESS.THREAD.LOAD);
    } catch (error) {
        handleApiError(
            error,
            FORUM_MESSAGES.ERROR.THREAD.LOAD,
            showError
        );
    } finally {
        setLoading(false);
    }
};

export default {
    loadCategories,
    loadSummaryCategories,
    loadPopularCategories,
    loadCategoryById,
    handleCreateCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    loadThreadsAndCategoryByCategory
};