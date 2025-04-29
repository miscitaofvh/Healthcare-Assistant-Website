import {
    getTagById,
    getPostsByTag,
    getAllTags,
    createTag,
    updateTag,
    deleteTag,
} from "../../../utils/api/Forum/tag";
import { Tag, NewTag } from "../../../types/forum";

export const loadTags = async (
    setLoading: (loading: boolean) => void,
    setTags: (tags: any[]) => void,
    setError: (msg: string) => void,
    setSuccess: (msg: string) => void
) => {
    try {
        setLoading(true);

        const response = await getAllTags();
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            const errorMsg = data?.message || "Unknown error occurred while loading tags.";
            setError(`Không thể tải tags: ${errorMsg}`);
            return;
        }

        setTags(data?.data?.tags || []);
        setSuccess("Tải danh sách tag thành công");
    } catch (err: any) {
        const errorMsg =
            err?.response?.data?.message ||
            err.message ||
            "Đã xảy ra lỗi khi tải danh sách tag";
        setError(errorMsg);
    } finally {
        setLoading(false);
    }
};

export const loadTagandPostsByTag = async (
    id: string,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setTag: React.Dispatch<React.SetStateAction<Tag | null>>,
    setPosts: React.Dispatch<React.SetStateAction<any[]>>,
    setError: React.Dispatch<React.SetStateAction<string>>
) => {
    try {
        setLoading(true);
        const response = await getPostsByTag(Number(id));
        const { status, data } = response;
        if (status !== 200 || !data?.success) {
            const errorMsg = data?.message || "Không thể tải dữ liệu thẻ và bài viết.";
            setError(errorMsg);
            return;
        }
        if (!data.tag) {
            setError("Không tìm thấy tag tương ứng.");
            setTag(null);
            setPosts([]);
            return;
        } 

        if (!data.posts) {
            setError("Không tìm thấy posts tương ứng.");
            setTag(null);
            setPosts([]);
            return;
        } 
        setTag(data.tag);
        setPosts(data.posts || []);

        if (response.data.posts) {
            setPosts(response.data.posts);
        }
    } catch (error) {
        setError("Failed to load posts. Please try again later.");
        console.error("Error loading posts:", error);
    } finally {
        setLoading(false);
    }
};

export const handleCreateTag = async (
    tag: NewTag,
    setFormLoading: any,
    setError: any,
    setSuccess: any,
    callback: () => void
) => {
    try {
        setFormLoading(true);
        await createTag(tag);
        setSuccess("Tag created successfully");
        callback();
    } catch (err: any) {
        setError(err.message || "Failed to create tag");
    } finally {
        setFormLoading(false);
    }
}

export const handleUpdateTag = async (
    id: number,
    tag: NewTag,
    setFormLoading: (loading: boolean) => void,
    setError: (msg: string) => void,
    setSuccess: (msg: string) => void,
    callback: () => void
) => {
    try {
        setFormLoading(true);

        const response = await updateTag(id, tag);
        const { status, data } = response;

        if (status !== 200 || !data?.success) {
            const errorMessages = data?.errors?.map((e: any) => e.msg).join("; ") || "Unknown error";
            setError(`Cập nhật thất bại: ${errorMessages}`);
            return;
        }

        setSuccess(data.message || "Tag updated successfully");
        callback();
    } catch (err: any) {
        const errorMsg =
            err?.response?.data?.message ||
            err.message ||
            "Đã xảy ra lỗi trong quá trình cập nhật";
        setError(errorMsg);
    } finally {
        setFormLoading(false);
    }
};

export async function handleDeleteTag(
    id: number,
    setFormLoading: any,
    setError: any,
    setSuccess: any,
    callback: () => void
) {
    try {
        setFormLoading(true);
        await deleteTag(id);
        setSuccess("Tag deleted successfully");
        callback();
    } catch (err: any) {
        setError(err.message || "Failed to delete tag");
    } finally {
        setFormLoading(false);
    }
}