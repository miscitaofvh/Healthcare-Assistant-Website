export const paginate = (defaultLimit = 20, maxLimit = 100) => {
    return (req, res, next) => {
        // Get page and limit from query params
        const page = parseInt(req.query.page) || 1
        let limit = parseInt(req.query.limit) || defaultLimit

        // Ensure limit isn't too high
        limit = Math.min(limit, maxLimit)

        // Calculate offset for database queries
        const offset = (page - 1) * limit

        // Attach to request object
        req.pagination = { page, limit, offset }

        next()
    }
}
/*
import { paginate } from '../middleware/paginate'

// Basic usage
router.get('/comments', paginate(), getComments)

// With custom defaults
router.get('/posts', paginate(10, 50), getPosts) // Default 10 per page, max 50

export const getComments = async (req, res) => {
  try {
    const { page, limit, offset } = req.pagination
    
    const { comments, total } = await CommentService.getAll({
      limit,
      offset
    })
    
    res.json({
      data: comments,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    // error handling
  }
}
*/