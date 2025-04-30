import { requestAPI } from "../request";
import { Category, NewCategory } from "../../../types/forum";
const BASE_URL = "http://localhost:5000/api/forum";

export async function getAllCategories() {
    const response = await requestAPI(BASE_URL, "/categories", "GET");
    return response;
}

export async function getSummaryCategories() {
    const response = await requestAPI(BASE_URL, "/categories/summary/", "GET");
    return response;
}

export async function getCategoryName(id: number) {
    const response = await requestAPI(BASE_URL, `/categories/${id}/name`, "GET");
    return response;
}

export async function getCategoryById(id: number) {
    const response = await requestAPI(BASE_URL, `/categories/${id}`, "GET");
    return response;
}

export async function getThreadsByCategory(id: number) {
    const response = await requestAPI(BASE_URL, `/categories/${id}/threads`, "GET");
    return response;
}

export async function getPostsByCategory(id: number) {
    const response = await requestAPI(BASE_URL, `/categories/${id}/posts`, "GET");
    return response;
}

export async function getCategoriesByUser(userId: number) {
    const response = await requestAPI(BASE_URL, `/users/${userId}/categories`, "GET");
    return response;
}

export async function createCategory(category: NewCategory) {
    const response = await requestAPI(BASE_URL, "/categories", "POST", category);
    return response;
}

export async function updateCategory(id: number, category: NewCategory) {
    const response = await requestAPI(BASE_URL, `/categories/${id}`, "PUT", category);
    return response;
}

export async function deleteCategory(id: number) {
    const response = await requestAPI(BASE_URL, `/categories/${id}`, "DELETE");
    return response;
}
