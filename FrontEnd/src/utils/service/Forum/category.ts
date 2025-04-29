import {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getThreadsByCategory,
} from "../../../utils/api/Forum/category";
import { Category, NewCategory, CategoryMain } from "../../../types/forum";

export const loadCategories = async (
    setLoading: (loading: boolean) => void,
    setCategories: (tags: CategoryMain) => void,
    setError: (msg: string) => void,
    setSuccess: (msg: string) => void
) => {
    try {
        setLoading(true);

        const response = await getAllCategories();
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            const errorMsg = data?.message || "Unknown error occurred while loading categories.";
            setError(`Không thể tải categories: ${errorMsg}`);
            return;
        }

        setCategories(data.data);
        setSuccess("Tải danh sách categories thành công");
    } catch (err: any) {
        const errorMsg =
            err?.response?.data?.message ||
            err.message ||
            "Đã xảy ra lỗi khi tải danh sách category";
        setError(errorMsg);
    } finally {
        setLoading(false);
    }
};

export const handleCreateCategory = async (
    newCategory: NewCategory,
    setFormLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setError: React.Dispatch<React.SetStateAction<string>>,
    setSuccess: React.Dispatch<React.SetStateAction<string>>,
    loadCategories: () => void
) => {
    if (!newCategory.category_name || newCategory.category_name.trim().length < 3) {
        setError("Category name must be at least 3 characters long.");
        return;
    }
    try {
        setFormLoading(true);
        const response = await createCategory(newCategory);
        if (response?.data) {
            setSuccess("Category created successfully!");
            loadCategories(); // Reload categories after creation
        } else {
            setError("Failed to create category.");
        }
    } catch (error) {
        setError("Failed to create category. Please try again later.");
        console.error("Error creating category:", error);
    } finally {
        setFormLoading(false);
    }
};

export const handleUpdateCategory = async (
    editingCategory: Category,
    setFormLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setError: React.Dispatch<React.SetStateAction<string>>,
    setSuccess: React.Dispatch<React.SetStateAction<string>>,
    loadCategories: () => void
) => {
    try {
        setFormLoading(true);
        if (!editingCategory.category_name || editingCategory.category_name.trim().length < 3) {
            setError("Category name must be at least 3 characters long.");
            return;
        }
        const response = await updateCategory(editingCategory.category_id, editingCategory);
        if (response?.data) {
            setSuccess("Category updated successfully!");
            loadCategories();
        } else {
            setError("Failed to update category.");
        }
    } catch (error) {
        setError("Failed to update category. Please try again later.");
        console.error("Error updating category:", error);
    } finally {
        setFormLoading(false);
    }
};

export const handleDeleteCategory = async (
    id: number,
    setFormLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setError: React.Dispatch<React.SetStateAction<string>>,
    setSuccess: React.Dispatch<React.SetStateAction<string>>,
    loadCategories: () => void
) => {
    try {
        setFormLoading(true);
        const response = await deleteCategory(id);
        if (response?.data) {
            setSuccess("Category deleted successfully!");
            loadCategories(); // Reload categories after deletion
        } else {
            setError("Failed to delete category.");
        }
    } catch (error) {
        setError("Failed to delete category. Please try again later.");
        console.error("Error deleting category:", error);
    } finally {
        setFormLoading(false);
    }
};

export const handleInputChange = (
    field: string,
    value: string,
    setNewCategory: React.Dispatch<React.SetStateAction<any>>
) => {
    setNewCategory((prev: any) => ({ ...prev, [field]: value }));
};

export const loadSingleCategory = async (
    id: string,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setCategory: React.Dispatch<React.SetStateAction<Category | null>>,
    setError: React.Dispatch<React.SetStateAction<string>>
) => {
    try {
        setLoading(true);
        const response = await getCategoryById(Number(id));
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

export const loadThreadsByCategory = async (
    id: string,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setCategory: React.Dispatch<React.SetStateAction<Category | null>>,
    setThreads: React.Dispatch<React.SetStateAction<any[]>>,
    setError: React.Dispatch<React.SetStateAction<string>>
) => {
    try {
        setLoading(true);
        const response = await getThreadsByCategory(Number(id));
        // alert(JSON.stringify(response.data.threads));
        if (response?.data) {
            setCategory(response.data.data);
            setThreads(response.data.threads);
        } else {
            setError("Failed to load threads.");
        }
    } catch (error) {
        setError("Failed to load threads. Please try again later.");
        console.error("Error loading threads:", error);
    } finally {
        setLoading(false);
    }
};