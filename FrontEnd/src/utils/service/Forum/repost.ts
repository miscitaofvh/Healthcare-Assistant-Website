import  InteractReport  from "../../api/Forum/repost";
const reportPostFE = async (
    postId: string,
    reportReason: string,
    setError: React.Dispatch<React.SetStateAction<string>>,
    setSuccess: React.Dispatch<React.SetStateAction<string>>,
    refetchPost: () => void
): Promise<void> => {
    try {
        if (!postId) {
            throw new Error('Invalid post ID');
        }

        setError('');
        setSuccess('');

        const response = await InteractReport.reportPost(postId, reportReason);

        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            throw new Error(response.data?.message || 'Failed to like post');
        }

        setSuccess(response.data.message || 'Post like updated');
        await refetchPost();

    } catch (err: unknown) {
        let errorMessage = 'Failed to like post';

        if (err instanceof Error) {
            errorMessage = err.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        }

        setError(errorMessage);
        setSuccess('');
    }
};

const reportCommentFE = async (
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

        const response = await InteractReport.reportComment(commentId, reportData);
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

export default {
    reportPostFE,
    reportCommentFE
};