import {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById
} from "../../../utils/api/Forum/category";
import { Category, CategoryResponse } from "../../../types/forum";
import { json } from "stream/consumers";

export const loadCategories = async (
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setCategories: React.Dispatch<React.SetStateAction<CategoryResponse[]>>,
    setError: React.Dispatch<React.SetStateAction<string>>,
    setSuccess: React.Dispatch<React.SetStateAction<string>>
) => {
    try {
        setLoading(true);
        const response = await getAllCategories();
        if (!response) {
            setError("Failed to load categories. Please try again later.");
            return;
        }
        if (response && response.data) {
            setCategories(response.data);
        } else {
            setError("No data returned.");
        }
        setCategories(response.data.data);
    } catch (error) {
        setError("Failed to load categories. Please try again later.");
        console.error("Error loading categories:", error);
    } finally {
        setLoading(false);
    }
};

export const handleCreateCategory = async (
    newCategory: Category,
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
        if (response && response.data) {
            setSuccess("Category created successfully!");
            loadCategories(); // Reload categories after creation
        }
    } catch (error) {
        setError("Failed to create category. Please try again later.");
        console.error("Error creating category:", error);
    } finally {
        setFormLoading(false);
    }
};

export const handleUpdateCategory = async (
    editingCategory: CategoryResponse,
    setFormLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setError: React.Dispatch<React.SetStateAction<string>>,
    setSuccess: React.Dispatch<React.SetStateAction<string>>,
    loadCategories: () => void
) => {
    try {
        setFormLoading(true);
        const response = await updateCategory(editingCategory.category_id, {
            category_name: editingCategory.category_name,
            description: editingCategory.description || "",
        });
        if (response && response.data) {
            setSuccess("Category updated successfully!");
            loadCategories(); // Reload categories after update
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
        if (response && response.data) {
            setSuccess("Category deleted successfully!");
            loadCategories(); // Reload categories after deletion
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
    setLoading: (loading: boolean) => void,
    setCategory: (category: any) => void,
    setError: (error: string) => void
) => {
    try {
        setLoading(true);
        const response = await getCategoryById(Number(id));
        if (!response) {
            setError("Server error. Please try again later.");
            return;
        }
        if (response && response.status !== 200) {
            setError(response.data.message || "Failed to load category. Please try again later.");
            return;
        }
        if (response && response.data) {
            setCategory(response.data);
        } else {
            setError("No data returned.");
        }
        const data = response.data.data;
        setCategory(data);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
};