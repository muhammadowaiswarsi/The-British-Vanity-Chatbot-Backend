export interface ChatRequestBody {
  message: string;
}

export interface ChatImageInput {
  buffer: Buffer;
  mimeType: string;
}

export interface ChatServiceInput {
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
