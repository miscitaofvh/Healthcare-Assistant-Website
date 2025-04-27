

export const loadThreadsByCategory = async (
    categoryId: string,
    setLoading: (loading: boolean) => void,
    setThreads: (threads: any[]) => void,
    setError: (error: string) => void
) => {
    try {
        setLoading(true);
        const response = await fetch(`/api/categories/${categoryId}/threads`);
        if (!response.ok) throw new Error("Failed to load threads");
        const data = await response.json();
        setThreads(data);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
};