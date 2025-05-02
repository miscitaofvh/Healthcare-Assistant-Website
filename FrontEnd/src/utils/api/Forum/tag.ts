import { requestAPI } from "../request";
import { Tag, NewTag } from "../../../types/forum";

const BASE_URL = "http://localhost:5000/api/forum";

// Get all tags
export async function getAllTags() {
    const response = await requestAPI(BASE_URL, "/tags", "GET");
    return response;
}

export async function getAllTagsSummary() {
    const response = await requestAPI(BASE_URL, "/tags", "GET");
    return response;
}

// Get a single tag by ID
export async function getTagById(id: number) {
    const response = await requestAPI(BASE_URL, `/tags/${id}`, "GET");
    return response;
}

// Get tags by name (search)
export async function getTagByName(name: string) {
    const response = await requestAPI(BASE_URL, `/tags/search?name=${encodeURIComponent(name)}`, "GET");
    return response;
}

// Get posts by tag ID
export async function getPostsByTag(id: number) {
    const response = await requestAPI(BASE_URL, `/tags/${id}/posts`, "GET");
    return response;
}

// Get popular tags
export async function getPopularTags() {
    const response = await requestAPI(BASE_URL, "/tags/popular", "GET");
    return response;
}

// Get tags created by a specific user
export async function getTagsByUser(userId: number) {
    const response = await requestAPI(BASE_URL, `/users/${userId}/tags`, "GET");
    return response;
}

// Create a new tag
export async function createTag(tag: NewTag) {
    const response = await requestAPI(BASE_URL, "/tags", "POST", tag);
    return response;
}

// Update a tag by ID
export async function updateTag(id: number, tag: NewTag) {
    const response = await requestAPI(BASE_URL, `/tags/${id}`, "PUT", tag);
    return response;
}

// Delete a tag by ID
export async function deleteTag(id: number) {
    const response = await requestAPI(BASE_URL, `/tags/${id}`, "DELETE");
    return response;
}

// Get all tags of a post
export async function getTagsOfPost(postId: number) {
    const response = await requestAPI(BASE_URL, `/posts/${postId}/tags`, "GET");
    return response;
}

// Get a specific tag of a post by tag ID
export async function getTagOfPostById(postId: number, tagId: number) {
    const response = await requestAPI(BASE_URL, `/posts/${postId}/tags/${tagId}`, "GET");
    return response;
}

// Add tags to a post
export async function addTagsToPost(postId: number, tags: number[]) {
    const response = await requestAPI(BASE_URL, `/posts/${postId}/tags`, "POST", { tags });
    return response;
}

// Remove a tag from a post
export async function removeTagFromPost(postId: number, tagId: number) {
    const response = await requestAPI(BASE_URL, `/posts/${postId}/tags/${tagId}`, "DELETE");
    return response;
}
