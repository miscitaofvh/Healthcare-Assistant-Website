import { NewPost } from "../../../types/forum/post";
import { requestAPI } from "../request";
const BASE_URL = "http://localhost:5000/api/forum";

async function getPosts(
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'created_at',
    sortOrder: string = 'DESC'
) {
    const response = await requestAPI(
        BASE_URL, 
        `/posts?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`, 
        "GET");
    return response;
}

async function getSummaryPosts() {
    const response = await requestAPI(BASE_URL, "/posts/summary", "GET");
    return response;
}

async function getPopularPosts() {
    const response = await requestAPI(BASE_URL, "/posts/popular", "GET");
    return response;
}

async function getPostsByUser(username: string) {
    const response = await requestAPI(BASE_URL, `/user/${username}/posts`, "GET");
    return response;
}

async function getPostById(id: string) {
    const response = await requestAPI(BASE_URL, `/posts/${id}`, "GET");
    return response;
}

async function createPost(post: NewPost) {
    const response = await requestAPI(BASE_URL, "/posts", "POST", post);
    return response;
}

async function updatePost(id: string, post: NewPost) {
    const response = await requestAPI(BASE_URL, `/posts/${id}`, "PUT", post);
    return response;
}

async function deletePost(id: string) {
    const response = await requestAPI(BASE_URL, `/posts/${id}`, "DELETE");
    return response;
}

async function getTagByForumPost(forum_post_id: string) {
    const response = await requestAPI(BASE_URL, `/posts/${forum_post_id}/tags`, "GET");
    return response;
}

export default {
    getPosts,
    getSummaryPosts,
    getPopularPosts,
    getPostsByUser,
    getPostById,
    createPost,
    updatePost,
    deletePost,
    getTagByForumPost
};
