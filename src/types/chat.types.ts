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

/** Structured product data for frontend product cards (from MongoDB, not LLM). */
export interface ProductCard {
  id: string;
  title: string;
  slug: string;
  price: number;
  brand: string;
  image: string;
  category: string;
  inStock: boolean;
}

export const toProductCards = (products: ChatProduct[]): ProductCard[] =>
  products.map((product) => ({
    id: product.id,
    title: product.name,
    slug: product.slug,
    price: product.price,
    brand: product.brand,
    image: product.image,
    category: product.category,
    inStock: product.inStock,
  }));

export interface ChatSuccessResponse {
  success: true;
  reply: string;
  suggestions: string[];
  products: ProductCard[];
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
