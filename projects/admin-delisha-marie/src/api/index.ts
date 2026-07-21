import '@dm/backend-shared/load-env';

import cookieParser from 'cookie-parser';
import express, { Router } from 'express';
import { join } from 'node:path';
import authRouter from './auth';
import recipesRouter from './recipes';
import uploadRouter from './upload';
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

export default apiRouter;
