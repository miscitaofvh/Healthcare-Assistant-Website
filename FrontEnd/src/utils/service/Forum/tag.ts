import {
    getTagById,
    getPostsByTag,
    getAllTags,
    createTag,
    updateTag,
    deleteTag,
} from "../../../utils/api/Forum/tag";
import { Tag, NewTag } from "../../../types/forum";

export const loadTagById = async (
    id: string,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setTag: React.Dispatch<React.SetStateAction<Tag | null>>,
    setError: React.Dispatch<React.SetStateAction<string>>
) => {
    try {
        setLoading(true);
        const response = await getTagById(Number(id));
        if (response?.data) {
            setTag(response.data.data);
        } else {
            setError("Failed to load tag.");
        }
    } catch (error) {
        setError("Failed to load tag. Please try again later.");
        console.error("Error loading tag:", error);
    } finally {
        setLoading(false);
    }
};

// Load posts by tag ID
export const loadPostsByTag = async (
    id: string,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setTag: React.Dispatch<React.SetStateAction<Tag | null>>,
    setPosts: React.Dispatch<React.SetStateAction<any[]>>,
    setError: React.Dispatch<React.SetStateAction<string>>
) => {
    try {
        setLoading(true);
        const response = await getPostsByTag(Number(id));
        if (response?.data) {
            // setTag(response.data.data);
            setPosts(response.data.data);
        } else {
            setError("Failed to load posts.");
        }
    } catch (error) {
        setError("Failed to load posts. Please try again later.");
        console.error("Error loading posts:", error);
    } finally {
        setLoading(false);
    }
};

export async function loadTags(
    setLoading: any,
    setTags: any,
    setError: any,
    setSuccess: any
) {
    try {
        setLoading(true);
        const res = await getAllTags();
        setTags(res.data.data || []);
        setSuccess("Tags loaded successfully");
    } catch (err: any) {
        setError(err.message || "Failed to load tags");
    } finally {
        setLoading(false);
    }
}

export async function handleCreateTag(
    tag: NewTag,
    setFormLoading: any,
    setError: any,
    setSuccess: any,
    callback: () => void
) {
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

export async function handleUpdateTag(
    id: number,
    tag: NewTag,
    setFormLoading: any,
    setError: any,
    setSuccess: any,
    callback: () => void
) {
    try {
        setFormLoading(true);
        await updateTag(id, tag);
        setSuccess("Tag updated successfully");
        callback();
    } catch (err: any) {
        setError(err.message || "Failed to update tag");
    } finally {
        setFormLoading(false);
    }
}

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