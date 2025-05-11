
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

        const response = await InteractComment.createComment(postId, commentData);
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

const deleteCommentFromPost = async (
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

        const response = await InteractComment.deleteComment(commentId);

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



export default {
    addCommenttoPost,
    deleteCommentFromPost,
    countTotalComments
};