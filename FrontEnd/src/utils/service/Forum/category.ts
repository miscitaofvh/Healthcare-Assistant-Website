import {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getThreadsByCategory,
} from "../../../utils/api/Forum/category";
import { Category, NewCategory } from "../../../types/forum";

export const loadCategories = async (
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>,
    setError: React.Dispatch<React.SetStateAction<string>>,
    setSuccess: React.Dispatch<React.SetStateAction<string>>
) => {
    try {
        setLoading(true);
        const response = await getAllCategories();
        if (response?.data) {
            setCategories(response.data.data);
        } else {
            setError("No categories found.");
        }
    } catch (error) {
        setError("Failed to load categories. Please try again later.");
        console.error("Error loading categories:", error);
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
            setCategory(response.data);
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
    setThreads: React.Dispatch<React.SetStateAction<any[]>>,
    setError: React.Dispatch<React.SetStateAction<string>>
) => {
    try {
        setLoading(true);
        const response = await getThreadsByCategory(Number(id));
        if (response?.data) {
            setThreads(response.data);
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