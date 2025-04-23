import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import {
    getPostsDB,
    getPostByIdDB,
    createPostDB,
    updatePostDB,
    deletePostDB,
    getCommentsDB,
    createCommentDB,
    deleteCommentDB,
    getThreadByIdDB,
    createThreadDB,
    getThreadNameDB,
    getCategoryNameDB,
    createCategoryDB,
    likePostDB,
    unlikePostDB,
    reportPostDB,
    getTagsDB,
    getTagByIdDB,
    getCategoriesDB,
    getThreadsDB,
    updateTagDB,
    getTagsofForumPostDB
} from "../models/ForumPost.js";

dotenv.config();

// Get all posts
export const getPosts = async (req, res) => {
    try {
        const posts = await getPostsDB();
        res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching posts" });
    }
};

// Get post by ID
export const getPostById = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await getPostByIdDB(id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        res.status(200).json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching post" });
    }
};

// Create a new post
export const createPost = async (req, res) => {
    try {
        const { category_name, thread_name, content, tag_name, image_url } = req.body;
        
        if (!req.cookies.auth_token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        console.log(decoded);
        const user_id = decoded.user_id;
        const username = decoded.username;
        
        const forum_post = await createPostDB( user_id, username, category_name, thread_name, content, tag_name, image_url);
        const postId = forum_post.insertId; 
        res.status(201).json({ message: "Post created successfully", postId });
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ message: error.message || "Error creating post" });
    }
};


// Update a post
export const updatePost = async (req, res) => {
    try {

        const { id } = req.params;
        const { content, image_url } = req.body;

        if (!req.cookies.auth_token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const user_id = decoded.user_id;

        const post = await getPostByIdDB(id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (post.user_id !== user_id) {
            return res.status(403).json({ message: "Not authorized to update this post" });
        }

        const result = await updatePostDB(id, content, image_url);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating post" });
    }
};

// Delete a post
export const deletePost = async (req, res) => {
    try {

        const { id } = req.params;

        if (!req.cookies.auth_token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const user_id = decoded.user_id;

        // Verify post ownership
        const post = await getPostByIdDB(id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (post.user_id !== user_id) {
            return res.status(403).json({ message: "Not authorized to delete this post" });
        }

        const result = await deletePostDB(id);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting post" });
    }
};

// Get comments for a post
export const getComments = async (req, res) => {
    try {
        const { id } = req.params; // post_id
        const comments = await getCommentsDB(id);
        res.status(200).json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching comments" });
    }
};

// Create a comment for a post
export const createComment = async (req, res) => {
    try {
        const { id } = req.params; // post_id
        const { content, user_id } = req.body;
        const result = await createCommentDB(id, content, user_id);
        res.status(201).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating comment" });
    }
};

// Delete a comment
export const deleteComment = async (req, res) => {
    try {
        const { id, commentId } = req.params; // id = post_id, commentId = comment_id
        const result = await deleteCommentDB(commentId, id);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting comment" });
    }
};

// Like a post
export const likePost = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.cookies.auth_token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const user_id = decoded.user_id;

        const result = await likePostDB(id, user_id);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || "Error liking post" });
    }
};

// Unlike a post
export const unlikePost = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.cookies.auth_token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const user_id = decoded.user_id;

        const result = await unlikePostDB(id, user_id);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || "Error unliking post" });
    }
};

// Report a post
export const reportPost = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!req.cookies.auth_token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!reason) {
            return res.status(400).json({ message: "Reason is required" });
        }

        const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        const user_id = decoded.user_id;

        const result = await reportPostDB(id, user_id, reason);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || "Error reporting post" });
    }
};

// Get thread by ID
export const getThreadById = async (req, res) => {
    try {
        const { id } = req.params;
        const thread = await getThreadByIdDB(id);
        if (!thread) {
            return res.status(404).json({ message: "Thread not found" });
        }
        res.status(200).json(thread);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching thread" });
    }
};

