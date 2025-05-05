import jwt from 'jsonwebtoken';

export const authenticateUser = (req, res, next) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: "Token invalid" });
    }
};

// Middleware to decode token if it exists, but doesn't require authentication
export const decodeTokenIfExists = (req, res, next) => {
    const token = req.cookies.auth_token;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch (error) {
            // Ignore token errors, user will be treated as not logged in
            console.log('Invalid token, continuing as unauthenticated user');
        }
    }

    next();
};

// authMiddleware.js

/**
 * Authentication and authorization middleware for forum routes
 */

// Mock user data - in a real app, this would come from a database or session
const mockUsers = {
    'user1': { id: 'user1', role: 'user', username: 'regular_user' },
    'user2': { id: 'user2', role: 'user', username: 'another_user' },
    'mod1': { id: 'mod1', role: 'moderator', username: 'forum_mod' },
    'admin1': { id: 'admin1', role: 'admin', username: 'site_admin' }
};

// Mock comments data for ownership checks
const mockComments = {
    'comment1': { id: 'comment1', authorId: 'user1', content: 'Sample comment' },
    'comment2': { id: 'comment2', authorId: 'user2', content: 'Another comment' }
};

export const auth = {
    // Basic required authentication
    required: (req, res, next) => {
        // In a real app, this would check session/JWT/etc.
        const userId = req.headers['x-user-id']; // Simplified for example

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const user = mockUsers[userId];
        if (!user) {
            return res.status(401).json({ error: 'Invalid user' });
        }

        req.user = user; // Attach user to request
        next();
    },

    // Require moderator or admin role
    requireModerator: (req, res, next) => {
        auth.required(req, res, () => {
            if (req.user.role === 'moderator' || req.user.role === 'admin') {
                return next();
            }
            res.status(403).json({ error: 'Moderator access required' });
        });
    },

    // Require admin role
    requireAdmin: (req, res, next) => {
        auth.required(req, res, () => {
            if (req.user.role === 'admin') {
                return next();
            }
            res.status(403).json({ error: 'Admin access required' });
        });
    },

    // Require ownership of the resource or admin role
    requireOwnerOrAdmin: (resourceType) => {
        return (req, res, next) => {
            auth.required(req, res, () => {
                // In a real app, you'd fetch the resource from DB
                let resource;

                if (resourceType === 'comment') {
                    resource = mockComments[req.params.commentId];
                }
                // Add other resource types as needed

                if (!resource) {
                    return res.status(404).json({ error: 'Resource not found' });
                }

                if (req.user.role === 'admin' || resource.authorId === req.user.id) {
                    return next();
                }

                res.status(403).json({ error: 'You do not have permission to modify this resource' });
            });
        };
    },

    // Optional authentication (attaches user if available)
    optional: (req, res, next) => {
        const userId = req.headers['x-user-id'];

        if (userId) {
            const user = mockUsers[userId];
            if (user) {
                req.user = user;
            }
        }

        next();
    }
};

// Helper function to get the current user (for use in routes)
export const getCurrentUser = (req) => {
    return req.user;
};

// Export the auth object as default
export default auth;

