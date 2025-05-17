export interface TagMapping {
    relation_id: number;
    post_id: number;
    tag_id: number;
}

export interface NewTag {
    tag_id?: number;
    tag_name: string;
    description: string;
}

export interface SummaryTag {
    tag_id: number;
    tag_name: string;
    description?: string;
    post_count?: number;
    created_by?: string;
    last_used_at?: string;
}

export interface Tag {
    tag_id: number;
    tag_name: string;
    created_by: string;
    is_owner?: boolean;
    description: string | null;
    post_count?: number;
    last_used_at?: string;
    created_at?: string;
    last_updated: string;
}

