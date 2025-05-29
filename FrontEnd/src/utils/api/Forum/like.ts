import { requestAPI } from "../request";
import { getApiUrl } from '../../../config/env';

const BASE_URL = getApiUrl('/forum');

async function likeComment(commentId: string) {
    const response = await requestAPI(BASE_URL, `/comments/${commentId}/likes`, "POST",);
    return response;
}

async function unlikeComment(commentId: string, postId: string) {
    const response = await requestAPI(BASE_URL, `/comments/${commentId}/likes`, "DELETE", {
        postId: postId,
    });
    return response;
}

async function likePost(postId: string) {
    const response = await requestAPI(BASE_URL, `/posts/${postId}/likes`, "POST");
    return response;
}

async function unlikePost(postId: string) {
    const response = await requestAPI(BASE_URL, `/posts/${postId}/likes`, "DELETE");
    return response;
}

export default {
    likePost,
    unlikePost,
    likeComment,
    unlikeComment
};