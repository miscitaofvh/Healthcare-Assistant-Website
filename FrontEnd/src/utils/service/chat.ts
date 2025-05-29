import API from '../api/api';
import { getApiUrl } from '../../config/env';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SaveChatRequest {
  messages: Message[];
  title: string;
}

const BASE_URL = getApiUrl('/chat');

export async function streamChatMessage(
  message: string, 
  history: Message[],
  conversationId: string | null = null,
  onChunk: (chunk: string) => void,
  onComplete: (fullResponse: string, newConversationId?: string) => void
) {
  try {
    const response = await fetch(`${BASE_URL}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'credentials': 'include'
      },
      body: JSON.stringify({
        message,
        history,
        conversationId
      }),
      credentials: 'include'
    });

    if (!response.body) {
      throw new Error('ReadableStream not supported in this browser.');
    }

    // Check for a new conversation ID in the response headers
    const headerConversationId = response.headers.get('X-Conversation-Id');
    let newConversationId = headerConversationId;
    
    if (headerConversationId) {
      console.log('New conversation ID from header:', headerConversationId);
    }
    else {
      console.log('No conversation ID received from header.');
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const text = decoder.decode(value);
      
      // Process all text chunks directly - no special handling needed for conversation ID
      onChunk(text);
      fullResponse += text;
    }

    // If we have a conversation ID from the header, pass it to the completion handler
    onComplete(fullResponse, newConversationId || undefined);
  } catch (error: any) {
    console.error('Error in streamChatMessage:', error);
    throw error;
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

// Function to get a specific chat by ID
export const getChatById = async (chatId: string) => {
  try {
    const response = await API.get(`/chat/${chatId}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching chat details for ID ${chatId}:`, error);
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
