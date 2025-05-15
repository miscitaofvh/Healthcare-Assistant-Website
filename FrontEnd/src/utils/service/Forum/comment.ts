import { toast } from 'react-toastify';
import InteractComment from "../../../utils/api/Forum/comment";
import { CommentPost } from "../../../types/Forum/comment";
import { COMMENT_MESSAGES } from "../../constants/forum-messages";

// Utility functions
const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return COMMENT_MESSAGES.ERROR.GENERIC;
};

const handleApiResponse = (
    response: any,
    successStatus: number,
    errorMessage: string,
    showError: (message: string) => void
): boolean => {
    if (response.status !== successStatus || !response.data?.success) {
        showError(response.data?.message || errorMessage);
        return false;
    }
    return true;
};

// Comment functions
const countTotalComments = (comments: CommentPost[]): number => {
    return comments.reduce((count, comment) => {
        return count + 1 + (comment.replies ? countTotalComments(comment.replies) : 0);
    }, 0);
};

const addCommentToPost = async (
    postId: string,
    commentText: string,
    parentCommentId: string | undefined,
    depth: number | undefined,
    setCommentText: (text: string) => void,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    onSuccess: () => Promise<void>
): Promise<void> => {
    try {
        const commentData = {
            postId,
            content: commentText.trim(),
            parent_comment_id: parentCommentId,
            depth: depth || 0
        };

        if (!commentData.content) {
            showError('Comment cannot be empty');
            return;
        }

        const response = await InteractComment.createComment(postId, commentData);

        if (!handleApiResponse(response, 201, COMMENT_MESSAGES.ERROR.CREATE, showError)) {
            return;
        }

        setCommentText('');
        showSuccess(COMMENT_MESSAGES.SUCCESS.CREATE);
        await onSuccess();

    } catch (err) {
        showError(getErrorMessage(err));
    }
};

const updateComment = async (
    commentId: string,
    updatedText: string,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    refetchComments: () => void
): Promise<void> => {
    try {
        setLoading(true);

        if (!updatedText.trim()) {
            showError('Comment cannot be empty');
            return;
        }

        const response = await InteractComment.updateComment(commentId, {
            content: updatedText.trim()
        });

        if (!handleApiResponse(response, 200, COMMENT_MESSAGES.ERROR.UPDATE, showError)) {
            return;
        }

        showSuccess(COMMENT_MESSAGES.SUCCESS.UPDATE);
        await refetchComments();

    } catch (err) {
        showError(getErrorMessage(err));
    } finally {
        setLoading(false);
    }
};

const deleteCommentFromPost = async (
    commentId: string,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    refetchComments: () => void
): Promise<void> => {
    try {
        setLoading(true);
        const response = await InteractComment.deleteComment(commentId);

        if (!handleApiResponse(response, 200, COMMENT_MESSAGES.ERROR.DELETE, showError)) {
            return;
        }

        showSuccess(COMMENT_MESSAGES.SUCCESS.DELETE);
        await refetchComments();

    } catch (err) {
        showError(getErrorMessage(err));
    } finally {
        setLoading(false);
    }
};

export default {
    addCommentToPost,  // Fixed typo in function name (was addCommenttoPost)
    deleteCommentFromPost,
    updateComment,
    countTotalComments
};