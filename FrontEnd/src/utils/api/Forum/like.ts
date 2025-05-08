import { requestAPI } from "../request";
const BASE_URL = "http://localhost:5000/api/forum";
import { PostLike } from "../../../types/forum";

export async function likeComment(commentId: string, postId: string) {
    const response = await requestAPI(BASE_URL, `/comments/${commentId}/likes`, "POST", {
        postId: postId,
    });
    return response;
}

export async function unlikeComment(commentId: string, postId: string) {
    const response = await requestAPI(BASE_URL, `/comments/${commentId}/likes`, "DELETE", {
        postId: postId,
    });
    return response;
}

export async function likePost(postId: string) {
    const response = await requestAPI(BASE_URL, `/posts/${postId}/likes`, "POST");
    return response;
}

export async function unlikePost(postId: string) {
    const response = await requestAPI(BASE_URL, `/posts/${postId}/likes`, "DELETE");
    return response;
}