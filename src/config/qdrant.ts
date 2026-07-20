import { QdrantClient } from '@qdrant/js-client-rest';

export const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION || 'products';
export const POLICIES_COLLECTION = process.env.QDRANT_POLICIES_COLLECTION || 'policies';
export const FAQS_COLLECTION = process.env.QDRANT_FAQS_COLLECTION || 'faqs';
export const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
export const EMBEDDING_VECTOR_SIZE = 1536;

export const qdrant = new QdrantClient({
  url: QDRANT_URL,
  checkCompatibility: false,
});
