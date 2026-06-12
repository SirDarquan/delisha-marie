import '@dm/backend-shared/load-env';
import cookieParser from 'cookie-parser';
import { Router } from 'express';
import recipeIndexRouter from './recipe-index';

const apiRouter = Router();

// Register middleware
apiRouter.use(cookieParser());

// Register routers
apiRouter.use('/api', recipeIndexRouter);

export default apiRouter;
