import openai, { OPENAI_EMBEDDING_MODEL } from '../../config/openai';
import openrouter from '../../config/openrouter';

const useOpenAiEmbeddings = Boolean(process.env.OPENAI_API_KEY);

export async function generateEmbedding(text: string): Promise<number[]> {
  if (useOpenAiEmbeddings) {
    const response = await openai.embeddings.create({
      model: OPENAI_EMBEDDING_MODEL,
      input: text,
    });

    return response.data[0].embedding;
  }

  const response = await openrouter.embeddings.create({
    model: OPENAI_EMBEDDING_MODEL,
    input: text,
  });

  return response.data[0].embedding;
}
