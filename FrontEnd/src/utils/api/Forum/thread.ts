import { requestAPI } from "../request";
import { Thread } from "../../../types/forum";

const BASE_URL = "http://localhost:5000/api/forum";

export async function getAllThreads() {
    const response = await requestAPI(BASE_URL, "/threads", "GET");
    return response;
}

export async function getSummaryThreads() {
    const response = await requestAPI(BASE_URL, "/threads/summary", "GET");
    return response;
}

export async function getThreadById(threadId: number) {
    const response = await requestAPI(BASE_URL, `/threads/${threadId}`, "GET");
    return response;
}

export async function getThreadName(threadId: number) {
    const response = await requestAPI(BASE_URL, `/threads/${threadId}/name`, "GET");
    return response;
}

export async function getPostsByThread(threadId: number) {
    const response = await requestAPI(BASE_URL, `/threads/${threadId}/posts`, "GET");
    return response;
}

export async function getThreadsByUser(userId: number) {
    const response = await requestAPI(BASE_URL, `/users/${userId}/threads`, "GET");
    return response;
}

export async function createThread(threadData: Partial<Thread>) {
    const response = await requestAPI(BASE_URL, "/threads", "POST", threadData);
    return response;
}

export async function updateThread(threadId: number, threadData: Partial<Thread>) {
    const response = await requestAPI(BASE_URL, `/threads/${threadId}`, "PUT", threadData);
    return response;
}

export async function deleteThread(threadId: number) {
    const response = await requestAPI(BASE_URL, `/threads/${threadId}`, "DELETE");
    return response;
}