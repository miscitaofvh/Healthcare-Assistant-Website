// Category Interfaces
export interface NewCategory {
    category_name: string;
    description: string;
}
export interface SummaryCategory {
    category_id?: number;
    category_name: string;
    description?: string;
}

export interface Category {
    category_id: number;
    created_by: string;
    category_name: string;
    description: string | null;
    created_at: string;
    last_updated: string;
    thread_count: number;
    post_count: number;
    is_owner?: boolean;
    last_post_date?: string | null;
}