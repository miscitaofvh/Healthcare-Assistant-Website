import { requestAPI } from "../request";
import { NewThread } from "../../../types/forum/thread";
import { getApiUrl } from '../../../config/env';

const BASE_URL = getApiUrl('/forum');

async function getAllThreads(
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'created_at',
    sortOrder: string = 'DESC'
) {
    const response = await requestAPI(
        BASE_URL,
        `/threads?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
        "GET"
    );
    return response;
}

async function getSummaryThreads() {
    const response = await requestAPI(BASE_URL, "/threads/summary", "GET");
    return response;
}

async function getPopularThreads() {
    const response = await requestAPI(BASE_URL, "/threads/popular", "GET");
    return response;
}

async function getThreadById(threadId: number) {
    const response = await requestAPI(BASE_URL, `/threads/${threadId}`, "GET");
    return response;
}

async function getThreadName(threadId: number) {
    const response = await requestAPI(BASE_URL, `/threads/${threadId}/name`, "GET");
    return response;
}

async function getPostsByThread(
    threadId: number,
    page: number = 1,
    limit: number = 10,
    sortBy: string = "created_at",
    sortOrder: string = "DESC"
) {
    const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy: sortBy,
        sortOrder: sortOrder
    });

    const response = await requestAPI(
        BASE_URL,
        `/threads/${threadId}/posts?${queryParams.toString()}`,
        "GET"
    );
    return response;
}

async function getThreadsByUser(userId: number) {
    const response = await requestAPI(BASE_URL, `/users/${userId}/threads`, "GET");
    return response;
}

async function createThread(threadData: NewThread) {
    const response = await requestAPI(BASE_URL, "/threads", "POST", threadData);
    return response;
}

async function updateThread(threadId: number, threadData: NewThread) {
    const response = await requestAPI(BASE_URL, `/threads/${threadId}`, "PUT", threadData);
    return response;
}

async function deleteThread(threadId: number) {
    const response = await requestAPI(BASE_URL, `/threads/${threadId}`, "DELETE");
    return response;
}

export default {
    getAllThreads,
    getSummaryThreads,
    getPopularThreads,
    getThreadById,
    getThreadName,
    getPostsByThread,
    getThreadsByUser,
    createThread,
    updateThread,
    deleteThread
};