export interface CommentPost {
    post_id: number;
    comment_id: number;
    commented_by: string;
    parent_comment_id: number | null;
    depth: number;
    is_owner?: boolean;
    is_liked?: boolean;
    replies?: CommentPost[];
    like_count?: number;
    content: string;
    created_at: string;
    last_updated: string;
}

export interface ReplyComment {
    comment_id: number;
    commented_by: string;
    content: string;
    created_at: string;
    last_updated: string;
    post_id: number;
    likes: number;
}