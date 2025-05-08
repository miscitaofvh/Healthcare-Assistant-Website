import jwt from 'jsonwebtoken';
import connection from "../config/connection.js";

// Base authentication middleware
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

// Optional authentication middleware
export const decodeTokenIfExists = (req, res, next) => {
    const token = req.cookies.auth_token;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch (error) {
            console.log('Invalid token, continuing as unauthenticated user');
        }
    }
    next();
};

// Main authentication functions
export const auth = {
    // Required authentication
    required: async (req, res, next) => {
        try {
            const token = req.cookies.auth_token;
            if (!token) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const [rows] = await connection.execute(
                'SELECT user_id, username, email, role FROM users WHERE user_id = ?',
                [decoded.user_id]
            );

            if (rows.length === 0) {
                return res.status(401).json({ success: false, error: 'User not found' });
            }

            req.user = rows[0];
            next();
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                return res.status(403).json({ success: false, message: "Invalid token" });
            }
            console.error('Authentication error:', error);
            return res.status(500).json({ success: false, error: 'Authentication failed' });
        }
    },

    // Role-based middlewares
    requireRole: (role) => {
        return async (req, res, next) => {
            try {
                await auth.required(req, res, () => {});
                
                if (req.user.role === role || req.user.role === 'Admin') {
                    return next();
                }
                
                return res.status(403).json({ 
                    success: false, 
                    error: `${role} access required` 
                });
            } catch (error) {
                next(error);
            }
        };
    },

    requireModerator: async (req, res, next) => {
        await auth.required(req, res, () => {});
        
        if (req.user.role === 'Moderator' || req.user.role === 'Admin') {
            return next();
        }

        return res.status(403).json({ 
            success: false, 
            error: 'Moderator access required' 
        });
    },

    requireAdmin: async (req, res, next) => {
        await auth.required(req, res, () => {});
        
        if (req.user.role === 'Admin') {
            return next();
        }
        
        return res.status(403).json({ 
            success: false, 
            error: 'Admin access required' 
        });
    },

    requireDoctor: async (req, res, next) => {
        try {
            await auth.required(req, res, () => {});
            
            if (req.user.role === 'Doctor' || req.user.role === 'Admin') {
                const [doctor] = await connection.execute(
                    'SELECT doctor_id FROM doctors WHERE user_id = ?',
                    [req.user.user_id]
                );

                if (doctor.length > 0 || req.user.role === 'Admin') {
                    req.doctor = doctor[0];
                    return next();
                }
                
                return res.status(403).json({ 
                    success: false, 
                    error: 'Doctor profile not found' 
                });
            }
            
            return res.status(403).json({ 
                success: false, 
                error: 'Doctor access required' 
            });
        } catch (error) {
            console.error('Doctor verification error:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to verify doctor status' 
            });
        }
    },

    // Ownership check middleware
    requireOwnerOrAdmin: (resourceType) => {
        return async (req, res, next) => {
            try {
                await auth.required(req, res, () => {});
                
                if (req.user.role === 'Admin') {
                    return next();
                }

                const resourceId = req.params[`${resourceType}Id`] || req.params.id;
                let isOwner = false;

                switch(resourceType.toLowerCase()) {
                    case 'article':
                        const [article] = await connection.execute(
                            'SELECT author_id FROM articles WHERE article_id = ?',
                            [resourceId]
                        );
                        isOwner = article[0]?.author_id === req.user.user_id;
                        break;

                    case 'post':
                        const [post] = await connection.execute(
                            'SELECT user_id FROM forum_posts WHERE post_id = ?',
                            [resourceId]
                        );
                        isOwner = post[0]?.user_id === req.user.user_id;
                        break;

                    case 'comment':
                        const [comment] = await connection.execute(
                            `SELECT user_id FROM (
                                SELECT user_id FROM article_comments WHERE comment_id = ?
                                UNION
                                SELECT user_id FROM forum_comments WHERE comment_id = ?
                            ) AS combined`,
                            [resourceId, resourceId]
                        );
                        isOwner = comment[0]?.user_id === req.user.user_id;
                        break;

                    default:
                        return res.status(400).json({ 
                            success: false, 
                            error: 'Unsupported resource type' 
                        });
                }

                if (isOwner) {
                    return next();
                }
                
                return res.status(403).json({ 
                    success: false, 
                    error: 'You do not have permission to modify this resource' 
                });
            } catch (error) {
                console.error('Ownership verification error:', error);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Failed to verify resource ownership' 
                });
            }
        };
    },

    // Optional authentication
    optional: async (req, res, next) => {
        const token = req.cookies.auth_token;

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const [user] = await connection.execute(
                    'SELECT user_id, username, email, role FROM users WHERE user_id = ?',
                    [decoded.user_id]
                );

                if (user.length > 0) {
                    req.user = user[0];
                }
            } catch (error) {
                console.log('Optional auth failed, continuing:', error.message);
            }
        }
        next();
    }
};

// Helper function to get current user
export const getCurrentUser = (req) => {
    return req.user;
};

export default auth;