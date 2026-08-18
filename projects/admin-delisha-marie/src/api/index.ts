import '@dm/backend-shared/load-env';

import cookieParser from 'cookie-parser';
import express, { Router } from 'express';
import { join } from 'node:path';
import authRouter from './auth';
import recipesRouter from './recipes';
import uploadRouter from './upload';
import commentsRouter from './comments';
import { pagesRouter } from './pages';
import contactsRouter from './contacts';
const apiRouter = Router();

// Register middleware
apiRouter.use(cookieParser());

// Serve dynamically generated images directly
const imagesDir = join(process.cwd(), 'images');
apiRouter.use('/images', express.static(imagesDir, { maxAge: '1y' }));

// Register routers
apiRouter.use('/api', authRouter);
apiRouter.use('/api', recipesRouter);
apiRouter.use('/api', uploadRouter);
apiRouter.use('/api', commentsRouter);
apiRouter.use('/api', pagesRouter);
apiRouter.use('/api', contactsRouter);

export default apiRouter;
