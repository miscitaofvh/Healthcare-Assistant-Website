import { Dispatch, SetStateAction } from "react";
import { toast } from "react-toastify";
import InteractTag from "../../../utils/api/Forum/tag";
import { Tag, NewTag, SummaryTag } from "../../../types/Forum/tag";
import { PostbyTag } from "../../../types/Forum/post";
import { PaginationData } from "../../../types/Forum/pagination";
import { TAG_MESSAGES } from "../../constants/forum-messages";

const validateTagInputs = (tag: NewTag): string | null => {
    const tagName = tag.tag_name.trim();
    const description = tag.description?.trim() || "";

    if (!tagName) return TAG_MESSAGES.ERROR.VALIDATION.NAME_REQUIRED;
    if (tagName.length < 2 || tagName.length > 30) {
        return TAG_MESSAGES.ERROR.VALIDATION.NAME_LENGTH;
    }
    if (description && (description.length < 5 || description.length > 150)) {
        return TAG_MESSAGES.ERROR.VALIDATION.DESC_LENGTH;
    }
    return null;
};

const handleApiResponse = (
    response: any,
    successStatus: number,
    errorMessage: string,
    showError: (message: string) => void
): boolean => {
    if (response.status !== successStatus || !response.data?.success) {
        const errorMsg = response.data?.message || errorMessage;
        const detailedMsg = Array.isArray(response.data?.errors)
            ? response.data.errors.map((err: { message: string }) => err.message).join("\n")
            : "";
        showError(`${errorMsg}${detailedMsg ? `\n${detailedMsg}` : ""}`);
        return false;
    }
    return true;
};

const loadTags = async (
    setLoading: Dispatch<SetStateAction<boolean>>,
    setTags: Dispatch<SetStateAction<Tag[]>>,
    setPagination: Dispatch<SetStateAction<PaginationData>>,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'tag_name',
    sortOrder: string = 'ASC'
): Promise<void> => {
    try {
        setLoading(true);
        const response = await InteractTag.getAllTags(page, limit, sortBy, sortOrder);

        if (!handleApiResponse(response, 200, TAG_MESSAGES.ERROR.LOAD, showError)) {
            return;
        }

        setTags(response.data.tags ?? []);
        setPagination(response.data.pagination ?? {
            currentPage: page,
            totalPages: 1,
            limit,
            totalItems: 0,
            sortBy,
            sortOrder
        });
        showSuccess(TAG_MESSAGES.SUCCESS.LOAD);
    } catch (err: any) {
        showError(err?.response?.data?.message ?? err?.message ?? TAG_MESSAGES.ERROR.LOAD);
    } finally {
        setLoading(false);
    }
};

const loadTagByID = async (
    id: number,
    setLoading: Dispatch<SetStateAction<boolean>>,
    setTag: Dispatch<SetStateAction<Tag | null>>,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    onSuccess: () => void = () => { }
): Promise<void> => {
    try {
        setLoading(true);
        const response = await InteractTag.getSummaryTagById(id);

        if (!handleApiResponse(response, 200, TAG_MESSAGES.ERROR.LOAD_SINGLE, showError)) {
            return;
        }

        setTag(response.data.tag || null);
        showSuccess(TAG_MESSAGES.SUCCESS.LOAD_SINGLE);
        onSuccess();
    } catch (err: any) {
        showError(err?.response?.data?.message ?? err?.message ?? TAG_MESSAGES.ERROR.LOAD_SINGLE);
    } finally {
        setLoading(false);
    }
};

const getSummaryTags = async (
    setLoading: Dispatch<SetStateAction<boolean>>,
    setTags: (tags: SummaryTag[]) => void,
    showError: (message: string) => void = toast.error,
    onSuccess: () => void = () => { }
): Promise<void> => {
    try {
        setLoading(true);
        const response = await InteractTag.getAllTagsSummary();

        if (!handleApiResponse(response, 200, TAG_MESSAGES.ERROR.LOAD_SUMMARY, showError)) {
            return;
        }

        setTags(response.data.tags ?? []);
        onSuccess();
    } catch (err: any) {
        showError(err?.response?.data?.message ?? err?.message ?? TAG_MESSAGES.ERROR.LOAD_SUMMARY);
    } finally {
        setLoading(false);
    }
};

const getPopularTags = async (
    setLoading: Dispatch<SetStateAction<boolean>>,
    setTags: (tags: SummaryTag[]) => void,
    showError: (message: string) => void = toast.error,
    onSuccess: () => void = () => { }
): Promise<void> => {
    try {
        setLoading(true);
        const response = await InteractTag.getPopularTags();

        if (!handleApiResponse(response, 200, TAG_MESSAGES.ERROR.LOAD_SUMMARY, showError)) {
            return;
        }

        setTags(response.data.tags ?? []);
        onSuccess();
    } catch (err: any) {
        showError(err?.response?.data?.message ?? err?.message ?? TAG_MESSAGES.ERROR.LOAD_SUMMARY);
    } finally {
        setLoading(false);
    }
};

