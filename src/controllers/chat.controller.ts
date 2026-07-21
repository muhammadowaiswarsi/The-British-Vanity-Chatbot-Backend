import { Request, Response } from 'express';
import { getChatReply } from '../services/chat/chat.service';
import { getConversationHistory } from '../services/conversation.service';
import { AiServiceError } from '../services/ai/ai.service';

const CHAT_ERROR_MESSAGE = "Sorry, I'm unable to respond at the moment. Please try again later.";

export const getChatHistory = async (req: Request, res: Response): Promise<void> => {
  const sessionId = String(req.query.sessionId ?? '').trim();

  if (!sessionId) {
    res.status(400).json({
      success: false,
      message: 'sessionId is required.',
    });
    return;
  }

  if (sessionId.length > 128) {
    res.status(400).json({
      success: false,
      message: 'sessionId must be 128 characters or fewer.',
    });
    return;
  }

  try {
    const messages = await getConversationHistory(sessionId);

    res.json({
      success: true,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
        ...(message.image ? { image: message.image } : {}),
      })),
    });
  } catch (error) {
    console.error(
      'Chat history fetch failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );

    res.status(503).json({
      success: false,
      message: 'Unable to load chat history right now.',
    });
  }
};

export const sendChatMessage = async (req: Request, res: Response): Promise<void> => {
  const sessionId = String(req.body?.sessionId ?? '').trim();
  const message = String(req.body?.message ?? '').trim();
  const file = req.file;

  if (!sessionId) {
    res.status(400).json({
      success: false,
      message: 'sessionId is required.',
    });
    return;
  }

  if (sessionId.length > 128) {
    res.status(400).json({
      success: false,
      message: 'sessionId must be 128 characters or fewer.',
    });
    return;
  }

  if (!message && !file) {
    res.status(400).json({
      success: false,
      message: 'Message or image is required.',
    });
    return;
  }

  if (message.length > 1000) {
    res.status(400).json({
      success: false,
      message: 'Message must be 1000 characters or fewer.',
    });
    return;
  }

  try {
    const response = await getChatReply({
      sessionId,
      message,
      image: file
        ? {
            buffer: file.buffer,
            mimeType: file.mimetype,
          }
        : undefined,
    });

    res.json(response);
  } catch (error) {
    if (error instanceof AiServiceError) {
      res.status(503).json({
        success: false,
        message: CHAT_ERROR_MESSAGE,
      });
      return;
    }

    console.error('Unexpected chat error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(503).json({
      success: false,
      message: CHAT_ERROR_MESSAGE,
    });
  }
};
