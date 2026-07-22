import { PROMPT_INJECTION_REFUSAL } from '../constants/chat.constants';

const PROMPT_INJECTION_PATTERNS = [
  // System prompt / instructions
  /system\s*prompt/i,
  /your\s*instructions/i,
  /hidden\s*instructions/i,
  /write\s*(me\s*)?(the\s*)?system\s*prompt/i,
  /provide\s*(me\s*)?(the\s*)?(system\s*)?prompt/i,
  /repeat\s*(your|the)\s*(rules|prompt|instructions)/i,
  /show\s*(me\s*)?(your|the)\s*(prompt|instructions|system)/i,
  /reveal\s*(your|the)\s*(prompt|instructions|rules)/i,
  /output\s*(your|the)\s*prompt/i,
  /what\s*are\s*you\s*programmed/i,
  /system\s*persona/i,
  /(prompt|instructions|persona|rules).{0,40}as\s*it\s*is/i,
  /as\s*it\s*is.{0,40}(prompt|instructions|persona|tools)/i,

  // Tools / capabilities / meta AI questions
  /list\s*(me\s*)?(all\s*)?(the\s*)?tools/i,
  /what\s*(are\s*)?(all\s*)?(your\s*)?tools/i,
  /tell\s*me\s*about\s*(all\s*)?(the\s*)?tools/i,
  /what\s*can\s*you\s*access/i,
  /backend\s*access/i,
  /internal\s*(tools|rules|instructions|config)/i,
  /how\s*do\s*you\s*work\s*internally/i,
  /what\s*model\s*are\s*you/i,
  /are\s*you\s*(an?\s*)?(ai|llm|chatgpt|gemma|gpt)/i,

  // Jailbreak / override attempts
  /developer\s*mode/i,
  /debug\s*mode/i,
  /ignore\s*(all|previous|prior)\s*instructions/i,
  /forget\s*(all|your)\s*instructions/i,
  /bypass\s*(your|the)\s*rules/i,
  /act\s*as\s*(a\s*)?different/i,
  /pretend\s*(you\s*are|to\s*be)/i,
  /jailbreak/i,
  /do\s*anything\s*now/i,
];

export const isPromptInjectionAttempt = (message: string): boolean => {
  const normalized = message.trim();

  if (!normalized) {
    return false;
  }

  return PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(normalized));
};

export const getPromptInjectionRefusal = (): string => PROMPT_INJECTION_REFUSAL;
