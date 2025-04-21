/**
 * Validate and sanitize chat request
 */
export const validateChatRequest = (req, res, next) => {
    // Validate message exists and is not empty
    if (!req.body.message || req.body.message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and cannot be empty'
      });
    }
  
    // Sanitize message - remove excessive whitespace
    req.body.message = req.body.message.trim();
    
    // Limit message length
    if (req.body.message.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Message exceeds maximum length of 1000 characters'
      });
    }
    
    // Ensure history is an array
    if (req.body.history && !Array.isArray(req.body.history)) {
      req.body.history = [];
    }
    
    // Sanitize chat history
    if (req.body.history) {
      req.body.history = req.body.history.filter(msg => 
        msg && typeof msg === 'object' && 
        typeof msg.content === 'string' &&
        typeof msg.role === 'string'
      );
    }
    
    next();
};