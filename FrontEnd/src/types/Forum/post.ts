import { SummaryTag } from './tag';
import { CommentPost } from './comment';

export interface PostbyTag {
    post_id: number;
    created_by: string;
    title: string;
    content: string;
    created_at: string;
    last_updated: string;

    category_id: number;
    category_name: string;
    thread_id: number;
    thread_name: string;
    like_count: number;
    report_count?: number;
}

export interface PostListMain {
    created_by: string;
    category_id: number;
    category_name: string;
    thread_id: number;
    thread_name: string;
    post_id: number;
    title: string;
    content: string;
    created_at: string;
    last_updated: string;
    like_count: number;
    comment_count: number;
    tags: SummaryTag[];
}

export interface PostSummary {
    created_by: string;
    post_id: number;
    title: string;
    content: string;
    created_at: string;
    last_updated: string;
    like_count: number;
    tags: string[];
}

export interface NewPost {
    category_id?: number;
    thread_id: number;
    title: string;
    content: string;
    tags: string[];
}

export interface Post {
    post_id: number;
    created_by: string;
    title: string;
    content: string;
    created_at: string;
    last_updated: string;
    view_count: number;
    thread_id: number;
    thread_name: string;
    category_id: number;
    category_name: string;
    like_count: number;
    comment_count: number;
    is_sticky?: boolean;
    is_closed?: boolean;
    is_owner?: boolean;
    is_liked?: boolean;
    is_reported?: boolean;
    tags: SummaryTag[];
    comments: CommentPost[];
    total_pages?: number;
    current_page?: number;
}



