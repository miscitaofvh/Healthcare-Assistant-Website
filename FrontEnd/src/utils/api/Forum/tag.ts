import { requestAPI } from "../request";
import { NewTag } from "../../../types/Forum/tag";

const BASE_URL = "http://localhost:5000/api/forum";

// Get all tags
async function getAllTags(page = 1, limit = 10, sortBy = 'name', sortOrder = 'ASC') {
    const response = await requestAPI(BASE_URL, `/tags?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`, "GET");
    return response;
}

async function getAllTagsSummary() {
    const response = await requestAPI(BASE_URL, "/tags/summary", "GET");
    return response;
}

async function getAllTagsLittleSummary() {
    const response = await requestAPI(BASE_URL, "/tags/summary/little", "GET");
    return response;
}

async function getTagByForumPost(forum_post_id: string) {
    const response = await requestAPI(BASE_URL, `/posts/${forum_post_id}/tags`, "GET");
    return response;
}

// Get a single tag by ID
async function getTagById(id: number) {
    const response = await requestAPI(BASE_URL, `/tags/${id}`, "GET");
    return response;
}

// Get tags by name (search)
async function getTagByName(name: string) {
    const response = await requestAPI(BASE_URL, `/tags/search?name=${encodeURIComponent(name)}`, "GET");
    return response;
}

// Get posts by tag ID
async function getPostsByTag(
    id: number,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'created_at',
    sortOrder: string = 'DESC'
) {
    const response = await requestAPI(
        BASE_URL,
        `/tags/${id}/posts?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
        "GET"
    );
    return response;
}
// Get popular tags
async function getPopularTags() {
    const response = await requestAPI(BASE_URL, "/tags/popular", "GET");
    return response;
}

// Get tags created by a specific user
async function getTagsByUser(userId: number) {
    const response = await requestAPI(BASE_URL, `/users/${userId}/tags`, "GET");
    return response;
}

// Create a new tag
async function createTag(tag: NewTag) {
    const response = await requestAPI(BASE_URL, "/tags", "POST", tag);
    return response;
}

// Update a tag by ID
async function updateTag(id: number, tag: NewTag) {
    const response = await requestAPI(BASE_URL, `/tags/${id}`, "PUT", tag);
    return response;
}

// Delete a tag by ID
async function deleteTag(id: number) {
    const response = await requestAPI(BASE_URL, `/tags/${id}`, "DELETE");
    return response;
}

// Get all tags of a post
async function getTagsOfPost(postId: number) {
    const response = await requestAPI(BASE_URL, `/posts/${postId}/tags`, "GET");
    return response;
}

// Get a specific tag of a post by tag ID
async function getTagOfPostById(postId: number, tagId: number) {
    const response = await requestAPI(BASE_URL, `/posts/${postId}/tags/${tagId}`, "GET");
    return response;
}

// Add tags to a post
async function addTagsToPost(postId: number, tags: number[]) {
    const response = await requestAPI(BASE_URL, `/posts/${postId}/tags`, "POST", { tags });
    return response;
}

// Remove a tag from a post
async function removeTagFromPost(postId: number, tagId: number) {
    const response = await requestAPI(BASE_URL, `/posts/${postId}/tags/${tagId}`, "DELETE");
    return response;
}


export default {
    getAllTags,
    getAllTagsSummary,
    getAllTagsLittleSummary,
    getTagById,
    getTagByForumPost,
    getTagByName,
    getPostsByTag,
    getPopularTags,
    getTagsByUser,
    createTag,
    updateTag,
    deleteTag,
    getTagsOfPost,
    getTagOfPostById,
    addTagsToPost,
    removeTagFromPost
};