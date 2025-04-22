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

export async function getTags() {
    const response = await requestAPI(BASE_URL, "/tags", "GET");
    return response;
}

export async function getTagByID(name: string) {
    const response = await requestAPI(BASE_URL, `/tags/${name}`, "GET");
    return response;
}

export async function getTagByArticle(article_id: string) {
    const response = await requestAPI(BASE_URL, `/tags/article/${article_id}`, "POST");
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

