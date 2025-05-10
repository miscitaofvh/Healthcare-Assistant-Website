import { toast } from "react-toastify";
import InteractiveCategory from "../../../utils/api/Forum/category";
import { Category, NewCategory, CategoryMain, CategorySummary, PaginationData, Thread } from "../../../types/forum";
import { Dispatch, SetStateAction } from "react";

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

export const loadCategories = async (
    setLoading: Dispatch<SetStateAction<boolean>>,
    setCategories: Dispatch<SetStateAction<CategoryMain[]>>,
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

export const loadCategoriesSummary = async (
    setLoading: Dispatch<SetStateAction<boolean>>,
    setCategories: Dispatch<SetStateAction<CategorySummary[]>>,
    setError: Dispatch<SetStateAction<string>>,
    setSuccess: Dispatch<SetStateAction<string>>
): Promise<void> => {
    try {
        setLoading(true);
        const response = await InteractiveCategory.getSummaryCategories();
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            setError(data?.message ?? "Lỗi không xác định từ máy chủ.");
            setSuccess("");
        }

        setCategories(data.categories ?? []);
        setSuccess("Tải danh sách categories thành công");
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

export const loadCategorieById = async (
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

export const handleCreateCategory = async (
    newCategory: NewCategory,
    showError: (message: string) => void = toast.error,
    onSuccess: () => void,
    setFormLoading?: Dispatch<SetStateAction<boolean>> // Optional for backward compatibility
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
            description: trimmedDescription || undefined,
        });

        const { status, data } = response;
        if (status !== 201 || !data?.success) {
            const errorMsg = data?.message || "Unknown error occurred while creating category.";
            showError(`Không thể tạo category: ${errorMsg}`);
            return;
        }

        onSuccess();

    } catch (err: any) {
        const errorMessage = err?.response?.data?.message ?? err.message ?? "Failed to create category.";
        showError(errorMessage);
        console.error("Category creation error:", err);
    } finally {
        setFormLoading?.(false);
    }
};

export const handleUpdateCategory = async (
    categoryId: number,
    updatedCategory: NewCategory,
    showError: (message: string) => void = toast.error,
    onSuccess: () => void,
    setFormLoading?: Dispatch<SetStateAction<boolean>> // Optional for backward compatibility
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
            const errorMsg = data?.message || "Unknown error occurred while updating category.";
            showError(`Cannot update category: ${errorMsg}`);
        }

        toast.success(data?.message || "Category updated successfully!");
        onSuccess();

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

export const handleDeleteCategory = async (
    id: number,
    setFormLoading: Dispatch<SetStateAction<boolean>>,
    setError: Dispatch<SetStateAction<string>>,
    setSuccess: Dispatch<SetStateAction<string>>,
    loadCategories: () => void
): Promise<void> => {
    try {
        setFormLoading(true);
        setError("");
        setSuccess("");

        const response = await InteractiveCategory.deleteCategory(id);

        const success = response?.data?.success;
        const message = response?.data?.message || "Category deleted successfully.";

        if (!success) {
            throw new Error(response?.data?.message || "Failed to delete category.");
        }

        setSuccess(message);

        setTimeout(() => {
            loadCategories();
        }, 2000);

    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : "An unexpected error occurred while deleting the category.";

        setError(errorMessage);
        console.error("Error deleting category:", error);
    } finally {
        setFormLoading(false);
    }
};

export const handleInputChange = (
    field: string,
    value: string,
    setNewCategory: Dispatch<SetStateAction<any>>
) => {
    setNewCategory((prev: any) => ({ ...prev, [field]: value }));
};

export const loadSingleCategory = async (
    id: string,
    setLoading: Dispatch<SetStateAction<boolean>>,
    setCategory: Dispatch<SetStateAction<Category | null>>,
    setError: Dispatch<SetStateAction<string>>
) => {
    try {
        setLoading(true);
        const response = await InteractiveCategory.getCategoryById(Number(id));
        if (response?.data) {
            setCategory(response.data.data);
        } else {
            setError("Failed to load category.");
        }
    } catch (error) {
        setError("Failed to load category. Please try again later.");
        console.error("Error loading category:", error);
    } finally {
        setLoading(false);
    }
};

export const loadThreadsandCategoryByCategory = async (
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