import { toast } from "react-toastify";
import InteractReport from "../../../utils/api/Forum/report";
import { REPORT_MESSAGES } from "../../constants/forum-messages";


const handleReportResponse = (
    response: any,
    errorMessage: string,
    showError: (message: string) => void
): boolean => {
    if (response.status !== 201 || !response.data?.success) {
        const errorMsg = response.data?.errors?.[0]?.message ||
            response.data?.message ||
            errorMessage;
        showError(errorMsg);
        return false;
    }
    return true;
};

const reportPostFE = async (
    postId: string,
    reportReason: string,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    onSuccess: () => void = () => { }
): Promise<void> => {
    try {
        if (!reportReason.trim()) {
            showError(REPORT_MESSAGES.ERROR.EMPTY_REASON);
            return;
        }

        const response = await InteractReport.reportPost(postId, reportReason.trim());

        if (!handleReportResponse(response, REPORT_MESSAGES.ERROR.POST, showError)) {
            return;
        }

        showSuccess(REPORT_MESSAGES.SUCCESS.POST);
        onSuccess();
    } catch (err: unknown) {
        showError(
            err instanceof Error ? err.message :
                typeof err === 'string' ? err :
                    REPORT_MESSAGES.ERROR.GENERIC
        );
    }
};

const reportCommentFE = async (
    commentId: string,
    reason: string,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    onSuccess: () => void = () => { }
): Promise<void> => {
    try {
        if (!reason.trim()) {
            showError(REPORT_MESSAGES.ERROR.EMPTY_REASON);
            return;
        }

        const response = await InteractReport.reportComment(commentId, { reason: reason.trim() });

        if (!handleReportResponse(response, REPORT_MESSAGES.ERROR.COMMENT, showError)) {
            return;
        }

        showSuccess(REPORT_MESSAGES.SUCCESS.COMMENT);
        onSuccess();
    } catch (err: unknown) {
        showError(
            err instanceof Error ? err.message :
                typeof err === 'string' ? err :
                    REPORT_MESSAGES.ERROR.GENERIC
        );
    }
};

export default {
    reportPostFE,
    reportCommentFE
};