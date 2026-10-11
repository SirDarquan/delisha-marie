import type { VercelRequest, VercelResponse } from '@vercel/node';
import llmsHandler from '../projects/serverless/src/api/llms';

export default function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  req.query = { ...req.query, full: 'true' };
  return llmsHandler(req, res);
}