// Create a new thread
export const createThread = async (req, res) => {
    try {
        const { thread_name } = req.body;
        const result = await createThreadDB(thread_name);
        res.status(201).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating thread" });
    }
};

// Get thread name by ID
export const getThreadName = async (req, res) => {
    try {
        const { id } = req.params;
        const thread_name = await getThreadNameDB(id);
        if (!thread_name) {
            return res.status(404).json({ message: "Thread name not found" });
        }
        res.status(200).json(thread_name);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching thread name" });
    }
};

// Get category name by ID
export const getCategoryName = async (req, res) => {
    try {
        const { id } = req.params;
        const category_name = await getCategoryNameDB(id);
        if (!category_name) {
            return res.status(404).json({ message: "Category name not found" });
        }
        res.status(200).json(category_name);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching category name" });
    }
};

// Create a new category
export const createCategory = async (req, res) => {
    try {
        const { category_name } = req.body;
        const result = await createCategoryDB(category_name);
        res.status(201).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating category" });
    }
};

// Get all categories
export const getCategories = async (req, res) => {
    try {
        const categories = await getCategoriesDB();
        res.status(200).json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching categories" });
    }
};

// Get all threads
export const getThreads = async (req, res) => {
    try {
        const threads = await getThreadsDB();
        res.status(200).json(threads);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching threads" });
    }
};

// Get all tags
export const getTags = async (req, res) => {
    try {
        const tags = await getTagsDB();
        res.status(200).json(tags);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching tags" });
    }
};

// Get tag by ID
export const getTagById = async (req, res) => {
    try {
        const { id } = req.params;
        const tag = await getTagByIdDB(id);
        if (!tag) {
            return res.status(404).json({ message: "Tag not found" });
        }
        res.status(200).json(tag);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching tag" });
    }
};

export const updateTag = async (req, res) => {
    try {
        const { id } = req.params;
        const { tag_name } = req.body;
        const result = await updateTagDB(id, tag_name);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating tag" });
    }
}

export const getTagsofForumPost = async (req, res) => {
    try {
        const { id } = req.params; // post_id
        const tags = await getTagsofForumPostDB(id);
        res.status(200).json(tags);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching tags" });
    }
}

export const addCommentToPost = async (req, res) => {
    try {
        const { id } = req.params; // post_id
        const { content } = req.body;
        const result = await createCommentDB(id, content);
        res.status(201).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error adding comment to post" });
    }
}

export const assignTagToPost = async (req, res) => {
    try {
        const { id, tagId } = req.params; // post_id, tag_id
        const result = await assignTagToPostDB(id, tagId);
        res.status(201).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error assigning tag to post" });
    }
}

// getAllTags, getTagById, createTag, updateTagById, deleteTag,
// getTagsOfPost, assignTagToPost, removeTagFromPost,
// // Like
// likePost, unlikePost, getLikesOfPost,
// // Report
// reportPost, getReports, updateReportStatus,
// // Forum Overview
// getForumActivityByUser

export const createTag = async (req, res) => {
    try {
        const { tag_name } = req.body;
        const result = await createTagDB(tag_name);
        res.status(201).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating tag" });
    }
}

export const removeTagFromPost = async (req, res) => {
    try {
        const { id, tagId } = req.params; // post_id, tag_id
        const result = await removeTagFromPostDB(id, tagId);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error removing tag from post" });
    }
}

export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params; // category_id
        const result = await deleteCategoryDB(id);
        res.status(200).json({ message: result });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting category" });
    }
}

export const deleteCommentFromPost = async (req, res) => {
    try {
        const { id, commentId } = req.params; // id = post_id, commentId = comment_id
        const result = await deleteCommentDB(commentId, id);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting comment from post" });
    }
}

export const deleteTag = async (req, res) => {
    try {
        const { id } = req.params; // tag_id
        const result = await deleteTagDB(id);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting tag" });
    }
}
export const deleteReportFromPost = async (req, res) => {
    try {
        const { id } = req.params; // post_id
        const result = await deleteReportFromPostDB(id);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting report from post" });
    }
}