const getSummaryTagsPost = async (
    setTagsLoading: Dispatch<SetStateAction<boolean>>,
    setTags: (tags: SummaryTag[]) => void,
    showError: (message: string) => void = toast.error,
    onSuccess: () => void = () => { }
): Promise<void> => {
    try {
        setTagsLoading(true);
        const response = await InteractTag.getAllTagsLittleSummary();

        if (!handleApiResponse(response, 200, TAG_MESSAGES.ERROR.LOAD_SUMMARY, showError)) {
            return;
        }

        setTags(response.data.tags ?? []);
        onSuccess();
    } catch (err: any) {
        showError(err?.response?.data?.message ?? err?.message ?? TAG_MESSAGES.ERROR.LOAD_SUMMARY);
    } finally {
        setTagsLoading(false);
    }
};

const loadPostsandTagByTag = async (
    id: string,
    setLoading: Dispatch<SetStateAction<boolean>>,
    setTag: Dispatch<SetStateAction<Tag | null>>,
    setPosts: Dispatch<SetStateAction<PostbyTag[]>>,
    setPagination: Dispatch<SetStateAction<PaginationData>>,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'created_at',
    sortOrder: string = 'DESC'
): Promise<void> => {
    try {
        setLoading(true);
        const response = await InteractTag.getPostsByTag(
            Number(id),
            page,
            limit,
            sortBy,
            sortOrder
        );

        if (!handleApiResponse(response, 200, TAG_MESSAGES.ERROR.LOAD_POSTS, showError)) {
            return;
        }

        setTag(response.data.tag ?? null);
        setPosts(response.data.posts ?? []);
        setPagination(prev => ({
            ...prev,
            ...response.data.pagination,
            currentPage: page,
            limit,
            sortBy,
            sortOrder
        }));
        showSuccess(TAG_MESSAGES.SUCCESS.LOAD_POSTS);
    } catch (err: any) {
        showError(err?.response?.data?.message ?? err?.message ?? TAG_MESSAGES.ERROR.LOAD_POSTS);
    } finally {
        setLoading(false);
    }
};

const handleCreateTag = async (
    tag: NewTag,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    onSuccess: () => void = () => { },
    setFormLoading?: Dispatch<SetStateAction<boolean>>
): Promise<void> => {
    try {
        setFormLoading?.(true);
        const validationError = validateTagInputs(tag);
        if (validationError) {
            showError(validationError);
            return;
        }

        const response = await InteractTag.createTag(tag);

        if (!handleApiResponse(response, 201, TAG_MESSAGES.ERROR.CREATE, showError)) {
            return;
        }

        showSuccess(TAG_MESSAGES.SUCCESS.CREATE);
        setTimeout(onSuccess, 2000);
    } catch (err: any) {
        showError(err?.response?.data?.message ?? err?.message ?? TAG_MESSAGES.ERROR.CREATE);
    } finally {
        setFormLoading?.(false);
    }
};

const handleUpdateTag = async (
    id: number,
    tag: NewTag,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    onSuccess: () => void = () => { },
    setFormLoading?: Dispatch<SetStateAction<boolean>>
): Promise<void> => {
    try {
        setFormLoading?.(true);
        const validationError = validateTagInputs(tag);
        if (validationError) {
            showError(validationError);
            return;
        }

        const response = await InteractTag.updateTag(id, tag);

        if (!handleApiResponse(response, 200, TAG_MESSAGES.ERROR.UPDATE, showError)) {
            return;
        }

        showSuccess(TAG_MESSAGES.SUCCESS.UPDATE);
        setTimeout(onSuccess, 2000);
    } catch (err: any) {
        showError(err?.response?.data?.message ?? err?.message ?? TAG_MESSAGES.ERROR.UPDATE);
    } finally {
        setFormLoading?.(false);
    }
};

const handleDeleteTag = async (
    id: number,
    showError: (message: string) => void = toast.error,
    showSuccess: (message: string) => void = toast.success,
    setFormLoading?: Dispatch<SetStateAction<boolean>>,
    onSuccess?: () => void
): Promise<void> => {
    try {
        setFormLoading?.(true);
        const response = await InteractTag.deleteTag(id);

        if (!handleApiResponse(response, 200, TAG_MESSAGES.ERROR.DELETE, showError)) {
            return;
        }

        showSuccess(TAG_MESSAGES.SUCCESS.DELETE);
        setTimeout(() => onSuccess?.(), 2000);
    } catch (err: any) {
        showError(err?.response?.data?.message ?? err?.message ?? TAG_MESSAGES.ERROR.DELETE);
    } finally {
        setFormLoading?.(false);
    }
};

export default {
    validateTagInputs,
    loadTags,
    loadTagByID,
    getSummaryTags,
    getPopularTags,
    getSummaryTagsPost,
    loadPostsandTagByTag,
    handleCreateTag,
    handleUpdateTag,
    handleDeleteTag
};