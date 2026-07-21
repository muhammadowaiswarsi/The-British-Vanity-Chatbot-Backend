import type OpenAI from 'openai';
import {
  Conversation,
  type IConversation,
  type IConversationMessage,
} from '../models/Conversation.model';

const DEFAULT_HISTORY_LIMIT = 20;

export const getOrCreateConversation = async (sessionId: string): Promise<IConversation> => {
  const existing = await Conversation.findOne({ sessionId });

  if (existing) {
    return existing;
  }

  const conversation = await Conversation.create({
    sessionId,
    messages: [],
  });

  console.log('[Conversation] Session created:', sessionId);

  return conversation;
};

export const addUserMessage = async (
  sessionId: string,
  content: string,
  image?: string
): Promise<void> => {
  await getOrCreateConversation(sessionId);

  await Conversation.updateOne(
    { sessionId },
    {
      $push: {
        messages: {
          role: 'user',
          content,
          ...(image ? { image } : {}),
          createdAt: new Date(),
        },
      },
    }
  );

  console.log('[Conversation] User message saved:', sessionId);
};

export const addAssistantMessage = async (sessionId: string, content: string): Promise<void> => {
  await getOrCreateConversation(sessionId);

  await Conversation.updateOne(
    { sessionId },
    {
      $push: {
        messages: {
          role: 'assistant',
          content,
          createdAt: new Date(),
        },
      },
    }
  );

  console.log('[Conversation] Assistant message saved:', sessionId);
};

export const getRecentMessages = async (
  sessionId: string,
  limit = DEFAULT_HISTORY_LIMIT
): Promise<IConversationMessage[]> => {
  const conversation = await Conversation.findOne({ sessionId }).lean();

  if (!conversation?.messages?.length) {
    console.log('[Conversation] Messages loaded:', sessionId, 0);
    return [];
  }

  const recentMessages = conversation.messages.slice(-limit);

  console.log('[Conversation] Messages loaded:', sessionId, recentMessages.length);

  return recentMessages;
};

export const getConversationHistory = async (
  sessionId: string
): Promise<IConversationMessage[]> => {
  const conversation = await Conversation.findOne({ sessionId }).lean();

  if (!conversation?.messages?.length) {
    console.log('[Conversation] Full history loaded:', sessionId, 0);
    return [];
  }

  console.log('[Conversation] Full history loaded:', sessionId, conversation.messages.length);

  return conversation.messages;
};

export const toOpenRouterHistory = (
  messages: IConversationMessage[]
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] =>
  messages.map((message) => ({
    role: message.role,
    content: message.image ? `${message.content}\n[User shared an image]` : message.content,
  }));
