// Tag Interfaces

export interface TagMapping {
    relation_id: number;
    post_id: number;
    tag_id: number;
}

export interface NewTag {
    tag_id?: number;
    tag_name: string;
    description?: string;
}

export interface TagSummary {
    tag_id: number;
    tag_name: string;
    created_by: string;
    description: string | null;
    usage_count: number;
    last_used_at: string | null;
}

export interface PostbyTag {
    author: string;
    post_id: number;
    title: string;
    content: string;
    created_at: string;
    last_updated: string;
    category_id: number;
    category_name: string;
    thread_id: number;
    thread_name: string;
    like_count: number;
    report_count: number;
}

export interface Tag {
    tag_id: number;
    tag_name: string;
    created_by: string;
    description: string | null;
    usage_count: number;
    last_used_at: string;
    created_at: string;
    last_updated: string;
}

// Thread Interfaces
export interface NewThread {
    thread_id: number;
    thread_name: string;
    description: string;
    category_id: number;
}

export interface ThreadDropdown {
    thread_id: number;
    thread_name: string;
    category_id?: number;
}
export interface ThreadSummary {
    thread_id: number;
    thread_name: string;
    description: string;
    category_id: number;
    category_name: string;
}
export interface Thread {
    thread_id: number;
    created_by: string;
    thread_name: string;
    description?: string;
    created_at: string;
    last_updated: string;
    last_post_date: string | null;
    last_post_author: string | null;
    post_count: number;
    category_id: number;
    category_name: string;
}

// Category Interfaces
export interface NewCategory {
    category_name: string;
    description?: string;
}
export interface CategorySummary {
    category_id?: number;
    category_name: string;
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
}

export interface CategoryMain {
    category_id: number;
    created_by: string;
    category_name: string;
    description: string | null;
    created_at: string;
    last_updated: string;
    thread_count: number;
    post_count: number;
    last_post_date: string | null;
}

// Comment Interfaces
export interface PostComment {
    post_id: number;
    comment_id: number;
    parent_comment_id: number | null;
    depth: number;
    is_owner?: boolean;
    is_liked?: boolean;
    like_count?: number;
    username: string;
    content: string;
    created_at: string;
    last_updated: string;
}

export interface TagPost {
    tag_id: number;
    tag_name: string;
    description?: string;
}

export interface PostListResponse {
    author: string;
    category_id: number;
    category_name: string;
    thread_id: number;
    thread_name: string;
    post_id: number;
    title: string;
    content: string;
    image_url: string | null;
    created_at: string;
    last_updated: string;
    like_count: number;
    tags: TagPost[];
}

export interface PostSummary {
    author: string;
    post_id: number;
    title: string;
    content: string;
    image_url: string | null;
    created_at: string;
    last_updated: string;
    like_count: number;
    tags: string[];
}

export interface PostNew {
    category_id?: number;
    thread_id: number;
    title: string;
    content: string;
    image_url?: string | null;
    tag_name: string[];
}

export interface Post {
    author: string;
    post_id: number;
    title: string;
    content: string;
    image_url: string | null;
    created_at: string;
    last_updated: string;
    thread_id: number;
    thread_name: string;
    category_id: number;
    category_name: string;
    like_count: number;
    is_owner?: boolean;
    is_liked?: boolean;
    tags: TagPost[];
    comments: PostComment[];
}
// Like Interfaces
export interface PostLike {
    like_id: number;
    post_id: number;
    user_id: string;
    created_at: string;
}

export interface CommentLike {
    like_id: number;
    comment_id: number;
    user_id: string;
    created_at: string;
}

// Report Interfaces
export interface PostReport {
    report_id: number;
    post_id: number;
    reported_by: string;
    reason: string;
    status: 'pending' | 'reviewed' | 'resolved';
    created_at: string;
    reviewed_by: string | null;
}

export interface CommentReport {
    report_id: number;
    comment_id: number;
    user_id: string;
    reason: string;
    status: 'pending' | 'resolved' | 'dismissed';
    created_at: string;
    reviewed_by: string | null;
    reviewed_at: string | null;
}

// Activity Interfaces
export interface ForumActivity {
    id: number;
    user_id: string;
    activity_type: 'post' | 'comment' | 'like' | 'report';
    target_type: 'post' | 'comment';
    target_id: number;
    activity_timestamp: string;
}

// Forum Interface
export interface Forum {
    id: number;
    user_id: string;
    category_id: number;
    thread_id: number;
    post_id: number;
    created_at: string;
}

export interface CommentResponse {
    comment_id: number;
    content: string;
    created_at: string;
    last_updated: string;
    post_id: number;
    user: {
        user_id: string;
        username: string;
    };
    likes: number;
}