import type { Request, Response } from 'express';

import Document from '../models/document.js';
import Chat from '../models/chat.js';
import Chunk from '../models/chunk.js';
import Message from '../models/message.js';

import { createEmbedding } from '../utils/embeddings.js';
import {
  buildContext,
  getClient,
  stripThinking,
} from '../utils/openai-client.js';
import { ModelError, resolveModel } from '../utils/models.js';
import { rankBySimilarity } from '../utils/vector-search.js';

export const createMessage = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { question } = req.body;
  const chatId = req.params.id;
  const userId = req.user!.userId;

  if (!question) {
    res.status(400).json({
      success: false,
      data: null,
      error: { message: 'question is required' },
    });
    return;
  }

  const chat = await Chat.findOne({ _id: chatId, userId });
  if (!chat) {
    res.status(404).json({
      success: false,
      data: null,
      error: { message: 'Chat not found' },
    });
    return;
  }

  let model: string;
  try {
    model = await resolveModel(req.body.model);
  } catch (err) {
    if (err instanceof ModelError) {
      res.status(err.statusCode).json({
        success: false,
        data: null,
        error: { message: err.message },
      });
      return;
    }
    throw err;
  }

  const userDocs = await Document.find({ userId }, '_id');
  const docIds = userDocs.map((d) => d._id);
  const chunkRecords = await Chunk.find({ documentId: { $in: docIds } });

  const chunks = chunkRecords.map((c) => ({
    id: String(c._id),
    documentId: String(c.documentId),
    text: c.text,
    embedding: c.embedding,
  }));

  const queryEmbedding = await createEmbedding(question);
  const ranked = rankBySimilarity(queryEmbedding, chunks, 5);
  const context = buildContext(ranked);

  const response = await getClient().chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful research assistant. Answer the question using only the provided context. If the context does not contain enough information to answer, say so.',
      },
      {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion:\n${question}`,
      },
    ],
    temperature: 0.2,
  });

  // const answer = response.choices[0]!.message.content ?? 'No answer returned.';
  const answer =
    stripThinking(response.choices[0]!.message.content ?? '') ||
    'No answer returned.';

  const userMessage = await Message.create({
    chatId: chat._id,
    role: 'user',
    content: question,
  });
  const assistantMessage = await Message.create({
    chatId: chat._id,
    role: 'assistant',
    content: answer,
  });

  res.status(201).json({
    success: true,
    data: [userMessage, assistantMessage],
    error: null,
  });
};
