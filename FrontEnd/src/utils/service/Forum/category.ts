import { Dispatch, SetStateAction } from "react";
import { toast } from "react-toastify";

import InteractiveCategory from "../../../utils/api/Forum/category";
import { Category, NewCategory, SummaryCategory } from "../../../types/Forum/category";
import { PaginationData } from "../../../types/Forum/pagination";
import { Thread } from "../../../types/Forum/thread";

const validateInputs = (category: NewCategory): string | null => {
    const categoryName = category.category_name.trim();
    const description = category.description?.trim() || "";

    if (!categoryName) return "Category name is required";
    if (categoryName.length < 3 || categoryName.length > 50) {
        return "Category name must be from 3 to 50 characters";
    }
    if (description && (description.length < 10 || description.length > 200)) {
        return "Description must be from 10 to 200 characters long";
    }
    return null;
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

        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            showError(data?.message ?? "Error occurred while loading categories.");
            return;
        }

        setCategories(data.categories ?? []);
        setPagination(data.pagination ?? "");
        showSuccess(data.message || "Categories loaded successfully!");
    } catch (err: any) {
        const errorMsg =
            err?.response?.data?.message ??
            err?.message ??
            "Error occurred while loading categories.";
        showError(errorMsg);
    } finally {
        setLoading(false);
    }
};

const loadCategoriesSummary = async (
    onSuccess: (categories: SummaryCategory[]) => void,
    onError: (error: string) => void
): Promise<void> => {
    try {
        const response = await InteractiveCategory.getSummaryCategories();
        
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            onError(data?.message ?? "Lỗi không xác định từ máy chủ.");
            return;
        }

        onSuccess(data.categories ?? []);
    } catch (err: any) {
        const errorMsg =
            err?.response?.data?.message ??
            err?.message ??
            "Đã xảy ra lỗi khi tải danh sách category";
        onError(errorMsg);
    }
};

const loadCategorieById = async (
    id: number,
    setLoading: Dispatch<SetStateAction<boolean>>,
    setCategory: Dispatch<SetStateAction<Category | null>>,
    showError: (message: string) => void = toast.error,
    onSuccess: () => void,
): Promise<void> => {
    try {
        setLoading(true);
        const response = await InteractiveCategory.getCategoryById(id);
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            showError(data?.message ?? "Unknown server error occurred");
            return;
        }

        setCategory(data.category || null);
        onSuccess();
    } catch (err: unknown) {
        const errorMsg =
            (err as any)?.response?.data?.message ??
            (err instanceof Error ? err.message : "Failed to load category");
        showError(errorMsg);
    } finally {
        setLoading(false);
    }
};

const handleCreateCategory = async (
    newCategory: NewCategory,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    onSuccess: () => void,
    setFormLoading?: Dispatch<SetStateAction<boolean>>
): Promise<void> => {
    const trimmedName = newCategory.category_name.trim();
    const trimmedDescription = newCategory.description?.trim();

    try {
        setFormLoading?.(true);
        const validationError = validateInputs(newCategory);
        if (validationError) {
            showError(validationError);
            return;
        }
        const response = await InteractiveCategory.createCategory({
            category_name: trimmedName,
            description: trimmedDescription,
        });

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
        showSuccess("Category created successfully!");
        setTimeout(() => {
            onSuccess();
        }, 2000);
    } catch (err: any) {
        const errorMessage = err?.response?.data?.message ?? err.message ?? "Failed to create category.";
        showError(errorMessage);
    } finally {
        setFormLoading?.(false);
    }
};

const handleUpdateCategory = async (
    categoryId: number,
    updatedCategory: NewCategory,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    onSuccess: () => void,
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
            onSuccess();
        }, 2000);
    } catch (error: unknown) {
        console.error("Error updating category:", error);

        let errorMessage = "Failed to update category. Please try again.";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }

        showError(errorMessage);
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

        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            const defaultMsg = "Không thể xóa danh mục.";
            const errorMsg = typeof data === "string" ? data : data?.message || "Lỗi không xác định khi xóa danh mục.";
            const detailedMsg = Array.isArray(data?.errors) && data.errors.length > 0
                ? data.errors.map((err: { message: string }) => err.message).join("\n")
                : "";

            showError(`${defaultMsg}\n${errorMsg}${detailedMsg ? `\n${detailedMsg}` : ""}`);
            return;
        }
        showSuccess(data?.message || "Category deleted successfully!");

        setTimeout(() => {
            onSuccess?.();
        }, 2000);

    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : "An unexpected error occurred while deleting the category.";

        showError(errorMessage);
    } finally {
        setFormLoading?.(false);
    }
};

const loadThreadsandCategoryByCategory = async (
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
        
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            showError(data?.message ?? "Error occurred while loading category threads.");
            return;
        }

        setCategory(data.category ?? null);
        setThreads(data.threads ?? []);
        setPagination(data.pagination ?? "");

        showSuccess(data.message || "Category threads loaded successfully!");
    } catch (err: any) {
        const errorMsg =
            err?.response?.data?.message ??
            err?.message ??
            "Error occurred while loading category threads.";
        showError(errorMsg);
    } finally {
        setLoading(false);
    }
};

export default {
    loadCategories,
    loadCategoriesSummary,
    loadCategorieById,
    handleCreateCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    loadThreadsandCategoryByCategory
}