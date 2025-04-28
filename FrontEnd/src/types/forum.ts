// Comment Interfaces
export interface PostComment {
    post_id: number;
    comment_id: number;
    username: string;
    content: string;
    created_at: string;
    last_updated: string;
}

// Post Interfaces
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
    tags: string[];
    comments: PostComment[];
}
// Category Interfaces
export interface Category {
    category_id?: number;
    category_name: string;
    user_id?: string;
    description?: string;
    created_at?: string;
    last_updated?: string;
}

// Thread Interfaces
export interface Thread {
    thread_id: number;
    thread_name: string;
    category_id: number;
    user_id: string;
    description: string | null;
    created_at: string;
    last_updated: string;
}

// Tag Interfaces
export interface Tag {
    tag_id: number;
    tag_name: string;
    user_id: string;
    description: string | null;
    usage_count: number;
    last_used_at: string;
    created_at: string;
    last_updated: string;
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

// Tag Mapping Interface
export interface TagMapping {
    relation_id: number;
    post_id: number;
    tag_id: number;
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

// Response Interfaces
export interface CategoryResponse {
    category_id: number;
    category_name: string;
    description: string | null;
    created_at: string;
    last_updated: string;
    user: {
        // user_id: string;
        username: string;
    };
}

export interface ThreadResponse {
    thread_id: number;
    thread_name: string;
    description: string | null;
    created_at: string;
    last_updated: string;
    category: {
        category_id: number;
        category_name: string;
    };
    user: {
        user_id: string;
        username: string;
    };
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