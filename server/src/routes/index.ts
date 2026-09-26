import { Router } from 'express';
import { authRouter } from './auth.js';
import { usersRouter } from './users.js'
import { chatsRouter } from './chats.js';
import { documentsRouter } from './documents.js';
import { queryRouter } from './query.js';
import { modelsRouter } from './models.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/chats', chatsRouter);
router.use('/documents', documentsRouter);
router.use('/query', queryRouter);
router.use('/models', modelsRouter);

export default router;