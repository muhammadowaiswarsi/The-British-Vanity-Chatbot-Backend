import OpenAI from 'openai';

const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
  console.warn('OPENAI_API_KEY is not set. OpenAI embeddings may fail until configured.');
}

const openai = new OpenAI({
  apiKey: apiKey || 'missing-api-key',
});

export const OPENAI_CHAT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
export const OPENAI_EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

export default openai;
