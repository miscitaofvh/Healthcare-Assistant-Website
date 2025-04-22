import { requestAPI } from "../api/request";
const BASE_URL = "http://localhost:5000/api/article";

export async function getCategories() {
    const response = await requestAPI(BASE_URL, "/categories", "GET");
    return response;
}

export async function getCategoryById(id: string) {
    const response = await requestAPI(BASE_URL, `/categories/${id}`, "GET");
    return response;
}

export async function getArticles() {
    const response = await requestAPI(BASE_URL, "/articles", "GET");
    return response;
}

export async function getArticleById(id: string) {
    const response = await requestAPI(BASE_URL, `/articles/${id}`, "GET");
    return response;
}


export async function createArticle(article: any) {
    alert(JSON.stringify(article));
    const response = await requestAPI(BASE_URL, "/articles", "POST", article);
    return response;
}


export async function updateArticle(id: string, article: any) {
    const response = await requestAPI(BASE_URL, `/articles/${id}`, "PUT", article);
    return response;
}

export async function deleteArticle(id: string) {
    const response = await requestAPI(BASE_URL, `/articles/${id}`, "DELETE");
    return response;
}

