import { requestAPI } from "../api/request";
import { getApiUrl } from '../../config/env';

const BASE_URL = getApiUrl('/article');

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

export async function getArticles(page: number = 1) {
    const response = await requestAPI(BASE_URL, `/articles?page=${page}`, "GET");
    return response;
}

export async function getArticleById(id: number) {
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

export async function getCommentsByArticleId(articleId: number) {
    const response = await requestAPI(BASE_URL, `/articles/${articleId}/comments`, "GET");
    return response;
}

export async function postComment(articleId: number, user_id: string, comment: any, parentId: number | null) {
    const response = await requestAPI(BASE_URL, "/articles/${articleId}/comments", "POST", { article_id: articleId, user_id: user_id, comment_content: comment, parent_id: parentId} );
    return response;
}