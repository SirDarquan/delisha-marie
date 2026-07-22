import { Request, Response, Router } from 'express';

const configRouter = Router();

export interface AppConfig {
  SocialClients: {
    GoogleClientId?: string;
    AmazonClientId?: string;
    FacebookClientId?: string;
    VKClientId?: string;
    MicrosoftClientId?: string;
  };
  DescopeProjectId: string;
  ImageKitUrlEndpoint: string;
}

const appConfig: AppConfig = {
  SocialClients: {
    GoogleClientId: process.env['GOOGLE_CLIENT_ID'],
  },
  DescopeProjectId: process.env['DESCOPE_PROJECT_ID'] || '',
  ImageKitUrlEndpoint: process.env['IMAGEKIT_URL_ENDPOINT'] || '',
};

configRouter.get('/config', (req: Request, res: Response) => {
  res.json(appConfig);
});

export default configRouter;
