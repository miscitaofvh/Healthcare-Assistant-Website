import {
    getAllTags,
    getTagById,
    getAllTagsSummary,
    getAllTagsLittleSummary,
    getPostsByTag,
    createTag,
    updateTag,
    deleteTag,
} from "../../../utils/api/Forum/tag";
import { Tag, NewTag, TagPost, PostbyTag } from "../../../types/forum";

import { Dispatch, SetStateAction } from "react";

export const loadTags = async (
    setLoading: Dispatch<SetStateAction<boolean>>,
    setTags: Dispatch<SetStateAction<Tag[]>>,
    setError: Dispatch<SetStateAction<string>>,
    setSuccess: Dispatch<SetStateAction<string>>
) => {
    try {
        setLoading(true);
        setError("");
        setSuccess("");

        const response = await getAllTags();
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            throw new Error(data?.message || "Unknown error occurred while loading tags.");
        }

        setTags(data.data?.tags || []);
        setSuccess("Tags loaded successfully");
    } catch (err: any) {
        setError(err?.response?.data?.message || err.message || "Errors occurred while loading tags.");
    } finally {
        setLoading(false);
    }
};

export const loadTagByID = async (
    id: number,
    setLoading: Dispatch<SetStateAction<boolean>>,
    setTags: Dispatch<SetStateAction<Tag | null>>,
    setError: Dispatch<SetStateAction<string>>,
    setSuccess: Dispatch<SetStateAction<string>>
) => {
    try {
        setLoading(true);
        setError("");
        setSuccess("");

        const response = await getTagById(id);
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            throw new Error(data?.message || "Unknown error occurred while loading tags.");
        }

        setTags(data?.tag || []);
        setSuccess("Tag loaded successfully");
    } catch (err: any) {
        setError(err?.response?.data?.message || err.message || "Errors occurred while loading tags.");
    } finally {
        setLoading(false);
    }
};

export const loadTagsSummary = async (
    setLoading: Dispatch<SetStateAction<boolean>>,
    setTags: Dispatch<SetStateAction<Tag[]>>,
    setError: Dispatch<SetStateAction<string>>,
    setSuccess: Dispatch<SetStateAction<string>>
) => {
    try {
        setLoading(true);
        setError("");
        setSuccess("");

        const response = await getAllTagsSummary();
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            throw new Error(data?.message || "Unknown error occurred while loading tags.");
        }

        setTags(data.data?.tags || []);
        setSuccess("Tải danh sách tag thành công");
    } catch (err: any) {
        setError(err?.response?.data?.message || err.message || "Đã xảy ra lỗi khi tải danh sách tag");
    } finally {
        setLoading(false);
    }
};

export const loadTagsPostSummary = async (
    setLoading: Dispatch<SetStateAction<boolean>>,
    setTags: Dispatch<SetStateAction<TagPost[]>>,
    setError: Dispatch<SetStateAction<string>>,
    setSuccess: Dispatch<SetStateAction<string>>
) => {
    try {
        setLoading(true);
        setError("");
        setSuccess("");

        const response = await getAllTagsLittleSummary();
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            throw new Error(data?.message || "Unknown error occurred while loading tags.");
        }

        setTags(data.data?.tags || []);
        setSuccess("Tải danh sách tag thành công");
    } catch (err: any) {
        setError(err?.response?.data?.message || err.message || "Đã xảy ra lỗi khi tải danh sách tag");
    } finally {
        setLoading(false);
    }
};

export const loadTagandPostsByTag = async (
    id: string,
    setLoading: Dispatch<SetStateAction<boolean>>,
    setTag: Dispatch<SetStateAction<Tag | null>>,
    setPosts: Dispatch<SetStateAction<PostbyTag[]>>,
    setError: Dispatch<SetStateAction<string>>,
    setSuccess: Dispatch<SetStateAction<string>>
) => {
    try {
        setLoading(true);
        setError("");
        setSuccess("");

        const response = await getPostsByTag(Number(id));
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            throw new Error(data?.message || "Không thể tải dữ liệu thẻ và bài viết.");
        }
        if (!data.tag || !data.posts) {
            throw new Error("Không tìm thấy tag hoặc bài viết tương ứng.");
        }

        setTag(data.tag);
        setPosts(data.posts || []);
        setSuccess("Tag and posts loaded successfully");
    } catch (error: any) {
        setTag(null);
        setPosts([]);
        setError(error?.message || "Failed to load posts. Please try again later.");
        console.error("Error loading posts by tag:", error);
    } finally {
        setLoading(false);
    }
};

export const handleCreateTag = async (
    tag: NewTag,
    setFormLoading: Dispatch<SetStateAction<boolean>>,
    setError: Dispatch<SetStateAction<string>>,
    setSuccess: Dispatch<SetStateAction<string>>,
    callback: () => void
) => {
    try {
        setFormLoading(true);
        setError("");
        setSuccess("");

        const response = await createTag(tag);
        const { data } = response;

        if (!data?.success) {
            throw new Error(data?.message || "Failed to create tag.");
        }

        setSuccess(data.message || "Tag created successfully");

        setTimeout(callback, 2000);
    } catch (err: any) {
        setError(err?.response?.data?.message || err.message || "Failed to create tag");
    } finally {
        setFormLoading(false);
    }
};

export const handleUpdateTag = async (
    id: number,
    tag: NewTag,
    setFormLoading: Dispatch<SetStateAction<boolean>>,
    setError: Dispatch<SetStateAction<string>>,
    setSuccess: Dispatch<SetStateAction<string>>,
    onSuccess: () => void
) => {
    try {
        setFormLoading(true);
        setError("");
        setSuccess("");

        const response = await updateTag(id, tag);
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            const errors = data?.errors?.map((e: any) => e.msg).join("; ");
            throw new Error(errors || data?.message || "Update failed");
        }

        setSuccess(data.message || "Tag updated successfully");

        setTimeout(onSuccess, 2000);
    } catch (err: any) {
        setError(err?.response?.data?.message || err.message || "An error occurred while updating");
        console.error("Update tag error:", err);
    } finally {
        setFormLoading(false);
    }
};

export const handleDeleteTag = async (
    id: number,
    setFormLoading: Dispatch<SetStateAction<boolean>>,
    setError: Dispatch<SetStateAction<string>>,
    setSuccess: Dispatch<SetStateAction<string>>,
    callback: () => void
) => {
    try {
        setFormLoading(true);
        setError("");
        setSuccess("");

        const response = await deleteTag(id);
        const { data } = response;

        if (!data?.success) {
            throw new Error(data?.message || "Failed to delete tag.");
        }

        setSuccess("Tag deleted successfully");

        setTimeout(callback, 2000);
    } catch (err: any) {
        setError(err?.response?.data?.message || err.message || "Failed to delete tag");
    } finally {
        setFormLoading(false);
    }
};
