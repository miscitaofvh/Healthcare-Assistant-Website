import { requestAPI } from "../api/request";

const BASE_URL = "http://localhost:5000/api";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

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
