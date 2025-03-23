/**
 * Validate and sanitize chat request
 */
exports.validateChatRequest = (req, res, next) => {
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
    req.body.message = req.body.message.substring(0, 1000);
  }
  
  // Ensure chatHistory is an array
  if (req.body.chatHistory && !Array.isArray(req.body.chatHistory)) {
    req.body.chatHistory = [];
  }
  
  // Sanitize chat history
  if (req.body.chatHistory) {
    req.body.chatHistory = req.body.chatHistory.filter(msg => 
      msg && typeof msg === 'object' && 
      typeof msg.content === 'string' &&
      typeof msg.isUser === 'boolean'
    );
  }
  
  next();
};

/**
 * Add response time to API responses
 */
exports.responseTime = (req, res, next) => {
  const start = Date.now();
  
  // Record end time on response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`Response time for ${req.method} ${req.originalUrl}: ${duration}ms`);
  });
  
  next();
};
