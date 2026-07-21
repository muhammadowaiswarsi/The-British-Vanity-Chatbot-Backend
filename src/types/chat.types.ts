export interface ChatRequestBody {
  sessionId: string;
  message: string;
}

export interface ChatImageInput {
  buffer: Buffer;
  mimeType: string;
}

export interface ChatServiceInput {
  sessionId: string;
  message: string;
  image?: ChatImageInput;
}

export interface ChatProduct {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  price: number;
  discountPrice?: number;
  image: string;
  shortDescription: string;
  inStock: boolean;
}

export interface ChatSuccessResponse {
  success: true;
  reply: string;
  suggestions: string[];
  products?: ChatProduct[];
}

export interface ChatErrorResponse {
  success: false;
  message: string;
}

export type ChatResponseBody = ChatSuccessResponse;

export interface ChatHistoryMessageResponse {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

export interface ChatHistorySuccessResponse {
  success: true;
  messages: ChatHistoryMessageResponse[];
}
