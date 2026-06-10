import '@dm/backend-shared/load-env';

import { Router } from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './auth';
import recipesRouter from './recipes';

const apiRouter = Router();

// Register middleware
apiRouter.use(cookieParser());

// Register routers
apiRouter.use('/api', authRouter);
apiRouter.use('/api', recipesRouter);

export default apiRouter;
