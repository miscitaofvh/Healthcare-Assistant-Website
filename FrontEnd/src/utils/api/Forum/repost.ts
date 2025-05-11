import { requestAPI } from "../request";
const BASE_URL = "http://localhost:5000/api/forum";

async function reportPost(postId: string, reportReason: string) {
    const response = await requestAPI(BASE_URL, `/posts/${postId}/reports`, "POST", {
        reason: reportReason,
    });
    return response;
}

async function reportComment(commentId: string, comment: any) {
    const response = await requestAPI(BASE_URL, `/comments/${commentId}/reports`, "POST", comment);
    return response;
}

export default {
    reportPost,
    reportComment
};