import { Router } from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './auth';
import recipesRouter from './recipes';

const apiRouter = Router();

// Register middleware
apiRouter.use(cookieParser());

// Register routers
apiRouter.use(authRouter);
apiRouter.use(recipesRouter);

export default apiRouter;
