import { requestAPI } from "../request";
import { getApiUrl } from '../../../config/env';

const BASE_URL = getApiUrl('/forum');

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