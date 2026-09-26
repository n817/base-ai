import { Router } from 'express';

import { auth } from '../middleware/auth.js';
import { getModels } from '../controllers/models.js';

const modelsRouter = Router();

modelsRouter.use(auth);

modelsRouter.get('/', getModels);

export { modelsRouter };
