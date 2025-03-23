import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/chat';

export type MessageRole = 'user' | 'doctor' | 'model';

export interface ChatMessage {
  text: string;
  role: MessageRole;
  timestamp?: string;
}

export interface ChatHistoryItem {
  role: MessageRole;
  content: string;
}

export interface ChatResponse {
  success: boolean;
  messageData: {
    content: string;
    role: MessageRole;
    timestamp: string;
  };
  error?: string;
}

/**
 * Formats the chat history for sending to the API
 * @param messages - The array of chat messages
 * @returns Formatted chat history for API
 */
export const formatChatHistory = (messages: ChatMessage[]): ChatHistoryItem[] => {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.text,
  }));
};

/**
 * Sends a message to the chat API
 * @param message - The user message to send
 * @param userId - The user identifier
 * @param history - Array of previous chat messages
 * @returns Promise with the API response
 */
export const sendMessage = async (
  message: string,
  userId: string = 'user123',
  messages: ChatMessage[]
): Promise<ChatResponse> => {
  try {
    // Format chat history for the backend API
    const chatHistory = formatChatHistory(messages.slice(1)); // Exclude the initial welcome message

    // Make API call to backend
    const response = await axios.post(`${API_BASE_URL}/send`, {
      userId,
      message: message.trim(),
      chatHistory,
      timestamp: new Date().toISOString()
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error fetching AI response:', error);
    
    let errorMessage = 'Failed to get response from AI. Please try again later.';

    // Extract more specific error message if available
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};
