import '@dm/backend-shared/load-env';
import cookieParser from 'cookie-parser';
import express, { Router } from 'express';
import recipeIndexRouter from './recipe-index';
import recipesRouter from './recipes';
import pagesRouter from './pages';
import searchRouter from './search';
import contactsRouter from './contacts';

const apiRouter = Router();

// Register middleware ONLY for API routes to avoid consuming the body of Angular SSR requests
apiRouter.use('/api', cookieParser());
apiRouter.use('/api', express.json());

// Register routers
apiRouter.use('/api', recipeIndexRouter);
apiRouter.use('/api', recipesRouter);
apiRouter.use('/api', pagesRouter);
apiRouter.use('/api', searchRouter);
apiRouter.use('/api', contactsRouter);

export default apiRouter;
