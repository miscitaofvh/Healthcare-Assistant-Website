export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatConversation {
  conversation_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatDetailData {
  conversation_id: string;
  title: string;  
  messages: Array<Message & { timestamp: string }>;
  createdAt?: string;  
  updatedAt?: string;
}

export interface SaveChatRequest {
  messages: Message[];
  title: string;
}