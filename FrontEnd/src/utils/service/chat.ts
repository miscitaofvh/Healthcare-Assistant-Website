import API from '../api/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SaveChatRequest {
  messages: Message[];
  title: string;
}

const BASE_URL = "http://localhost:5000/api";

export async function streamChatMessage(
  message: string, 
  history: Message[], 
  onChunk: (chunk: string) => void,
  onComplete: (fullResponse: string) => void
) {
  try {
    const response = await fetch(`${BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history
      })
    });

    if (!response.body) {
      throw new Error('ReadableStream not supported in this browser.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        onComplete(fullResponse);
        break;
      }
      
      const chunk = decoder.decode(value, { stream: true });
      fullResponse += chunk;
      onChunk(chunk);
    }

    return {
      success: true,
      data: fullResponse
    };
  } catch (error: any) {
    console.error('Streaming error:', error);
    onComplete(error.message || 'Failed to stream response');
    
    return {
      success: false,
      message: error.message || "Failed to stream response"
    };
  }
}

// Function to save the current chat history to the database
export const saveChatHistory = async (messages: Message[], title: string) => {
  try {
    const request: SaveChatRequest = { messages, title };
    const response = await API.post('/chat/save', request);
    return response.data;
  } catch (error) {
    console.error('Error saving chat history:', error);
    throw error;
  }
};

// Function to get the user's chat history
export const getChatHistory = async () => {
  try {
    const response = await API.get('/chat/history');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
};

// Function to delete a specific chat from history
export const deleteChat = async (chatId: string) => {
  try {
    const response = await API.delete(`/chat/${chatId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting chat history:', error);
    throw error;
  }
};

// Function to update conversation title
export const updateConversationTitle = async (chatId: string, title: string) => {
  try {
    const response = await API.put(`/chat/${chatId}/title`, { title });
    return response.data;
  } catch (error) {
    console.error('Error updating chat title:', error);
    throw error;
  }
};
