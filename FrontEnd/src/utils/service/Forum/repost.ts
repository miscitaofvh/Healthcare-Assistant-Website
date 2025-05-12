import { toast } from "react-toastify";

import  InteractReport  from "../../api/Forum/repost";
const reportPostFE = async (
    postId: string,
    reportReason: string,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    refetchPost: () => void
): Promise<void> => {
    try {
        const response = await InteractReport.reportPost(postId, reportReason);

        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            throw new Error(response.data?.message || 'Failed to like post');
        }

        showSuccess(response.data.message || 'Post like updated');
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

const reportCommentFE = async (
    commentId: string,
    reason: string,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    onSuccess: () => void
): Promise<void> => {
    try {
        const reportData = {
            commentId,
            reason: reason
        };

        const response = await InteractReport.reportComment(commentId, reportData);

        const { status, data } = response;

        if (status !== 200 || data?.success) {
            showError(response.data?.message || 'Failed to report comment');
            return;
        }

        showSuccess('Comment reported successfully');
        onSuccess();

    } catch (err: unknown) {
        const errorMessage = err instanceof Error
            ? err.message
            : typeof err === 'string'
                ? err
                : 'Failed to report comment';

        showError(errorMessage);
    }
};

export default {
    reportPostFE,
    reportCommentFE
};