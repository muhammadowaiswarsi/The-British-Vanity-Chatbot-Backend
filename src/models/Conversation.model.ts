import { Schema, model, Document } from 'mongoose';

export type ConversationRole = 'user' | 'assistant';

export interface IConversationMessage {
  role: ConversationRole;
  content: string;
  image?: string;
  createdAt: Date;
}

export interface IConversation extends Document {
  sessionId: string;
  messages: IConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const conversationMessageSchema = new Schema<IConversationMessage>(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const conversationSchema = new Schema<IConversation>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    messages: {
      type: [conversationMessageSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export const Conversation = model<IConversation>('Conversation', conversationSchema);
