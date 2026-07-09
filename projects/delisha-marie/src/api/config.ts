import { Request, Response, Router } from 'express';

const configRouter = Router();

export interface AppConfig {
  GoogleTagManager: {
    id?: string;
  };
}

const appConfig: AppConfig = {
  GoogleTagManager: {
    id: process.env['GTM_ID'],
  },
};

configRouter.get('/config', (req: Request, res: Response) => {
  res.json(appConfig);
});

export default configRouter;