export const getReports = async (req, res) => {
    try {
        const reports = await getReportsDB();
        res.status(200).json(reports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching reports" });
    }
}

export const updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params; // report_id
        const { status } = req.body;
        const result = await updateReportStatusDB(id, status);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating report status" });
    }
}

export const getReportsByPostId = async (req, res) => {
    try {
        const { id } = req.params; // post_id
        const reports = await getReportsByPostIdDB(id);
        res.status(200).json(reports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching reports by post ID" });
    }
}

export const getForumActivityByUser = async (req, res) => {
    try {
        const { user_id } = req.params; // user_id
        const activity = await getForumActivityByUserDB(user_id);
        res.status(200).json(activity);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching forum activity by user" });
    }
}

export const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params; // category_id
        const category = await getCategoryByIdDB(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        res.status(200).json(category);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching category" });
    }
}

export const getAllCategories = async (req, res) => {
    try {
        const categories = await getAllCategoriesDB();
        res.status(200).json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching categories" });
    }
}

export const getAllThreads = async (req, res) => {
    try {
        const threads = await getAllThreadsDB();
        res.status(200).json(threads);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching threads" });
    }
}

export const getAllPosts = async (req, res) => {
    try {
        const posts = await getAllPostsDB();
        res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching posts" });
    }
}

export const getAllTags = async (req, res) => {
    try {
        const tags = await getAllTagsDB();
        res.status(200).json(tags);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching tags" });
    }
}

export const getAllPostsByUser = async (req, res) => {
    try {
        const { user_id } = req.params; // user_id
        const posts = await getAllPostsByUserDB(user_id);
        res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching posts by user" });
    }
}

export const getAllCommentsByUser = async (req, res) => {
    try {
        const { user_id } = req.params; // user_id
        const comments = await getAllCommentsByUserDB(user_id);
        res.status(200).json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching comments by user" });
    }
}

