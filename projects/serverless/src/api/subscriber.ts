import type { VercelRequest, VercelResponse } from '@vercel/node';

type ProviderHandler = (
  req: VercelRequest,
  res: VercelResponse,
  email: string,
  trigger_automation: boolean,
) => Promise<VercelResponse>;

const providerRouter: Record<string, ProviderHandler> = {
  sender: async (req, res, email, trigger_automation) => {
    const token = process.env.SENDER_API_TOKEN;
    if (!token) {
      console.error('Missing SENDER_API_TOKEN');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const url = `https://api.sender.net/v2/subscribers`;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    const body = {
      email,
      trigger_automation,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Sender API Error:', response.status, errorData);
      return res.status(response.status).json({ error: 'Failed to subscribe' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  },
  none: async (req, res) => {
    // A route that does nothing but successfully resolves (useful for testing/mocking)
    return res.status(200).json({ success: true, message: 'Mock subscription successful' });
  },
};

const subscriberHandler = async (req: VercelRequest, res: VercelResponse) => {
  try {
    if (req.method !== 'POST') {
      return res.status(404).json({ error: 'Not found' });
    }

    const { email, trigger_automation, provider } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const routeHandler = providerRouter[provider];
    if (!routeHandler) {
      return res.status(400).json({ error: 'Unsupported provider' });
    }

    return await routeHandler(req, res, email, trigger_automation);
  } catch (err) {
    console.error('Unexpected error in POST /subscriber:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default subscriberHandler;
