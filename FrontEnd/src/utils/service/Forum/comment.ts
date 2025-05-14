import { toast } from 'react-toastify';

import InteractComment from "../../../utils/api/Forum/comment";
import { CommentPost } from "../../../types/Forum/comment";

// For comment section

const countTotalComments = (comments: CommentPost[]): number => {
    let count = 0;

    for (const comment of comments) {
        count++; // Count the current comment
        if (comment.replies) {
            count += countTotalComments(comment.replies); // Count all replies
        }
    }

    return count;
};

const addCommenttoPost = async (
    postId: string,
    commentText: string,
    parentCommentId: string | undefined,
    depth: number | undefined,
    setCommentText: (text: string) => void,
    showError: (message: string) => void = toast.error,
    onSuccess: () => Promise<void>
): Promise<void> => {
    try {

        const commentData = {
            postId,
            content: commentText,
            parent_comment_id: parentCommentId,
            depth: depth || 0
        };

        const response = await InteractComment.createComment(postId, commentData);
        const { status, data } = response;

        if (status !== 201 || !data?.success) {
            showError(data?.message || 'Failed to create comment');
            return;
        }

        setCommentText('');

        await onSuccess();

    } catch (err: unknown) {
        const errorMessage = err instanceof Error
            ? err.message
            : typeof err === 'string'
                ? err
                : 'Failed to post comment';
        showError(errorMessage);
    }
};

const updateComment = async (
    commentId: string,
    updatedText: string,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    showError: (message: string) => void = toast.error,
    refetchComments: () => void
): Promise<void> => {
    try {
        setLoading(true);

        const response = await InteractComment.updateComment(commentId, { content: updatedText });
        const { data, status } = response;

        if (status !== 200 || !data?.success) {
            showError(data?.message || 'Failed to update comment');
            return;
        }

        await refetchComments();

    } catch (err: unknown) {
        let errorMessage = 'Failed to update comment';

        if (err instanceof Error) {
            errorMessage = err.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        }

        showError(errorMessage);
    } finally {
        setLoading(false);
    }
};

const deleteCommentFromPost = async (
    commentId: string,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    showError: (message: string) => void = toast.error,
    refetchComments: () => void
): Promise<void> => {
    try {
        setLoading(true);

        const response = await InteractComment.deleteComment(commentId);

        const { data, status } = response;

        if (status !== 200 || !data?.success) {
            showError(data?.message || 'Failed to delete comment');
            return; 
        }

        await refetchComments();

    } catch (err: unknown) {
        let errorMessage = 'Failed to delete comment';

        if (err instanceof Error) {
            errorMessage = err.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        }

        showError(errorMessage);
    } finally {
        setLoading(false);
    }
};



export default {
    addCommenttoPost,
    deleteCommentFromPost,
    updateComment,
    countTotalComments
};