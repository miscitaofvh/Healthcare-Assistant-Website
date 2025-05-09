
import { createComment, deleteComment, reportComment } from "../../../utils/api/Forum/comment";
import { likeComment, unlikeComment } from "../../../utils/api/Forum/like";
import { PostComment } from "../../../types/forum";

// For comment section

export const countTotalComments = (comments: PostComment[]): number => {
    let count = 0;

    for (const comment of comments) {
        count++; // Count the current comment
        if (comment.replies) {
            count += countTotalComments(comment.replies); // Count all replies
        }
    }

    return count;
};

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
            setError('Invalid post ID');
        }

        const trimmedComment = commentText.trim();
        if (!trimmedComment) {
            setError('Comment cannot be empty');
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
        const { status, data } = response;

        if (status !== 201 || !data?.success) {
            setError(data?.message || 'Failed to create comment');
            return;
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
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setError: React.Dispatch<React.SetStateAction<string>>,
    setSuccess: React.Dispatch<React.SetStateAction<string>>,
    refetchComments: () => Promise<void>
): Promise<void> => {
    try {
        setLoading(true);
        setError('');
        setSuccess('');

        const response = await deleteComment(commentId);

        const { data, status } =  response;

        if (status !== 200 || !data?.success) {
            setError(data?.message || 'Failed to delete comment');
        }

        setSuccess(data.message || 'Comment deleted successfully');
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
    } finally {
        setLoading(false);
    }
};

export const likeCommentFE = async (
    commentId: string,
    postId: string,
    setError: React.Dispatch<React.SetStateAction<string>>,
    setSuccess: React.Dispatch<React.SetStateAction<string>>,
    refetchComments: () => Promise<void>
): Promise<void> => {
    try {
        if (!commentId) {
            setError('Invalid comment ID');
        }

        setError('');
        setSuccess('');

        const response = await likeComment(commentId, postId);
        
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            setError(response.data?.message || 'Failed to like comment');
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

export const unlikeCommentFE = async (
    commentId: string,
    postId: string,
    setError: React.Dispatch<React.SetStateAction<string>>,
    setSuccess: React.Dispatch<React.SetStateAction<string>>,
    refetchComments: () => Promise<void>
): Promise<void> => {
    try {
        if (!commentId) {
            setError('Invalid comment ID');
        }

        setError('');
        setSuccess('');

        const response = await unlikeComment(commentId, postId);
        
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            setError(response.data?.message || 'Failed to like comment');
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
            setError('Invalid comment ID');
        }

        const trimmedReason = reason.trim();
        if (!trimmedReason) {
            setError('Reason cannot be empty');
        }
        if (trimmedReason.length < 10) {
            setError('Reason should be at least 10 characters');
        }

        setError('');
        setSuccess('');

        const reportData = {
            commentId,
            reason: trimmedReason
        };

        const response = await reportComment(commentId, reportData);
        alert(JSON.stringify(response)); // Debugging line
        const { status, data } = response;

        if (status !== 200 || data?.success) {
            setError(response.data?.message || 'Failed to report comment');
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

