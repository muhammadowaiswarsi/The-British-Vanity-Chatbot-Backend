import {
  generateAssistantReply,
  generatePolicyAssistantReply,
  generateProductAssistantReply,
  generateProductAssistantReplyWithImage,
  generateVisionAssistantReply,
} from '../ai/ai.service';
import {
  hasPolicyFaqContext,
  retrievePolicyFaqContext,
} from '../policies/policy-rag.service';
import { isPolicyRelatedQuery } from '../policies/policy.service';
import {
  isProductRelatedQuery,
  searchProductsForChat,
} from '../products/product.service';
import type { ChatResponseBody, ChatServiceInput } from '../../types/chat.types';

const DEFAULT_SUGGESTIONS = [
  'Show New Arrivals',
  'Best Sellers',
  'Track My Order',
  'Refund Policy',
  'Shipping Information',
];

const PRODUCT_SUGGESTIONS = [
  'Show New Arrivals',
  'Best Sellers',
  'Recommend Skincare',
  'Products under $100',
];

const POLICY_SUGGESTIONS = [
  'FAQ',
  'Refund Policy',
  'Shipping Information',
  'Return Policy',
  'Privacy Policy',
];

const NO_PRODUCTS_REPLY = "Sorry, I couldn't find any matching products.";
const NO_POLICY_REPLY =
  "I don't have access to that policy information right now. Please contact customer support or check our website.";
const IMAGE_ONLY_DEFAULT_MESSAGE = 'Please help me with this image.';

const matchesAny = (text: string, keywords: string[]) =>
  keywords.some((keyword) => text.includes(keyword));

const getSuggestions = (
  message: string,
  isProductQuery: boolean,
  isPolicyQuery: boolean
): string[] => {
  if (isProductQuery) {
    return PRODUCT_SUGGESTIONS;
  }

  if (isPolicyQuery) {
    return POLICY_SUGGESTIONS;
  }

  const normalized = message.trim().toLowerCase();

  if (matchesAny(normalized, ['order', 'track', 'tracking'])) {
    return ['Track My Order', 'Shipping Information', 'Refund Policy'];
  }

  if (matchesAny(normalized, ['refund', 'return', 'exchange'])) {
    return ['Shipping Information', 'Track My Order', 'Show New Arrivals'];
  }

  if (matchesAny(normalized, ['shipping', 'delivery', 'ship'])) {
    return ['Track My Order', 'Refund Policy', 'Best Sellers'];
  }

  return DEFAULT_SUGGESTIONS;
};

const handleProductQuery = async (
  message: string,
  image?: ChatServiceInput['image']
): Promise<ChatResponseBody> => {
  const products = await searchProductsForChat(message);

  if (!products.length) {
    return {
      success: true,
      reply: NO_PRODUCTS_REPLY,
      suggestions: PRODUCT_SUGGESTIONS,
      products: [],
    };
  }

  const reply = image
    ? await generateProductAssistantReplyWithImage(
        message,
        products,
        image.buffer,
        image.mimeType
      )
    : await generateProductAssistantReply(message, products);

  return {
    success: true,
    reply,
    suggestions: PRODUCT_SUGGESTIONS,
    products,
  };
};

const handleImageQuery = async (
  message: string,
  image: NonNullable<ChatServiceInput['image']>
): Promise<ChatResponseBody> => {
  const reply = await generateVisionAssistantReply(message, image.buffer, image.mimeType);

  return {
    success: true,
    reply,
    suggestions: getSuggestions(message, false, false),
  };
};

const handlePolicyQuery = async (message: string): Promise<ChatResponseBody> => {
  try {
    const context = await retrievePolicyFaqContext(message);

    if (!hasPolicyFaqContext(context)) {
      return {
        success: true,
        reply: NO_POLICY_REPLY,
        suggestions: POLICY_SUGGESTIONS,
      };
    }

    const reply = await generatePolicyAssistantReply(
      message,
      context.policyChunks,
      context.faqChunks
    );

    return {
      success: true,
      reply,
      suggestions: POLICY_SUGGESTIONS,
    };
  } catch (error) {
    console.error(
      'Policy query failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );

    return {
      success: true,
      reply: NO_POLICY_REPLY,
      suggestions: POLICY_SUGGESTIONS,
    };
  }
};

export const getChatReply = async ({ message, image }: ChatServiceInput): Promise<ChatResponseBody> => {
  const effectiveMessage = message.trim() || IMAGE_ONLY_DEFAULT_MESSAGE;
  const isProductQuery = isProductRelatedQuery(effectiveMessage);
  const isPolicyQuery = isPolicyRelatedQuery(effectiveMessage);

  if (image && isProductQuery) {
    return handleProductQuery(effectiveMessage, image);
  }

  if (image) {
    return handleImageQuery(effectiveMessage, image);
  }

  if (isProductQuery) {
    return handleProductQuery(effectiveMessage);
  }

  if (isPolicyQuery) {
    return handlePolicyQuery(effectiveMessage);
  }

  const reply = await generateAssistantReply(effectiveMessage);

  return {
    success: true,
    reply,
    suggestions: getSuggestions(effectiveMessage, false, false),
  };
};
