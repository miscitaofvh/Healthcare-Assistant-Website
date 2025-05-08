import { Post, PostNew } from "../../../types/forum";
import { requestAPI, requestAPIFormdata } from "../request";
const BASE_URL = "http://localhost:5000/api/forum";

export async function getPosts() {
    const response = await requestAPI(BASE_URL, "/posts", "GET");
    return response;
}   

export async function getPostsSummary() {
    const response = await requestAPI(BASE_URL, "/posts/summary", "GET");
    return response;
}

export async function getPostsByUser(username: string) {
    const response = await requestAPI(BASE_URL, `/user/${username}/posts`, "GET");
    return response;
}   

export async function getPostById(id: string) {
    const response = await requestAPI(BASE_URL, `/posts/${id}`, "GET");
    return response;
}

export async function createPost(post: PostNew) {
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

export async function uploadImage(formData: FormData) {
    const response = await requestAPIFormdata(BASE_URL, `/upload-image`, "POST", formData);
    return response;
}
