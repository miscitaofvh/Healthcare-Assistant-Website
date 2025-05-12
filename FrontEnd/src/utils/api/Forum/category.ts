import { requestAPI } from "../request";
import { NewCategory } from "../../../types/Forum/category";
const BASE_URL = "http://localhost:5000/api/forum";

async function getAllCategories(page = 1, limit = 10, sortBy = 'name', sortOrder = 'ASC') {
    const response = await requestAPI(BASE_URL, `/categories?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`, "GET");
    return response;
}

async function getSummaryCategories() {
    const response = await requestAPI(BASE_URL, "/categories/summary", "GET");
    return response;
}

async function getCategoryName(id: number) {
    const response = await requestAPI(BASE_URL, `/categories/${id}/name`, "GET");
    return response;
}

async function getCategoryById(id: number) {
    const response = await requestAPI(BASE_URL, `/categories/${id}`, "GET");
    return response;
}

async function getThreadsByCategory(
    id: number,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'created_at',
    sortOrder: string = 'DESC'
) {
    const response = await requestAPI(
        BASE_URL,
        `/categories/${id}/threads?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
        "GET"
    );
    return response;
}

async function getThreadsSummaryByCategory(id: number) {
    const response = await requestAPI(BASE_URL, `/categories/${id}/threads/summary`, "GET");
    return response;
}

async function getPostsByCategory(id: number) {
    const response = await requestAPI(BASE_URL, `/categories/${id}/posts`, "GET");
    return response;
}

async function getCategoriesByUser(userId: number) {
    const response = await requestAPI(BASE_URL, `/users/${userId}/categories`, "GET");
    return response;
}

async function createCategory(category: NewCategory) {
    const response = await requestAPI(BASE_URL, "/categories", "POST", category);
    return response;
}

async function updateCategory(id: number, category: NewCategory) {
    const response = await requestAPI(BASE_URL, `/categories/${id}`, "PUT", category);
    return response;
}

async function deleteCategory(id: number) {
    const response = await requestAPI(BASE_URL, `/categories/${id}`, "DELETE");
    return response;
}

export default {
    getAllCategories,
    getSummaryCategories,
    getCategoryName,
    getCategoryById,
    getThreadsByCategory,
    getThreadsSummaryByCategory,
    getPostsByCategory,
    getCategoriesByUser,
    createCategory,
    updateCategory,
    deleteCategory,
};