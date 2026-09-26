// Fetch the chat models available on Nebius Token Factory and validate model IDs sent by the client
import { getCacheValue, setCacheValue } from '../middleware/cache.js';
import { getClient } from './openai-client.js';

// Used when the client doesn't send a model, and as the preferred default in the UI
export const DEFAULT_LLM_MODEL = 'Qwen/Qwen3-30B-A3B-Instruct-2507';

const MODELS_CACHE_KEY = 'nebius-chat-models';
const MODELS_TTL_MS = 10 * 60 * 1000;

export type ChatModel = {
  id: string;
  name: string;
};

// Fields we read from GET /models?verbose=true; everything else is ignored
type NebiusModel = {
  id?: unknown;
  name?: unknown;
  architecture?: { modality?: unknown };
};

// An error that carries the HTTP status the controller should respond with
export class ModelError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
  }
}

// Keep only models that produce text (e.g. "text->text", "text+image->text"),
// which drops embedding models that can't answer chat requests
const toChatModel = (model: NebiusModel): ChatModel | null => {
  if (typeof model.id !== 'string' || !model.id) return null;

  const modality = model.architecture?.modality;
  if (typeof modality === 'string' && !modality.endsWith('->text')) return null;

  const name =
    typeof model.name === 'string' && model.name
      ? model.name
      : model.id.split('/').pop()!;

  return { id: model.id, name };
};

export const getChatModels = async (): Promise<ChatModel[]> => {
  const cached = getCacheValue(MODELS_CACHE_KEY) as ChatModel[] | null;
  if (cached) return cached;

  const response = await getClient().get<{ data?: unknown }>('/models', {
    query: { verbose: true },
  });

  if (!Array.isArray(response.data)) {
    throw new Error('Unexpected response from Nebius /models');
  }

  const models = (response.data as NebiusModel[])
    .map(toChatModel)
    .filter((m): m is ChatModel => m !== null)
    .sort((a, b) => a.id.localeCompare(b.id));

  setCacheValue(MODELS_CACHE_KEY, models, MODELS_TTL_MS);
  return models;
};

// Return a model ID that is safe to send to Nebius, or throw a ModelError
export const resolveModel = async (requested: unknown): Promise<string> => {
  if (requested === undefined || requested === null || requested === '') {
    return DEFAULT_LLM_MODEL;
  }

  if (typeof requested !== 'string') {
    throw new ModelError('model must be a string', 400);
  }

  let models: ChatModel[];
  try {
    models = await getChatModels();
  } catch {
    // Without the list we can't validate other IDs, but the default is known to be ours
    if (requested === DEFAULT_LLM_MODEL) return requested;
    throw new ModelError('Model list is unavailable, please try again later', 503);
  }

  if (!models.some((m) => m.id === requested)) {
    throw new ModelError(`Model "${requested}" is not available`, 400);
  }

  return requested;
};
