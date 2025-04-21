import { requestAPI } from "../api/request";

const BASE_URL = "http://localhost:5000/api";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function sendChatMessage(message: string, history: Message[]) {
  try {
    const response = await requestAPI(BASE_URL, "/chat", "POST", {
      message,
      history
    });

    return {
      success: true,
      data: response.data,
      status: response.status
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to send message",
      status: error.response?.status || 500
    };
  }
}
