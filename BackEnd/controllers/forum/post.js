import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import {
    getAllPostsDB,
    getSummaryPostsDB,
    getPostByIdDB,
    getPostsByUserDB,
    createPostDB,
    updatePostDB,
    deletePostDB,
} from "../../models/Forum/post.js";

dotenv.config();

export const getAllPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const sortBy = req.query.sortBy || 'created_at';
        const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';
        const categoryId = req.query.categoryId;
        const tagId = req.query.tagId;

        if (page < 1 || limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                message: "Invalid pagination parameters",
                details: {
                    validPage: "Must be ≥ 1",
                    validLimit: "Must be between 1 and 100"
                }
            });
        }

        const validSortColumns = ['title', 'created_at', 'updated_at', 'view_count', 'like_count'];
        if (!validSortColumns.includes(sortBy)) {
            return res.status(400).json({
                success: false,
                message: "Invalid sort parameter",
                validSortColumns
            });
        }

        const { posts, totalPosts } = await getAllPostsDB(
            page,
            limit,
            search,
            sortBy,
            sortOrder,
            categoryId,
            tagId
        );

        const totalPages = Math.ceil(totalPosts / limit);

        res.status(200).json({
            success: true,
            data: {
                posts,
                pagination: {
                    totalItems: totalPosts,
                    totalPages,
                    currentPage: page,
                    itemsPerPage: limit,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1
                },
                filters: {
                    search,
                    sortBy,
                    sortOrder,
                    ...(categoryId && { categoryId }),
                    ...(tagId && { tagId })
                }
            }
        });
    } catch (error) {
        console.error("Error getting all posts:", error);

        const statusCode = error.statusCode || 500;
        const errorResponse = {
            success: false,
            message: "Error fetching posts",
            error: error.message
        };

        if (process.env.NODE_ENV === 'development') {
            errorResponse.stack = error.stack;
        }

        res.status(statusCode).json(errorResponse);
    }
};

export const getSummaryPosts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const type = req.query.type || 'recent'; // recent, popular, trending

        if (limit < 1 || limit > 20) {
            return res.status(400).json({
                success: false,
                message: "Invalid limit parameter",
                validLimit: "Must be between 1 and 20"
            });
        }

        const validTypes = ['recent', 'popular', 'trending'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid type parameter",
                validTypes
            });
        }

        const posts = await getSummaryPostsDB(limit, type);

        res.status(200).json({
            success: true,
            data: {
                posts,
                meta: {
                    count: posts.length,
                    type,
                    limit
                }
            }
        });
    } catch (error) {
        console.error("Error getting summary posts:", error);

        const statusCode = error.statusCode || 500;
        const errorResponse = {
            success: false,
            message: "Error fetching summary posts",
            error: error.message
        };

        if (process.env.NODE_ENV === 'development') {
            errorResponse.stack = error.stack;
        }

        res.status(statusCode).json(errorResponse);
    }
};

export const getPostById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Post ID is required",
                details: {
                    example: "/api/posts/123"
                }
            });
        }

        const includeComments = req.query.includeComments === 'true';
        const includeAuthor = req.query.includeAuthor !== 'false'; // true by default
        const includeStats = req.query.includeStats === 'true';

        const post = await getPostByIdDB(id, {
            includeComments,
            includeAuthor,
            includeStats
        });

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
                details: {
                    requestedId: id
                }
            });
        }

        // incrementPostViewCount(id).catch(err =>
        //     console.error("Failed to increment view count:", err)
        // );

        res.status(200).json({
            success: true,
            post: post,
            meta: {
                includes: {
                    comments: includeComments,
                    author: includeAuthor,
                    stats: includeStats
                }
            }
        });
    } catch (error) {
        console.error("Error getting post by ID:", error);

        let statusCode = 500;
        let message = "Error fetching post";

        if (error.message === "Invalid post ID") {
            statusCode = 400;
            message = error.message;
        }

        const errorResponse = {
            success: false,
            message,
            error: error.message
        };

        if (process.env.NODE_ENV === 'development') {
            errorResponse.stack = error.stack;
        }

        res.status(statusCode).json(errorResponse);
    }
};

export const getPostsByUser = async (req, res) => {
    try {
        const { username } = req.params;

        if (!username || typeof username !== 'string' || username.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Valid username is required",
                details: {
                    example: "/api/users/johndoe/posts"
                }
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || 'created_at';
        const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';

        if (page < 1 || limit < 1 || limit > 50) {
            return res.status(400).json({
                success: false,
                message: "Invalid pagination parameters",
                details: {
                    validPage: "Must be ≥ 1",
                    validLimit: "Must be between 1 and 50"
                }
            });
        }

        const validSortColumns = ['created_at', 'updated_at', 'view_count', 'like_count'];
        if (!validSortColumns.includes(sortBy)) {
            return res.status(400).json({
                success: false,
                message: "Invalid sort parameter",
                validSortColumns
            });
        }

        const { posts, totalPosts } = await getPostsByUserDB(
            username.trim(),
            page,
            limit,
            sortBy,
            sortOrder
        );

        if (posts.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    posts: [],
                    message: "No posts found for this user"
                },
                meta: {
                    username,
                    totalPosts: 0
                }
            });
        }

        res.status(200).json({
            success: true,
            data: {
                posts,
                pagination: {
                    totalItems: totalPosts,
                    totalPages: Math.ceil(totalPosts / limit),
                    currentPage: page,
                    itemsPerPage: limit,
                    hasNextPage: page < Math.ceil(totalPosts / limit),
                    hasPreviousPage: page > 1
                },
                user: {
                    username,
                    postCount: totalPosts
                }
            }
        });

    } catch (error) {
        console.error("Error fetching user posts:", error);

        let statusCode = 500;
        let message = "Error fetching user posts";

        if (error.message === "User not found") {
            statusCode = 404;
            message = error.message;
        }

        const errorResponse = {
            success: false,
            message,
            error: error.message,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        };

        res.status(statusCode).json(errorResponse);
    }
};

