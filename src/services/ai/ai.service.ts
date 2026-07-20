import type OpenAI from 'openai';
import openrouter, { OPENROUTER_CHAT_MODEL, OPENROUTER_VISION_MODEL } from '../../config/openrouter';
import type { ChatProduct } from '../../types/chat.types';
import type { FaqPayload, PolicyChunkPayload } from '../../types/policy-index.types';
import { formatProductsForPrompt } from '../products/product.service';
import {
  formatFaqChunksForPrompt,
  formatPolicyChunksForPrompt,
} from '../policies/policy-rag.service';

const GENERAL_SYSTEM_PROMPT = `You are The British Vanity AI Shopping Assistant.

You are friendly, concise and professional.

Help customers with:
- Product recommendations
- Shopping advice
- Fashion suggestions
- Store information
- Shipping questions
- Refund policy
- General assistance

If you don't know something, politely say you don't have enough information instead of making it up.

Keep responses short and customer-friendly.`;

const PRODUCT_SYSTEM_PROMPT = `You are The British Vanity AI Shopping Assistant.

Recommend only the products provided in the prompt.
Never invent products, prices, or availability.
Keep responses short, warm, and helpful.`;

const POLICY_SYSTEM_PROMPT = `You are The British Vanity AI Shopping Assistant.

Answer the customer's question using ONLY the official store policy information provided.
Never invent or guess policy details.
If the provided policies do not contain enough information to answer, politely say you do not have enough information and suggest contacting customer support.
Keep responses short, warm, and helpful.`;

const VISION_SYSTEM_PROMPT = `You are The British Vanity AI Shopping Assistant.

You can see the image the customer shared.
Describe what you observe accurately and help with shopping-related questions.
If you cannot determine something from the image, say so politely.
Keep responses short and customer-friendly.`;

export class AiServiceError extends Error {
  constructor(message = 'Failed to generate AI response') {
    super(message);
    this.name = 'AiServiceError';
  }
}

const toImageDataUrl = (buffer: Buffer, mimeType: string): string => {
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
};

const createVisionUserContent = (
  text: string,
  imageBuffer: Buffer,
  mimeType: string
): OpenAI.Chat.Completions.ChatCompletionContentPart[] => [
  { type: 'text', text },
  {
    type: 'image_url',
    image_url: { url: toImageDataUrl(imageBuffer, mimeType) },
  },
];

export const generateAssistantReply = async (message: string): Promise<string> => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new AiServiceError('OpenRouter API key is not configured');
  }

  try {
    const completion = await openrouter.chat.completions.create({
      model: OPENROUTER_CHAT_MODEL,
      temperature: 0.7,
      max_tokens: 400,
      messages: [
        { role: 'system', content: GENERAL_SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
    });

    const reply = completion.choices[0]?.message?.content?.trim();

    if (!reply) {
      throw new AiServiceError('OpenRouter returned an empty response');
    }

    return reply;
  } catch (error) {
    if (error instanceof AiServiceError) {
      throw error;
    }

    console.error('OpenRouter chat completion failed:', error instanceof Error ? error.message : 'Unknown error');
    throw new AiServiceError();
  }
};

export const generateVisionAssistantReply = async (
  message: string,
  imageBuffer: Buffer,
  mimeType: string
): Promise<string> => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new AiServiceError('OpenRouter API key is not configured');
  }

  try {
    const completion = await openrouter.chat.completions.create({
      model: OPENROUTER_VISION_MODEL,
      temperature: 0.5,
      max_tokens: 500,
      messages: [
        { role: 'system', content: VISION_SYSTEM_PROMPT },
        {
          role: 'user',
          content: createVisionUserContent(message, imageBuffer, mimeType),
        },
      ],
    });

    const reply = completion.choices[0]?.message?.content?.trim();

    if (!reply) {
      throw new AiServiceError('OpenRouter returned an empty response');
    }

    return reply;
  } catch (error) {
    if (error instanceof AiServiceError) {
      throw error;
    }

    console.error('OpenRouter vision completion failed:', error instanceof Error ? error.message : 'Unknown error');
    throw new AiServiceError();
  }
};

