// Thread Interfaces
export interface NewThread {
    category_id: number;
    thread_id?: number;
    thread_name: string;
    description: string;
}

export interface ThreadDropdown {
    category_id?: number;
    thread_id: number;
    thread_name: string;
}
export interface ThreadSummary {
    category_id: number;
    category_name: string;
    thread_id: number;
    thread_name: string;
    description: string;
}
export interface Thread {
    thread_id: number;
    thread_name: string;
    created_by: string;
    is_owner?: boolean;
    category_id: number;
    category_name: string;
    description: string | null;
    created_at: string;
    last_updated: string;
    last_post_date: string | null;
    last_post_author: string | null;
    post_count: number;
}