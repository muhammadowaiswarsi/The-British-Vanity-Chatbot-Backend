import { generateEmbedding } from './embeddings/embedding.service';
import {
  clearCollectionPoints,
  ensureAllCollections,
  FAQS_COLLECTION,
  POLICIES_COLLECTION,
  qdrant,
} from './qdrant/qdrant.service';
import type {
  FaqPayload,
  IndexPoliciesResult,
  MainBackendFaqsResponse,
  MainBackendPolicyResponse,
  PolicyChunkPayload,
  PolicyDocumentKey,
  PolicySearchResult,
  FaqSearchResult,
} from '../types/policy-index.types';
import { chunkText } from '../utils/chunkText';
import { mainBackendApi } from '../utils/mainBackendClient';

const POLICY_CHUNK_SIZE = 500;
const POLICY_CHUNK_OVERLAP = 100;

const POLICY_ENDPOINTS: Array<{ key: PolicyDocumentKey; path: string; label: string }> = [
  { key: 'privacy', path: '/privacy', label: 'Privacy' },
  { key: 'refund', path: '/refund', label: 'Refund' },
  { key: 'shipping', path: '/shipping', label: 'Shipping' },
  { key: 'returns', path: '/returns', label: 'Returns' },
  { key: 'warranty', path: '/warranty', label: 'Warranty' },
];

interface ParsedPolicySection {
  section: string;
  text: string;
}

const fetchPolicy = async (path: string): Promise<MainBackendPolicyResponse> => {
  const response = await mainBackendApi.get<MainBackendPolicyResponse>(path);
  return response.data;
};

const fetchFaqs = async (): Promise<MainBackendFaqsResponse> => {
  const response = await mainBackendApi.get<MainBackendFaqsResponse>('/faqs');
  return response.data;
};

const parsePolicySections = (content: string): ParsedPolicySection[] => {
  const blocks = content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const sections: ParsedPolicySection[] = [];

  for (const block of blocks) {
    if (block.startsWith('Last updated:')) {
      continue;
    }

    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);

    if (lines.length <= 1) {
      sections.push({ section: 'Overview', text: block });
      continue;
    }

    const heading = lines[0];
    const body = lines.slice(1).join('\n').trim();
    const looksLikeHeading = body.length > 0 && heading.length <= 80 && !heading.endsWith('.');

    if (looksLikeHeading) {
      sections.push({ section: heading, text: body });
    } else {
      sections.push({ section: 'Overview', text: block });
    }
  }

  return sections.length ? sections : [{ section: 'Overview', text: content.trim() }];
};

const buildPolicyEmbeddingText = (
  title: string,
  section: string,
  content: string
): string => `Title: ${title}\nSection: ${section}\nContent: ${content}`;

const buildFaqEmbeddingText = (question: string, answer: string): string =>
  `Question: ${question}\nAnswer: ${answer}`;

export const indexPolicies = async (): Promise<IndexPoliciesResult> => {
  await ensureAllCollections();
  await clearCollectionPoints(POLICIES_COLLECTION);
  await clearCollectionPoints(FAQS_COLLECTION);

  let policyPointId = 1;
  let faqPointId = 1;
  let policiesIndexed = 0;
  let faqsIndexed = 0;

  for (const { key, path, label } of POLICY_ENDPOINTS) {
    const policy = await fetchPolicy(path);
    const sections = parsePolicySections(policy.content);

    for (const { section, text } of sections) {
      const chunks = chunkText(text, POLICY_CHUNK_SIZE, POLICY_CHUNK_OVERLAP);

      for (const content of chunks) {
        const embedding = await generateEmbedding(
          buildPolicyEmbeddingText(policy.title, section, content)
        );

        const payload: PolicyChunkPayload = {
          type: key,
          title: policy.title,
          section,
          content,
        };

        await qdrant.upsert(POLICIES_COLLECTION, {
          wait: true,
          points: [
            {
              id: policyPointId++,
              vector: embedding,
              payload: payload as unknown as Record<string, unknown>,
            },
          ],
        });

        policiesIndexed += 1;
      }
    }

    console.log(`✓ ${label} indexed`);
  }

  const faqs = await fetchFaqs();

  for (const item of faqs.items) {
    const embedding = await generateEmbedding(
      buildFaqEmbeddingText(item.question, item.answer)
    );

    const payload: FaqPayload = {
      question: item.question,
      answer: item.answer,
    };

    await qdrant.upsert(FAQS_COLLECTION, {
      wait: true,
      points: [
        {
          id: faqPointId++,
          vector: embedding,
          payload: payload as unknown as Record<string, unknown>,
        },
      ],
    });

    faqsIndexed += 1;
  }

  console.log('✓ FAQs indexed');
  console.log('✓ Indexing completed');

  return {
    success: true,
    policiesIndexed,
    faqsIndexed,
  };
};

export const searchPolicies = async (
  query: string,
  limit = 5
): Promise<PolicySearchResult[]> => {
  const embedding = await generateEmbedding(query);

  const results = await qdrant.query(POLICIES_COLLECTION, {
    query: embedding,
    limit,
    with_payload: true,
  });

  console.log("🔍 Searching Policies Vector DB...");
  console.log(results.points);
  console.log('🔍 Results:', results);

  return (results.points ?? []).map((point: { score?: number; payload?: unknown }) => ({
    score: point.score ?? 0,
    payload: point.payload as PolicyChunkPayload,
  }));
};

export const searchFaqs = async (
  query: string,
  limit = 5
): Promise<FaqSearchResult[]> => {
  const embedding = await generateEmbedding(query);

  const results = await qdrant.query(FAQS_COLLECTION, {
    query: embedding,
    limit,
    with_payload: true,
  });

  return (results.points ?? []).map((point: { score?: number; payload?: unknown }) => ({
    score: point.score ?? 0,
    payload: point.payload as FaqPayload,
  }));
};

/** @deprecated Use searchPolicies instead */
export const searchPolicyChunks = searchPolicies;

export const previewPrivacyPolicyChunks = async (): Promise<string[]> => {
  const policy = await fetchPolicy('/privacy');
  const sections = parsePolicySections(policy.content);
  return sections.flatMap(({ text }) => chunkText(text, POLICY_CHUNK_SIZE, POLICY_CHUNK_OVERLAP));
};
