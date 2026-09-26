import type { Request, Response } from 'express';

import { logger as winstonLogger } from '../utils/logger.js';
import { DEFAULT_LLM_MODEL, getChatModels } from '../utils/models.js';

export const getModels = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const models = await getChatModels();
    res.status(200).json({
      success: true,
      data: { models, defaultModel: DEFAULT_LLM_MODEL },
      error: null,
    });
  } catch (err) {
    winstonLogger.error('Failed to load models from Nebius', {
      message: err instanceof Error ? err.message : String(err),
    });
    res.status(502).json({
      success: false,
      data: null,
      error: { message: 'Failed to load available models' },
    });
  }
};
