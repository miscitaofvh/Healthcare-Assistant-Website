export const FORUM_MESSAGES = {
    ERROR: {
        CATEGORY: {
            LOAD: "Failed to load categories. Please refresh or try again later.",
            LOAD_SINGLE: "Couldn't retrieve category details. It may not exist or you lack permission.",
            CREATE: "Category creation failed. Please check your inputs.",
            UPDATE: "Category update failed. Verify your changes and try again.",
            DELETE: "Couldn't delete category. It may contain threads or you lack permission.",
            VALIDATION: {
                NAME_REQUIRED: "Category name is required",
                NAME_LENGTH: "Name must be 3-50 characters",
                DESC_LENGTH: "Description must be 10-200 characters when provided"
            }
        },
        THREAD: {
            LOAD: "Failed to load category threads. Please try again."
        },
        GENERIC: {
            SERVER: "Server error occurred. Please try again.",
            NETWORK: "Network issue detected. Check your connection.",
            UNKNOWN: "An unexpected error occurred"
        }
    },
    SUCCESS: {
        CATEGORY: {
            LOAD: "Categories loaded successfully",
            LOAD_SINGLE: "Category details loaded",
            CREATE: "Category created successfully!",
            UPDATE: "Category updated successfully!",
            DELETE: "Category deleted successfully!"
        },
        THREAD: {
            LOAD: "Threads loaded successfully"
        }
    }
};

export const buildDetailedErrors = (data: any): string => {
    if (!data?.errors) return '';
    return Array.isArray(data.errors)
        ? data.errors.map((err: { message: string }) => err.message).join("\n")
        : '';
};

export const COMMENT_MESSAGES = {
    ERROR: {
        CREATE: 'Failed to create comment. Please try again.',
        UPDATE: 'Failed to update comment. Please try again.',
        DELETE: 'Failed to delete comment. Please try again.',
        GENERIC: 'An unexpected error occurred.'
    },
    SUCCESS: {
        CREATE: 'Comment posted successfully!',
        UPDATE: 'Comment updated successfully!',
        DELETE: 'Comment deleted successfully!'
    }
};

export const LIKE_MESSAGES = {
    ERROR: {
        LIKE_POST: "Failed to like the post. Please try again.",
        UNLIKE_POST: "Failed to remove like from post. Please try again.",
        LIKE_COMMENT: "Failed to like the comment. Please try again.",
        UNLIKE_COMMENT: "Failed to remove like from comment. Please try again.",
        GENERIC: "An unexpected error occurred."
    },
    SUCCESS: {
        LIKE_POST: "Post liked successfully!",
        UNLIKE_POST: "Post unliked successfully!",
        LIKE_COMMENT: "Comment liked successfully!",
        UNLIKE_COMMENT: "Comment unliked successfully!"
    }
};

export const REPORT_MESSAGES = {
    ERROR: {
        POST: "Failed to report post",
        COMMENT: "Failed to report comment",
        GENERIC: "An error occurred",
        EMPTY_REASON: "Please provide a reason for reporting"
    },
    SUCCESS: {
        POST: "Post reported successfully",
        COMMENT: "Comment reported successfully"
    }
};

export const TAG_MESSAGES = {
    ERROR: {
        VALIDATION: {
            NAME_REQUIRED: "Tag name is required",
            NAME_LENGTH: "Tag name must be 2-30 characters",
            DESC_LENGTH: "Description must be 5-150 characters when provided"
        },
        LOAD: "Failed to load tags",
        LOAD_SINGLE: "Failed to load tag details",
        LOAD_SUMMARY: "Failed to load tag summary",
        LOAD_POSTS: "Failed to load tag posts",
        CREATE: "Failed to create tag",
        UPDATE: "Failed to update tag",
        DELETE: "Failed to delete tag",
        GENERIC: "An error occurred"
    },
    SUCCESS: {
        LOAD: "Tags loaded successfully",
        LOAD_SINGLE: "Tag details loaded",
        LOAD_SUMMARY: "Tag summary loaded",
        LOAD_POSTS: "Tag posts loaded",
        CREATE: "Tag created successfully!",
        UPDATE: "Tag updated successfully!",
        DELETE: "Tag deleted successfully!"
    }
};

export const THREAD_MESSAGES = {
    ERROR: {
        VALIDATION: {
            NAME_REQUIRED: "Thread name is required",
            NAME_LENGTH: "Thread name must be 3-50 characters",
            DESC_LENGTH: "Description must be 10-200 characters when provided"
        },
        LOAD: "Failed to load threads",
        LOAD_SINGLE: "Failed to load thread details",
        LOAD_POSTS: "Failed to load thread posts",
        CREATE: "Failed to create thread",
        UPDATE: "Failed to update thread",
        DELETE: "Failed to delete thread",
        GENERIC: "An error occurred"
    },
    SUCCESS: {
        LOAD: "Threads loaded successfully",
        LOAD_SINGLE: "Thread details loaded",
        LOAD_POSTS: "Thread posts loaded",
        CREATE: "Thread created successfully!",
        UPDATE: "Thread updated successfully!",
        DELETE: "Thread deleted successfully!"
    }
};

export const POST_MESSAGES = {
    ERROR: {
        VALIDATION: {
            TITLE_REQUIRED: 'Post title is required',
            TITLE_LENGTH: 'Post title must be 3-100 characters',
            CONTENT_REQUIRED: 'Post content is required',
            CONTENT_LENGTH: 'Post content must be 10-2000 characters',
            CATEGORY_REQUIRED: 'Category is required',
            THREAD_REQUIRED: 'Thread is required'
        },
        LOAD: 'Failed to load posts',
        LOAD_SINGLE: 'Failed to load post details',
        LOAD_COMMENTS: 'Failed to load post comments',
        CREATE: 'Failed to create post',
        UPDATE: 'Failed to update post',
        DELETE: 'Failed to delete post',
        GENERIC: 'An error occurred'
    },
    SUCCESS: {
        LOAD: 'Posts loaded successfully',
        LOAD_SINGLE: 'Post details loaded',
        LOAD_COMMENTS: 'Post comments loaded',
        CREATE: 'Post created successfully!',
        UPDATE: 'Post updated successfully!',
        DELETE: 'Post deleted successfully!'
    }
};