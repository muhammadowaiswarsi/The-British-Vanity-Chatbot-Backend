import { PROMPT_INJECTION_REFUSAL } from '../constants/chat.constants';

const PROMPT_INJECTION_PATTERNS = [
  /system\s*prompt/i,
  /your\s*instructions/i,
  /hidden\s*instructions/i,
  /developer\s*mode/i,
  /ignore\s*(all|previous|prior)\s*instructions/i,
  /repeat\s*(your|the)\s*(rules|prompt|instructions)/i,
  /show\s*(me\s*)?(your|the)\s*(prompt|instructions|system)/i,
  /what\s*are\s*you\s*programmed/i,
  /output\s*(your|the)\s*prompt/i,
  /reveal\s*(your|the)\s*(prompt|instructions)/i,
];

export const isPromptInjectionAttempt = (message: string): boolean =>
  PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(message));

export const getPromptInjectionRefusal = (): string => PROMPT_INJECTION_REFUSAL;
