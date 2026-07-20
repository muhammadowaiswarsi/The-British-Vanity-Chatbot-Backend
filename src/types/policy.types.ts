export type PolicyTopic = 'refund' | 'shipping' | 'returns' | 'warranty' | 'privacy' | 'faq';

export interface PolicySection {
  heading?: string;
  body: string[];
  bullets?: string[];
}

export interface PolicyDoc {
  title: string;
  subtitle?: string;
  lastUpdated: string;
  sections: PolicySection[];
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface PolicyPromptEntry {
  title: string;
  content: string;
}

export interface PolicyListItem {
  label: string;
  href: string;
  topic: PolicyTopic;
}
