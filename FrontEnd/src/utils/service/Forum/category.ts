import { toast } from "react-toastify";
import InteractiveCategory from "../../../utils/api/Forum/category";
import { Category, NewCategory, CategoryMain, CategorySummary, PaginationData } from "../../../types/forum";
import { Dispatch, SetStateAction } from "react";

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
        setPagination({
            currentPage: data.page,
            totalPages: Math.ceil(data.totalCount / data.limit),
            limit: data.limit,
            totalCount: data.totalCount,
            sortBy: data.sortBy,
            sortOrder: data.sortOrder
        });
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
    setCategories: Dispatch<SetStateAction<Category | null>>,
    setError: Dispatch<SetStateAction<string>>,
    setSuccess: Dispatch<SetStateAction<string>>
): Promise<void> => {
    try {
        setLoading(true);
        const response = await InteractiveCategory.getCategoryById(id);
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            setError(data?.message ?? "Lỗi không xác định từ máy chủ.");
            setSuccess("");
            return;
        }

        setCategories(data.category || null);
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

export const handleCreateCategory = async (
    newCategory: NewCategory,
    setFormLoading: Dispatch<SetStateAction<boolean>>,
    setError: Dispatch<SetStateAction<string>>,
    setSuccess: Dispatch<SetStateAction<string>>,
    onSuccess: () => void
): Promise<void> => {
    const trimmedName = newCategory.category_name.trim();
    const trimmedDescription = newCategory.description?.trim();

    if (!trimmedName || trimmedName.length < 3 || trimmedName.length > 50) {
        setError("Category name must be between 3 and 50 characters.");
        return;
    }

    if (trimmedDescription && (trimmedDescription.length < 10 || trimmedDescription.length > 200)) {
        setError("Description must be between 10 and 200 characters.");
        return;
    }

    try {
        setFormLoading(true);
        setError("");
        setSuccess("");

        const response = await InteractiveCategory.createCategory({
            category_name: trimmedName,
            description: trimmedDescription || undefined,
        });

        const success = response?.data?.success;
        const message = response?.data?.message ?? "Category created successfully!";

        if (!success) {
            throw new Error(response?.data?.message ?? "Unknown error.");
        }

        setSuccess(message);

        setTimeout(() => {
            onSuccess();
        }, 2000);

    } catch (err: any) {
        setError(err?.response?.data?.message ?? err.message ?? "Failed to create category.");
        console.error("Category creation error:", err);
    } finally {
        setFormLoading(false);
    }
};

export const handleUpdateCategory = async (
    categoryId: number,
    updatedCategory: NewCategory,
    setFormLoading: Dispatch<SetStateAction<boolean>>,
    setError: Dispatch<SetStateAction<string>>,
    setSuccess: Dispatch<SetStateAction<string>>,
    onSuccessCallback?: () => void
): Promise<void> => {
    try {
        setError("");
        setSuccess("");
        setFormLoading(true);

        const response = await InteractiveCategory.updateCategory(categoryId, updatedCategory);

        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            const errorMsg = data?.message || "Unknown error occurred while updating category.";
            setError(`Không thể cập nhật category: ${errorMsg}`);
            return;
        }

        setSuccess("Category updated successfully!");

        if (onSuccessCallback) {
            setTimeout(() => {
                onSuccessCallback();
            }, 2000);
        }

    } catch (error: unknown) {
        console.error("Error updating category:", error);

        if (error instanceof Error) {
            setError(error.message || "Failed to update category. Please try again.");
        } else {
            setError("An unexpected error occurred. Please try again.");
        }
    } finally {
        setFormLoading(false);
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
    setThreads: Dispatch<SetStateAction<any[]>>,
    setError: Dispatch<SetStateAction<string>>,
    setSuccess: Dispatch<SetStateAction<string>>
) => {
    try {
        setLoading(true);
        setError("");
        setSuccess("");
        const response = await InteractiveCategory.getThreadsByCategory(Number(id));
        const { status, data } = response;
        if (status !== 200 || !data?.success) {
            const errorMsg = data?.message || "Unknown error occurred while loading category.";
            setError(`Can't load category: ${errorMsg}`);
            return;
        }

        if (response?.data) {
            setCategory(response.data.category);
            setThreads(response.data.threads || []);
        } else {
            setError("Failed to load threads.");
        }
        setSuccess("Category loaded successfully!");
    } catch (error) {
        setError("Failed to load category. Please try again later.");
        console.error("Error loading threads:", error);
    } finally {
        setLoading(false);
    }
};