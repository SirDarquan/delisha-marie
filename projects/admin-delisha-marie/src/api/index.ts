import { Router } from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './auth';
import recipesRouter from './recipes';
import { loadCascadingEnvs, getSourceDir } from './env-utils';

// Dynamically resolve and execute cascaded loading
loadCascadingEnvs(process.cwd(), getSourceDir('/api'));

const apiRouter = Router();

// Register middleware
apiRouter.use(cookieParser());

// Register routers
apiRouter.use('/api', authRouter);
apiRouter.use('/api', recipesRouter);

export default apiRouter;
