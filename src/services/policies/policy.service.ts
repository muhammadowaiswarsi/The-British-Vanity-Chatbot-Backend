const POLICY_KEYWORDS = [
  'refund',
  'refund policy',
  'money back',
  'return',
  'return policy',
  'returns',
  'exchange',
  'shipping',
  'shipping policy',
  'delivery',
  'ship',
  'dispatch',
  'warranty',
  'warranty policy',
  'guarantee',
  'privacy',
  'privacy policy',
  'personal data',
  'data protection',
  'cookies',
  'gdpr',
  'faq',
  'frequently asked',
  'common questions',
  'help centre',
  'help center',
  'policy',
  'policies',
];

const matchesAny = (text: string, keywords: string[]): boolean =>
  keywords.some((keyword) => text.includes(keyword));

export const isPolicyRelatedQuery = (message: string): boolean => {
  const normalized = message.trim().toLowerCase();
  return matchesAny(normalized, POLICY_KEYWORDS);
};
