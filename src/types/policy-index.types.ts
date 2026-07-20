export interface MainBackendPolicyResponse {
  title: string;
  content: string;
}

export interface MainBackendFaqItem {
  question: string;
  answer: string;
}

export interface MainBackendFaqsResponse {
  title: string;
  items: MainBackendFaqItem[];
}

export type PolicyDocumentKey = 'privacy' | 'refund' | 'shipping' | 'returns' | 'warranty';

export interface PolicyChunkPayload {
  type: PolicyDocumentKey;
  title: string;
  section: string;
  content: string;
}

export interface FaqPayload {
  question: string;
  answer: string;
}

export interface IndexPoliciesResult {
  success: true;
  policiesIndexed: number;
  faqsIndexed: number;
}

export interface PolicySearchResult {
  score: number;
  payload: PolicyChunkPayload;
}

export interface FaqSearchResult {
  score: number;
  payload: FaqPayload;
}

export interface CreateCollectionsResult {
  success: true;
  collections: string[];
}
