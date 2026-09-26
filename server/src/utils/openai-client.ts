// Set up the shared Nebius client
import OpenAI from 'openai';

let client: OpenAI;

export const getClient = (): OpenAI => {
  if (!client) {
    client = new OpenAI({
      baseURL: 'https://api.tokenfactory.nebius.com/v1/',
      apiKey: process.env.NEBIUS_API_KEY!,
    });
  }
  return client;
};

// Gather chunks together to pass them to the LLM model when querying it
export const buildContext = (chunks: { text: string }[]): string => {
  if (chunks.length === 0) return 'No relevant context found.';
  return chunks.map((chunk, i) => `Chunk ${i + 1}: ${chunk.text}`).join('\n\n');
};

// Strip model reasoning from responses
export const stripThinking = (text: string): string =>
  text.replace(/<think>[\s\S]*?<\/think>\s*/g, '').trim();