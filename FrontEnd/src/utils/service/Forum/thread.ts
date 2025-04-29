import {
    getAllThreads,
    getSummaryThreads,
    updateThread,
    deleteThread,
    getThreadById,
    getPostsByThread
} from "../../../utils/api/Forum/thread";
import { Category, CategoryResponse, PostResponse } from "../../../types/forum";

// export const loadThreadsByCategory = async (
//     categoryId: string,
//     setLoading: (loading: boolean) => void,
//     setThreads: (threads: any[]) => void,
//     setError: (error: string) => void
// ) => {
//     try {
//         setLoading(true);
//         const response = await getAllThreads(categoryId);
//         if (!response.ok) throw new Error("Failed to load threads");
//         const data = await response.json();
//         setThreads(data);
//     } catch (err: any) {
//         setError(err.message);
//     } finally {
//         setLoading(false);
//     }
// };

export const loadThreads = async (
    setLoading: (loading: boolean) => void,
    setThreads: (threads: any[]) => void,
    setError: (error: string) => void
) => {
    try {
        setLoading(true);
        const response = await getAllThreads();
        if (response.status !== 200) throw new Error("Failed to load threads");
        const data = response.data; // no need for await here
        setThreads(data);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
};

export const loadThreadById = async (
    id: string | undefined,
    setLoading: (loading: boolean) => void,
    setThread: (thread: any) => void,
    setError: (error: string) => void
) => {
    try {
        setLoading(true);
        if (!id) throw new Error("Invalid thread ID");

        const threadRes = await getThreadById(Number(id));
        if (threadRes.status !== 200) throw new Error("Failed to load thread");
        setThread(threadRes.data);
    } catch (err: any) {
        console.error(err);
        setError(err.message || "Something went wrong");
    } finally {
        setLoading(false);
    }
};

export const loadPostsByThread = async (
    id: string | undefined,
    setLoading: (loading: boolean) => void,
    setPosts: (posts: any[]) => void,
    setError: (error: string) => void
) => {
    try {
        setLoading(true);
        if (!id) throw new Error("Invalid thread ID");

        // Load posts inside the thread
        const postsRes = await getPostsByThread(Number(id));
        if (postsRes.status !== 200) throw new Error("Failed to load posts");
        // In your case, posts are FLAT, fix it manually
        const mappedPosts = postsRes.data.map((post: any) => ({
            post_id: post.post_id,
            content: post.content,
            image_url: post.image_url,
            created_at: post.created_at,
            last_updated: post.last_updated,
            user: {
                user_id: post.user_id,
                username: post.username || "Unknown User", // fallback
            },
        }));
        setPosts(mappedPosts);
    } catch (err: any) {
        console.error(err);
        setError(err.message || "Something went wrong");
    } finally {
        setLoading(false);
    }
};
