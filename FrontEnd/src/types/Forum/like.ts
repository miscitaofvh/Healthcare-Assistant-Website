
export interface LikePost {
    like_id: number;
    post_id: number;
    liked_by: string;
    created_at: string;
}

export interface LikeComment {
    like_id: number;
    liked_by: number;
    username: string;
    created_at: string;
}