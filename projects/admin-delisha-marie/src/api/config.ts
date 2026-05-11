import { Router, Request, Response } from 'express';
import { loadEnvFile } from 'node:process';

// Load variables from .env into process.env
loadEnvFile('projects/admin-delisha-marie/src/.env');

const configRouter = Router();

export interface AppConfig {
  SocialClients: {
    GoogleClientId?: string;
    AmazonClientId?: string;
    FacebookClientId?: string;
    VKClientId?: string;
    MicrosoftClientId?: string;
  };
}

const appConfig: AppConfig = {
  SocialClients: {
    GoogleClientId: process.env['GOOGLE_CLIENT_ID'],
  },
};

configRouter.get('/config', (req: Request, res: Response) => {
  res.json(appConfig);
});

export default configRouter;
