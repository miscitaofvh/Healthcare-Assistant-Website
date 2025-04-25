import { requestAPI } from "../api/request";
const BASE_URL = "http://localhost:5000/api/forum";

export async function getPosts() {
    const response = await requestAPI(BASE_URL, "/posts", "GET");
    return response;
}   

export async function getPostById(id: string) {
    const response = await requestAPI(BASE_URL, `/posts/${id}`, "GET");
    return response;
}

export async function createPost(post: any) {
    const response = await requestAPI(BASE_URL, "/posts", "POST", post);
    return response;
}

export async function updatePost(id: string, post: any) {
    const response = await requestAPI(BASE_URL, `/posts/${id}`, "PUT", post);
    return response;
}

export async function deletePost(id: string) {
    const response = await requestAPI(BASE_URL, `/posts/${id}`, "DELETE");
    return response;
}   

export async function getTagByForumPost(forum_post_id: string) {
    const response = await requestAPI(BASE_URL, `/posts/${forum_post_id}/tags`, "GET");
    return response;
}

export async function getComments(id: string) {
    const response = await requestAPI(BASE_URL, `/posts/${id}/comments`, "GET");
    return response;
}

export async function createComment(id: string, comment: any) {
    const response = await requestAPI(BASE_URL, `/posts/${id}/comments`, "POST", comment);
    return response;
}   

export async function deleteComment(id: string, commentId: string) {
    const response = await requestAPI(BASE_URL, `/posts/${id}/comments/${commentId}`, "DELETE");
    return response;
}   












