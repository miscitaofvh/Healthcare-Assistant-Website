import { toast } from "react-toastify";
import InteractLike from "../../../utils/api/Forum/like";
import { LIKE_MESSAGES } from "../../constants/forum-messages";

const handleLikeResponse = (
    response: any,
    errorMessage: string,
    showError: (message: string) => void
): boolean => {
    if (response.status !== 200 || !response.data?.success) {
        showError(response.data?.message || errorMessage);
        return false;
    }
    return true;
};

const likePostFE = async (
    postId: string,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    refetchPost: () => Promise<void>
): Promise<void> => {
    try {
        const response = await InteractLike.likePost(postId);

        if (!handleLikeResponse(response, LIKE_MESSAGES.ERROR.LIKE_POST, showError)) {
            return;
        }

        showSuccess(LIKE_MESSAGES.SUCCESS.LIKE_POST);
        await refetchPost();
    } catch (err: unknown) {
        showError(
            err instanceof Error ? err.message :
                typeof err === 'string' ? err :
                    LIKE_MESSAGES.ERROR.GENERIC
        );
    }
};

const unlikePostFE = async (
    postId: string,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    refetchPost: () => Promise<void>
): Promise<void> => {
    try {
        const response = await InteractLike.unlikePost(postId);

        if (!handleLikeResponse(response, LIKE_MESSAGES.ERROR.UNLIKE_POST, showError)) {
            return;
        }

        showSuccess(LIKE_MESSAGES.SUCCESS.UNLIKE_POST);
        await refetchPost();
    } catch (err: unknown) {
        showError(
            err instanceof Error ? err.message :
                typeof err === 'string' ? err :
                    LIKE_MESSAGES.ERROR.GENERIC
        );
    }
};

const likeCommentFE = async (
    commentId: string,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    refetchComments: () => Promise<void>
): Promise<void> => {
    try {
        const response = await InteractLike.likeComment(commentId);

        if (!handleLikeResponse(response, LIKE_MESSAGES.ERROR.LIKE_COMMENT, showError)) {
            return;
        }

        showSuccess(LIKE_MESSAGES.SUCCESS.LIKE_COMMENT);
        await refetchComments();
    } catch (err: unknown) {
        showError(
            err instanceof Error ? err.message :
                typeof err === 'string' ? err :
                    LIKE_MESSAGES.ERROR.GENERIC
        );
    }
};

const unlikeCommentFE = async (
    commentId: string,
    postId: string,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    refetchComments: () => Promise<void>
): Promise<void> => {
    try {
        const response = await InteractLike.unlikeComment(commentId, postId);

        if (!handleLikeResponse(response, LIKE_MESSAGES.ERROR.UNLIKE_COMMENT, showError)) {
            return;
        }

        showSuccess(LIKE_MESSAGES.SUCCESS.UNLIKE_COMMENT);
        await refetchComments();
    } catch (err: unknown) {
        showError(
            err instanceof Error ? err.message :
                typeof err === 'string' ? err :
                    LIKE_MESSAGES.ERROR.GENERIC
        );
    }
};

export default {
    likePostFE,
    unlikePostFE,
    likeCommentFE,
    unlikeCommentFE
};