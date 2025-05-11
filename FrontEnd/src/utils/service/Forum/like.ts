import InteractLike from "../../../utils/api/Forum/like";

const likePostFE = async (
    postId: string,
    setError: React.Dispatch<React.SetStateAction<string>>,
    setSuccess: React.Dispatch<React.SetStateAction<string>>,
    refetchPost: () => Promise<void>
): Promise<void> => {
    try {
        if (!postId) {
            throw new Error('Invalid post ID');
        }

        setError('');
        setSuccess('');

        const response = await InteractLike.likePost(postId);

        if (response.status !== 200 || !response.data?.success) {
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

const unlikePostFE = async (
    postId: string,
    setError: React.Dispatch<React.SetStateAction<string>>,
    setSuccess: React.Dispatch<React.SetStateAction<string>>,
    refetchPost: () => Promise<void>
): Promise<void> => {
    try {
        if (!postId) {
            throw new Error('Invalid post ID');
        }

        setError('');
        setSuccess('');

        const response = await InteractLike.unlikePost(postId);

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

const likeCommentFE = async (
    commentId: string,
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

        const response = await InteractLike.likeComment(commentId);

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

const unlikeCommentFE = async (
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

        const response = await InteractLike.unlikeComment(commentId, postId);
        
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

export default {
    likePostFE,
    unlikePostFE,
    likeCommentFE,
    unlikeCommentFE
};