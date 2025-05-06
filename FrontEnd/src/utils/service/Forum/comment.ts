
import { createComment, deleteComment, likeComment, reportComment } from "../../../utils/api/Forum/comment";

export const handleCommentSubmit = async (
    postId: string,
    commentText: string,
    parentCommentId: string | undefined,
    depth: number | undefined,
    setCommentText: (text: string) => void,
    setError: React.Dispatch<React.SetStateAction<string>>,
    setSuccess: React.Dispatch<React.SetStateAction<string>>,
    onSuccess: () => Promise<void>
): Promise<void> => {
    try {
        if (!postId) {
            throw new Error('Invalid post ID');
        }

        const trimmedComment = commentText.trim();
        if (!trimmedComment) {
            throw new Error('Comment cannot be empty');
        }

        setError('');
        setSuccess('');

        const commentData = {
            postId,
            content: trimmedComment,
            parent_comment_id: parentCommentId,
            depth: depth || 0
        };

        const response = await createComment(postId, commentData);

        if (response.status !== 201 || !response.data?.success) {
            throw new Error(response.data?.message || 'Failed to create comment');
        }

        setCommentText('');
        setSuccess(parentCommentId ? 'Reply posted successfully' : 'Comment posted successfully');

        await onSuccess();

    } catch (err: unknown) {
        const errorMessage = err instanceof Error
            ? err.message
            : typeof err === 'string'
                ? err
                : 'Failed to post comment';

        setError(errorMessage);
        setSuccess('');
    }
};

export const deleteCommentFE = async (
    commentId: string,
    setError: React.Dispatch<React.SetStateAction<string>>,
    setSuccess: React.Dispatch<React.SetStateAction<string>>,
    refetchComments: () => Promise<void>
): Promise<void> => {
    try {
        if (!commentId) {
            throw new Error('Invalid comment ID');
        }

        setError('');
        setSuccess('');

        const response = await deleteComment(commentId);

        if (response.status !== 200 || !response.data?.success) {
            throw new Error(response.data?.message || 'Failed to delete comment');
        }

        setSuccess('Comment deleted successfully');
        await refetchComments();

    } catch (err: unknown) {
        let errorMessage = 'Failed to delete comment';

        if (err instanceof Error) {
            errorMessage = err.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        }

        setError(errorMessage);
        setSuccess('');
    }
};

export const likeCommentFE = async (
    commentId: string,
    setError: React.Dispatch<React.SetStateAction<string>>,
    setSuccess: React.Dispatch<React.SetStateAction<string>>,
    refetchComments: () => Promise<void>
): Promise<void> => {
    try {
        if (!commentId) {
            throw new Error('Invalid comment ID');
        }

        setError('');
        setSuccess('');

        const response = await likeComment(commentId);

        if (response.status !== 200 || !response.data?.success) {
            throw new Error(response.data?.message || 'Failed to like comment');
        }

        setSuccess(response.data.message || 'Comment like updated');
        await refetchComments();

    } catch (err: unknown) {
        let errorMessage = 'Failed to like comment';

        if (err instanceof Error) {
            errorMessage = err.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        }

        setError(errorMessage);
        setSuccess('');
    }
};

export const reportCommentFE = async (
    commentId: string,
    reason: string,
    setError: React.Dispatch<React.SetStateAction<string>>,
    setSuccess: React.Dispatch<React.SetStateAction<string>>,
    onSuccess: () => void
): Promise<void> => {
    try {
        if (!commentId) {
            throw new Error('Invalid comment ID');
        }

        const trimmedReason = reason.trim();
        if (!trimmedReason) {
            throw new Error('Reason cannot be empty');
        }
        if (trimmedReason.length < 10) {
            throw new Error('Reason should be at least 10 characters');
        }

        setError('');
        setSuccess('');

        const reportData = {
            commentId,
            reason: trimmedReason
        };

        const response = await reportComment(commentId, reportData);
        
        const { status, data } = response;

        if (status !== 200 || data?.success) {
            throw new Error(response.data?.message || 'Failed to report comment');
        }

        setSuccess('Comment reported successfully');
        onSuccess();

    } catch (err: unknown) {
        const errorMessage = err instanceof Error
            ? err.message
            : typeof err === 'string'
                ? err
                : 'Failed to report comment';

        setError(errorMessage);
        setSuccess('');
    }
};