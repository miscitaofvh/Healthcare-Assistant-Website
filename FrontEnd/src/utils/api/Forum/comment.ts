import { requestAPI } from "../request";
const BASE_URL = "http://localhost:5000/api/forum";

export async function getComments(id: string) {
    const response = await requestAPI(BASE_URL, `/posts/${id}/comments`, "GET");
    return response;
}

export async function createComment(id: string, comment: any) {
    const response = await requestAPI(BASE_URL, `/posts/${id}/comments`, "POST", comment);
    return response;
}   

export async function deleteComment(commentId: string) {
    const response = await requestAPI(BASE_URL, `/comments/${commentId}`, "DELETE");
    return response;
}

export async function reportComment(commentId: string, comment: any) {
    const response = await requestAPI(BASE_URL, `/comments/${commentId}/reports`, "POST", comment);
    return response;
}

