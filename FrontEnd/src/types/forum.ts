export interface Post {
    post_id: number;
    thread_id: number;
    thread_name: string;
    user_id: string;
    username: string;
    title: string;
    content: string;
    created_at: string;
    last_updated: string;
    image_url: string | null;
    tag_name: string[];
}

export interface Tag {
    tag_id: number;
    tag_name: string;
    description: string | null;
    created_at: string;
    last_updated: string;
}