export const createPost = async (req, res) => {
    try {
        if (!req.cookies.auth_token) {
            return res.status(401).json({
                success: false,
                message: "Authentication token required"
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        } catch (jwtError) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token",
                error: jwtError.message
            });
        }

        const author_id = decoded.user_id;
        if (!author_id) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized access"
            });
        }

        const { category_name, thread_name, content, tag_name, image_url } = req.body;

        const result = await createPostDB(
            author_id,
            category_name.trim(),
            thread_name.trim(),
            content.trim(),
            tag_name?.trim(),
            image_url?.trim()
        );

        res.status(201).json({
            success: true,
            message: "Post created successfully",
            data: {
                postId: result.post_id,
                threadId: result.thread_id,
                category: result.category_name,
                threadName: result.thread_name,
                createdAt: result.created_at
            },
            links: {
                viewPost: `/forum/posts/${result.post_id}`,
                viewThread: `/forum/threads/${result.thread_id}`
            }
        });

    } catch (error) {
        console.error("Error creating post:", error);

        const errorMap = {
            "Category not found": 404,
            "Thread name already exists": 409,
            "User is banned from posting": 403,
            "Tag not found": 400
        };

        const statusCode = errorMap[error.message] || 500;
        const message = error.message || "Error creating post";

        const errorResponse = {
            success: false,
            message,
            error: error.message,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        };

        if (error.message === "Thread name already exists") {
            errorResponse.suggestion = "Try a different thread name or search for existing threads";
        }

        res.status(statusCode).json(errorResponse);
    }
};

export const updatePost = async (req, res) => {
    try {
        if (!req.cookies.auth_token) {
            return res.status(401).json({
                success: false,
                message: "Authentication token required"
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        } catch (jwtError) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token",
                error: jwtError.message
            });
        }

        const author_id = decoded.user_id;
        if (!author_id) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized access"
            });
        }

        const { id } = req.params;
        const { content, image_url, edit_reason } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Post ID is required",
                details: {
                    example: "/api/posts/123"
                }
            });
        }

        const result = await updatePostDB(
            id,
            author_id,
            content.trim(),
            image_url?.trim(),
        );

        res.status(200).json({
            success: true,
            message: "Post updated successfully",
            data: {
                postId: id,
                updatedAt: result.updated_at,
                editCount: result.edit_count,
                ...(edit_reason && { editReason: edit_reason.trim() })
            },
            links: {
                viewPost: `/forum/posts/${id}`,
                viewHistory: `/forum/posts/${id}/history`
            }
        });

    } catch (error) {
        console.error("Error updating post:", error);

        const errorMap = {
            "Post not found": 404,
            "Unauthorized to edit this post": 403,
            "Post is locked": 423, // 423 Locked
            "Invalid post ID": 400
        };

        const statusCode = errorMap[error.message] || 500;
        const message = error.message || "Error updating post";

        const errorResponse = {
            success: false,
            message,
            error: error.message,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        };

        if (error.message === "Unauthorized to edit this post") {
            errorResponse.details = {
                required: "Ownership or moderator privileges",
                currentUser: decoded?.user_id
            };
        }

        res.status(statusCode).json(errorResponse);
    }
};

export const deletePost = async (req, res) => {
    try {
        if (!req.cookies.auth_token) {
            return res.status(401).json({
                success: false,
                message: "Authentication token required"
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        } catch (jwtError) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token",
                error: jwtError.message
            });
        }

        const author_id = decoded.user_id;
        const is_moderator = decoded.is_moderator || false;
        if (!author_id) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized access"
            });
        }

        const { id } = req.params;
        const { delete_reason } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Post ID is required",
                details: {
                    example: "/api/posts/123"
                }
            });
        }

        const result = await deletePostDB(
            id,
            author_id,
            is_moderator,
            delete_reason?.trim()
        );

        res.status(200).json({
            success: true,
            message: "Post deleted successfully",
            data: {
                postId: id,
                deletedAt: new Date().toISOString(),
                ...(is_moderator && { deletedBy: `moderator:${author_id}` }),
                ...(delete_reason && { deleteReason: delete_reason.trim() })
            }
        });

    } catch (error) {
        console.error("Error deleting post:", error);

        const errorMap = {
            "Post not found": 404,
            "Unauthorized to delete this post": 403,
            "Post is locked": 423, // 423 Locked
            "Invalid post ID": 400
        };

        const statusCode = errorMap[error.message] || 500;
        const message = error.message || "Error deleting post";

        const errorResponse = {
            success: false,
            message,
            error: error.message,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        };

        if (error.message === "Unauthorized to delete this post") {
            errorResponse.details = {
                required: "Ownership or moderator privileges",
                currentUser: decoded?.user_id
            };
        }

        res.status(statusCode).json(errorResponse);
    }
};
