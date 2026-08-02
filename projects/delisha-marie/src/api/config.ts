import { Request, Response, Router } from 'express';

const configRouter = Router();

export interface AppConfig {
  GoogleTagManager: {
    id?: string;
  };
  Sentry?: {
    dsn: string;
    tracesSampleRate: number;
    tracePropagationTargets: string[];
    replaySessionSampleRate?: number;
    replaysOnErrorSampleRate?: number;
    environment?: string;
    release?: string;
    debug?: boolean;
  };
}

const appConfig: AppConfig = {
  GoogleTagManager: {
    id: process.env['GTM_ID'],
  },
  Sentry: {
    dsn: process.env['SENTRY_DSN']!,
    tracesSampleRate: Number.parseFloat(process.env['SENTRY_TRACES_SAMPLE_RATE'] ?? '0.1'),
    tracePropagationTargets: process.env['SENTRY_TRACE_PROPAGATION_TARGETS']?.split(',') ?? [
      'localhost:4200',
    ],
    replaySessionSampleRate: Number.parseFloat(
      process.env['SENTRY_REPLAY_SESSION_SAMPLE_RATE'] ?? '0.1',
    ),
    replaysOnErrorSampleRate: Number.parseFloat(
      process.env['SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE'] ?? '1.0',
    ),
    environment: process.env['SENTRY_ENVIRONMENT'],
    release: process.env['SENTRY_RELEASE'],
    debug: process.env['SENTRY_DEBUG'] === 'true',
  },
};

configRouter.get('/config', (req: Request, res: Response) => {
  res.json(appConfig);
});

export default configRouter;