export const getAllLikesByUser = async (req, res) => {
    try {
        const { user_id } = req.params; // user_id
        const likes = await getAllLikesByUserDB(user_id);
        res.status(200).json(likes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching likes by user" });
    }
}

export const getAllReportsByUser = async (req, res) => {
    try {
        const { user_id } = req.params; // user_id
        const reports = await getAllReportsByUserDB(user_id);
        res.status(200).json(reports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching reports by user" });
    }
}

export const getAllTagsByUser = async (req, res) => {
    try {
        const { user_id } = req.params; // user_id
        const tags = await getAllTagsByUserDB(user_id);
        res.status(200).json(tags);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching tags by user" });
    }
}

export const getAllCategoriesByUser = async (req, res) => {
    try {
        const { user_id } = req.params; // user_id
        const categories = await getAllCategoriesByUserDB(user_id);
        res.status(200).json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching categories by user" });
    }
}

export const getAllThreadsByUser = async (req, res) => {
    try {
        const { user_id } = req.params; // user_id
        const threads = await getAllThreadsByUserDB(user_id);
        res.status(200).json(threads);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching threads by user" });
    }
}

export const getAllCommentsByPost = async (req, res) => {
    try {
        const { post_id } = req.params; // post_id
        const comments = await getAllCommentsByPostDB(post_id);
        res.status(200).json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching comments by post" });
    }
}

export const getAllLikesByPost = async (req, res) => {
    try {
        const { post_id } = req.params; // post_id
        const likes = await getAllLikesByPostDB(post_id);
        res.status(200).json(likes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching likes by post" });
    }
}

export const getAllReportsByPost = async (req, res) => {
    try {
        const { post_id } = req.params; // post_id
        const reports = await getAllReportsByPostDB(post_id);
        res.status(200).json(reports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching reports by post" });
    }
}

export const getAllTagsByPost = async (req, res) => {
    try {
        const { post_id } = req.params; // post_id
        const tags = await getAllTagsByPostDB(post_id);
        res.status(200).json(tags);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching tags by post" });
    }
}

export const getAllCategoriesByPost = async (req, res) => {
    try {
        const { post_id } = req.params; // post_id
        const categories = await getAllCategoriesByPostDB(post_id);
        res.status(200).json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching categories by post" });
    }
}

export const getAllThreadsByPost = async (req, res) => {
    try {
        const { post_id } = req.params; // post_id
        const threads = await getAllThreadsByPostDB(post_id);
        res.status(200).json(threads);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching threads by post" });
    }
}

export const getAllPostsByCategory = async (req, res) => {
    try {
        const { category_id } = req.params; // category_id
        const posts = await getAllPostsByCategoryDB(category_id);
        res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching posts by category" });
    }
}

export const getAllPostsByThread = async (req, res) => {
    try {
        const { thread_id } = req.params; // thread_id
        const posts = await getAllPostsByThreadDB(thread_id);
        res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching posts by thread" });
    }
}

export const getAllPostsByTag = async (req, res) => {
    try {
        const { tag_id } = req.params; // tag_id
        const posts = await getAllPostsByTagDB(tag_id);
        res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching posts by tag" });
    }
}

export const deleteThread = async (req, res) => {
    try {
        const { id } = req.params; // thread_id
        const result = await deleteThreadDB(id);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting thread" });
    }
}

export const getCommentsByPostId = async (req, res) => {
    try {
        const { id } = req.params; // post_id
        const comments = await getCommentsDB(id);
        res.status(200).json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching comments" });
    }
}

export const getLikesOfPost = async (req, res) => {
    try {
        const { id } = req.params; // post_id
        const likes = await getLikesOfPostDB(id);
        res.status(200).json(likes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching likes" });
    }
}

export const getTagsOfPost = async (req, res) => {
    try {
        const { id } = req.params; // post_id
        const tags = await getTagsOfPostDB(id);
        res.status(200).json(tags);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching tags" });
    }
}

export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params; // category_id
        const { category_name } = req.body;
        const result = await updateCategoryDB(id, category_name);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating category" });
    }
}

export const updateTagById = async (req, res) => {
    try {
        const { id } = req.params; // tag_id
        const { tag_name } = req.body;
        const result = await updateTagDB(id, tag_name);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating tag" });
    }
}

export const updateThread = async (req, res) => {
    try {
        const { id } = req.params; // thread_id
        const { thread_name } = req.body;
        const result = await updateThreadDB(id, thread_name);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating thread" });
    }
}

export const updateCommentInPost = async (req, res) => {
    try {
        const { id, commentId } = req.params; // id = post_id, commentId = comment_id
        const { content } = req.body;
        const result = await updateCommentInPostDB(commentId, id, content);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating comment in post" });
    }
}

export const getForumPostActivityUnmapByPostId = async (req, res) => {
    try {
        const { id } = req.params; // post_id
        const activity = await getForumPostActivityUnmapByPostIdDB(id);
        res.status(200).json(activity);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching forum post activity" });
    }
}

export const getForumPostActivityByPostId = async (req, res) => {
    try {
        const { id } = req.params; // post_id
        const activity = await getForumPostActivityByPostIdDB(id);
        res.status(200).json(activity);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching forum post activity" });
    }
}

export const deleteForumPostActivityByPostId = async (req, res) => {
    try {
        const { id } = req.params; // post_id
        const result = await deleteForumPostActivityByPostIdDB(id);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting forum post activity" });
    }
}

export const getForumPostActivityByUser = async (req, res) => {
    try {
        const { user_id } = req.params; // user_id
        const activity = await getForumPostActivityByUserDB(user_id);
        res.status(200).json(activity);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching forum post activity by user" });
    }
}

export const updateForumPostActivityByPostId = async (req, res) => {
    try {
        const { id } = req.params; // post_id
        const { activity } = req.body;
        const result = await updateForumPostActivityByPostIdDB(id, activity);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating forum post activity" });
    }
}



