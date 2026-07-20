import type {
  FaqPayload,
  FaqSearchResult,
  PolicyChunkPayload,
  PolicySearchResult,
} from '../../types/policy-index.types';
import { searchFaqs, searchPolicies } from '../policy-index.service';

export { searchPolicies, searchFaqs };

export const formatPolicyChunksForPrompt = (results: PolicySearchResult[]): string => {
  if (!results.length) {
    return 'No relevant policy information found.';
  }

  return results
    .map(({ payload }, index) => {
      return `${index + 1}. ${payload.title} (${payload.type}) — ${payload.section}
${payload.content}`;
    })
    .join('\n\n');
};

export const formatFaqChunksForPrompt = (results: FaqSearchResult[]): string => {
  if (!results.length) {
    return 'No relevant FAQ information found.';
  }

  return results
    .map(({ payload }, index) => `${index + 1}. Q: ${payload.question}\nA: ${payload.answer}`)
    .join('\n\n');
};

export interface PolicyFaqContext {
  policyChunks: PolicyChunkPayload[];
  faqChunks: FaqPayload[];
}

export const retrievePolicyFaqContext = async (query: string): Promise<PolicyFaqContext> => {
  try {
    const [policyResults, faqResults] = await Promise.all([
      searchPolicies(query),
      searchFaqs(query),
    ]);

    return {
      policyChunks: policyResults.map((result) => result.payload),
      faqChunks: faqResults.map((result) => result.payload),
    };
  } catch (error) {
    console.error(
      'Qdrant policy/FAQ search failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    throw error;
  }
};

export const hasPolicyFaqContext = (context: PolicyFaqContext): boolean =>
  context.policyChunks.length > 0 || context.faqChunks.length > 0;
