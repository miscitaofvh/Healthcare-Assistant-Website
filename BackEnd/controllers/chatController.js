const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Google Generative AI with API key
let genAI;
(async () => {
	genAI = await new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
})();

// Predefine model configuration to avoid repetitive instantiation
const modelConfig = {
	model: "gemini-2.0-flash",
	systemInstruction: "You are a helpful healthcare assistant. Provide accurate, concise information about health topics. For medical emergencies, advise seeking professional help. Do not diagnose or prescribe medication. Respond in no more than 500 tokens",
	generationConfig: {
		maxOutputTokens: 500,
		temperature: 0.2,
		topP: 0.95,
		topK: 40,
	},
	safetySettings: [
		{
			category: "HARM_CATEGORY_HARASSMENT",
			threshold: "BLOCK_MEDIUM_AND_ABOVE"
		},
		{
			category: "HARM_CATEGORY_HATE_SPEECH",
			threshold: "BLOCK_MEDIUM_AND_ABOVE"
		},
		{
			category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
			threshold: "BLOCK_MEDIUM_AND_ABOVE"
		},
		{
			category: "HARM_CATEGORY_DANGEROUS_CONTENT",
			threshold: "BLOCK_MEDIUM_AND_ABOVE"
		}
	]
};

// Controller methods
exports.sendMessage = async (req, res) => {
  // Lưu lại các biến cần dùng trong khối catch ngay từ đầu
  const { userId = null, message = '', chatHistory = [], timestamp = new Date().toISOString() } = req.body;

  try {
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a string'
      });
    }

    // if (!userId) {
    //  return res.status(400).json({
    //    success: false,
    //    error: 'User ID is required'
    //  });
    // }

    // Limit chat history to prevent exceeding token limits
    // const trimmedChatHistory = chatHistory.slice(-3);
    const trimmedChatHistory = chatHistory; // For now, we are not limiting the history because of testing

    // Initialize the model 
    const model = genAI.getGenerativeModel(modelConfig);
    
	// Start a chat session with formatted history
	const chat = model.startChat({
	  history: trimmedChatHistory.map(msg => ({
		role: msg.role,
		parts: [{ text: msg.content }]
	  }))
	});

    // Add timeout to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 15000)
    );

    // Send the message to the chat model
    const result = await Promise.race([
      chat.sendMessage(message.trim()),
      timeoutPromise
    ]);

    const botResponse = result.response.text();

    return res.status(200).json({
      success: true,
      userId,
      messageData: {
        role: 'model',
        content: botResponse,
        timestamp: new Date().toISOString()
      }
      // userMessageData: {
      //  role: 'User',
      //  content: message.trim(),
      //  timestamp: timestamp
      // }
    });

  } catch (error) {
    console.error(`Chat error for userId: ${userId || 'unknown'}, message: ${message || 'unknown'}`, error);

    // More specific error messages based on error type
    let errorMessage = 'An error occurred while processing your request';
    let statusCode = 500;

    if (error.message === 'Request timeout') {
      errorMessage = 'The request took too long to process. Please try again with a shorter message.';
      statusCode = 408;
    } else if (error.message?.includes('safety settings')) {
      errorMessage = 'Your message was flagged by our content filters. Please rephrase your question.';
      statusCode = 400;
    } else if (error.message?.includes('quota')) {
      errorMessage = 'API usage limit exceeded. Please try again later.';
      statusCode = 429;
    } else if (error.message?.includes('First content should be')) {
      errorMessage = 'Invalid chat format. Please try again.';
      statusCode = 400;
    } else if (error.message?.includes('not found')) {
      errorMessage = 'The AI model is currently unavailable. Please try again later.';
      statusCode = 503;
    }

    return res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
};

// Get chat history with pagination support
exports.getChatHistory = async (req, res) => {
	// not implemented yet
	return res.status(501).json({
		success: false,
		error: "Not implemented yet"
	});
};

// Add a new endpoint for checking API health
exports.checkHealth = async (_, res) => {
	try {
		// Simple prompt to check if API is responsive
		const model = genAI.getGenerativeModel(modelConfig);
		await model.generateContent("Hello");

		return res.status(200).json({
			success: true,
			status: "healthy",
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error(`API health check failed at ${new Date().toISOString()}:`, error);
		return res.status(503).json({
			success: false,
			status: "unhealthy",
			error: error.message,
			timestamp: new Date().toISOString()
		});
	}
};
