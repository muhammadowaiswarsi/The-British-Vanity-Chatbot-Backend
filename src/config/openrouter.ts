import OpenAI from 'openai';

const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
  console.warn('OPENROUTER_API_KEY is not set. Chatbot AI responses will fail until configured.');
}

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: apiKey || 'missing-api-key',
  defaultHeaders: {
    'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
    'X-Title': 'The British Vanity Chatbot',
  },
});

export const OPENROUTER_CHAT_MODEL =
  process.env.OPENROUTER_MODEL || 'google/gemma-4-26b-a4b-it:free';

export const OPENROUTER_VISION_MODEL =
  process.env.OPENROUTER_VISION_MODEL || 'google/gemma-4-26b-a4b-it:free';

export default openrouter;
