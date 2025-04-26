import ollama from 'ollama';
import dotenv from 'dotenv';

dotenv.config();

export const handleStreamingChat = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required' 
      });
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Format the conversation history for the AI model
    const formattedHistory = history ? history.map(msg => ({
      role: msg.role,
      content: msg.content
    })) : [];

    // Add the current message
    formattedHistory.push({
      role: 'user',
      content: message
    });

    // Stream response from Ollama
    const stream = await ollama.chat({
      model: process.env.AI_MODEL_NAME || 'AMH_chatbot',
      messages: formattedHistory,
      stream: true
    });

    // Process the stream
    for await (const part of stream) {
      if (part.message?.content) {
        res.write(part.message.content);
      }
    }
    
    res.end();
  } catch (error) {
    console.error('Streaming chat API error:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: 'Failed to process streaming chat request'
      });
    } else {
      res.write('\n\nSorry, an error occurred while generating the response.');
      res.end();
    }
  }
};
