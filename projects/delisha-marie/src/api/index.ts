import '@dm/backend-shared/load-env';
import cookieParser from 'cookie-parser';
import express, { Router } from 'express';
import recipeIndexRouter from './recipe-index';
import recipesRouter from './recipes';

const apiRouter = Router();

// Register middleware
apiRouter.use(cookieParser());
apiRouter.use(express.json());

// Register routers
apiRouter.use('/api', recipeIndexRouter);
apiRouter.use('/api', recipesRouter);

export default apiRouter;