export const generatePolicyAssistantReply = async (
  message: string,
  policyChunks: PolicyChunkPayload[],
  faqChunks: FaqPayload[]
): Promise<string> => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new AiServiceError('OpenRouter API key is not configured');
  }

  const policyContext = formatPolicyChunksForPrompt(
    policyChunks.map((payload) => ({ score: 0, payload }))
  );
  const faqContext = formatFaqChunksForPrompt(
    faqChunks.map((payload) => ({ score: 0, payload }))
  );

  const prompt = `Customer Question:
${message}

Relevant Policy Chunks:
${policyContext}

Relevant FAQ Chunks:
${faqContext}

Instructions:
- Answer ONLY using the provided context.
- Never invent policy information.
- If the answer is not contained in the context, politely say you couldn't find that information.
- Keep replies concise and customer friendly.`;

  try {
    const completion = await openrouter.chat.completions.create({
      model: OPENROUTER_CHAT_MODEL,
      temperature: 0.3,
      max_tokens: 400,
      messages: [
        { role: 'system', content: POLICY_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    });

    const reply = completion.choices[0]?.message?.content?.trim();

    if (!reply) {
      throw new AiServiceError('OpenRouter returned an empty response');
    }

    return reply;
  } catch (error) {
    if (error instanceof AiServiceError) {
      throw error;
    }

    console.error('OpenRouter policy chat completion failed:', error instanceof Error ? error.message : 'Unknown error');
    throw new AiServiceError();
  }
};

export const generateProductAssistantReply = async (
  message: string,
  products: ChatProduct[]
): Promise<string> => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new AiServiceError('OpenRouter API key is not configured');
  }

  const productList = formatProductsForPrompt(products);

  const prompt = `The customer asked:

${message}

Here are the products found in our database:

${productList}

Recommend only these products.
Never invent products.
If no matching products are found, politely tell the customer.`;

  try {
    const completion = await openrouter.chat.completions.create({
      model: OPENROUTER_CHAT_MODEL,
      temperature: 0.5,
      max_tokens: 500,
      messages: [
        { role: 'system', content: PRODUCT_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    });

    const reply = completion.choices[0]?.message?.content?.trim();

    if (!reply) {
      throw new AiServiceError('OpenRouter returned an empty response');
    }

    return reply;
  } catch (error) {
    if (error instanceof AiServiceError) {
      throw error;
    }

    console.error('OpenRouter product chat completion failed:', error instanceof Error ? error.message : 'Unknown error');
    throw new AiServiceError();
  }
};

export const generateProductAssistantReplyWithImage = async (
  message: string,
  products: ChatProduct[],
  imageBuffer: Buffer,
  mimeType: string
): Promise<string> => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new AiServiceError('OpenRouter API key is not configured');
  }

  const productList = formatProductsForPrompt(products);

  const prompt = `The customer asked:

${message}

Here are the products found in our database:

${productList}

Use the attached image for additional context.
Recommend only these products.
Never invent products.
If no matching products are found, politely tell the customer.`;

  try {
    const completion = await openrouter.chat.completions.create({
      model: OPENROUTER_VISION_MODEL,
      temperature: 0.5,
      max_tokens: 500,
      messages: [
        { role: 'system', content: PRODUCT_SYSTEM_PROMPT },
        {
          role: 'user',
          content: createVisionUserContent(prompt, imageBuffer, mimeType),
        },
      ],
    });

    const reply = completion.choices[0]?.message?.content?.trim();

    if (!reply) {
      throw new AiServiceError('OpenRouter returned an empty response');
    }

    return reply;
  } catch (error) {
    if (error instanceof AiServiceError) {
      throw error;
    }

    console.error('OpenRouter product vision completion failed:', error instanceof Error ? error.message : 'Unknown error');
    throw new AiServiceError();
  }
};
