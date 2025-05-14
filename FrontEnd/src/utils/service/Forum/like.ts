import { toast } from "react-toastify";
import InteractLike from "../../../utils/api/Forum/like";

const likePostFE = async (
    postId: string,
    showError: (message: string) => void = toast.error,
    refetchPost: () => Promise<void>
): Promise<void> => {
    try {
        const response = await InteractLike.likePost(postId);

        if (response.status !== 200 || !response.data?.success) {
            throw new Error(response.data?.message || 'Failed to like post');
        }

        await refetchPost();

    } catch (err: unknown) {
        let errorMessage = 'Failed to like post';

        if (err instanceof Error) {
            errorMessage = err.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        }

        showError(errorMessage);
    }
};

const unlikePostFE = async (
    postId: string,
    showError: (message: string) => void = toast.error,
    refetchPost: () => Promise<void>
): Promise<void> => {
    try {
        const response = await InteractLike.unlikePost(postId);

        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            throw new Error(response.data?.message || 'Failed to like post');
        }

        await refetchPost();

    } catch (err: unknown) {
        let errorMessage = 'Failed to like post';

        if (err instanceof Error) {
            errorMessage = err.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        }

        showError(errorMessage);
    }
};

const likeCommentFE = async (
    commentId: string,
    showError: (message: string) => void = toast.error,
    refetchComments: () => Promise<void>
): Promise<void> => {
    try {
        const response = await InteractLike.likeComment(commentId);

        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            showError(response.data?.message || 'Failed to like comment');
            return;
        }

        await refetchComments();

    } catch (err: unknown) {
        let errorMessage = 'Failed to like comment';

        if (err instanceof Error) {
            errorMessage = err.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        }

        showError(errorMessage);
    }
};

const unlikeCommentFE = async (
    commentId: string,
    postId: string,
    showError: (message: string) => void = toast.error,
    refetchComments: () => Promise<void>
): Promise<void> => {
    try {
        const response = await InteractLike.unlikeComment(commentId, postId);
        
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            showError(response.data?.message || 'Failed to like comment');
            return;
        }

        await refetchComments();

    } catch (err: unknown) {
        let errorMessage = 'Failed to like comment';

        if (err instanceof Error) {
            errorMessage = err.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        }

        showError(errorMessage);
    }
};

export default {
    likePostFE,
    unlikePostFE,
    likeCommentFE,
    unlikeCommentFE
};