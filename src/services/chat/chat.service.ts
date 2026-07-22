import type OpenAI from 'openai';
import {
  generateAssistantReply,
  generatePolicyAssistantReply,
  generateProductAssistantReply,
  generateProductAssistantReplyWithImage,
  generateVisionAssistantReply,
} from '../ai/ai.service';
import {
  addAssistantMessage,
  addUserMessage,
  getRecentMessages,
  toOpenRouterHistory,
} from '../conversation.service';
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
import { PROMPT_INJECTION_REFUSAL } from '../../constants/chat.constants';
import { isPromptInjectionAttempt } from '../../utils/promptGuard';

type ConversationHistory = OpenAI.Chat.Completions.ChatCompletionMessageParam[];

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
const HISTORY_LIMIT = 20;

const matchesAny = (text: string, keywords: string[]) =>
  keywords.some((keyword) => text.includes(keyword));

const toImageDataUrl = (buffer: Buffer, mimeType: string): string =>
  `data:${mimeType};base64,${buffer.toString('base64')}`;

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
  history: ConversationHistory,
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
        image.mimeType,
        history
      )
    : await generateProductAssistantReply(message, products, history);

  return {
    success: true,
    reply,
    suggestions: PRODUCT_SUGGESTIONS,
    products,
  };
};

const handleImageQuery = async (
  message: string,
  history: ConversationHistory,
  image: NonNullable<ChatServiceInput['image']>
): Promise<ChatResponseBody> => {
  const reply = await generateVisionAssistantReply(
    message,
    image.buffer,
    image.mimeType,
    history
  );

  return {
    success: true,
    reply,
    suggestions: getSuggestions(message, false, false),
  };
};

const handlePolicyQuery = async (
  message: string,
  history: ConversationHistory
): Promise<ChatResponseBody> => {
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
      context.faqChunks,
      history
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

export const getChatReply = async ({
  sessionId,
  message,
  image,
}: ChatServiceInput): Promise<ChatResponseBody> => {
  const effectiveMessage = message.trim() || IMAGE_ONLY_DEFAULT_MESSAGE;
  const isProductQuery = isProductRelatedQuery(effectiveMessage);
  const isPolicyQuery = isPolicyRelatedQuery(effectiveMessage);

  const recentMessages = await getRecentMessages(sessionId, HISTORY_LIMIT);
  const history = toOpenRouterHistory(recentMessages);

  const storedImage = image ? toImageDataUrl(image.buffer, image.mimeType) : undefined;
  await addUserMessage(sessionId, effectiveMessage, storedImage);

  if (isPromptInjectionAttempt(effectiveMessage)) {
    await addAssistantMessage(sessionId, PROMPT_INJECTION_REFUSAL);

    return {
      success: true,
      reply: PROMPT_INJECTION_REFUSAL,
      suggestions: getSuggestions(effectiveMessage, false, false),
    };
  }

  let response: ChatResponseBody;

  if (image && isProductQuery) {
    response = await handleProductQuery(effectiveMessage, history, image);
  } else if (image) {
    response = await handleImageQuery(effectiveMessage, history, image);
  } else if (isProductQuery) {
    response = await handleProductQuery(effectiveMessage, history);
  } else if (isPolicyQuery) {
    response = await handlePolicyQuery(effectiveMessage, history);
  } else {
    const reply = await generateAssistantReply(effectiveMessage, history);

    response = {
      success: true,
      reply,
      suggestions: getSuggestions(effectiveMessage, false, false),
    };
  }

  await addAssistantMessage(sessionId, response.reply);

  return response;
};
