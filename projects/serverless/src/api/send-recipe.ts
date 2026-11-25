import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkBotId } from 'botid/server';
import { getBaseUrl } from './sitemap';
import { enrollNewsletterSubscriber } from './subscriber';
import { getSupabaseClient } from './supabase';

export interface SendRecipeBody {
  email?: string;
  recipeSlug?: string;
  recipeTitle?: string;
  recipeUrl?: string;
  recipeImage?: string;
  recipeDescription?: string;
  subscribeNewsletter?: boolean;
}

export function resolveRecipeImageUrl(image: string | null | undefined): string {
  if (!image) return '';
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }
  const optimizeImage = process.env['OPTIMIZE_IMAGE'];
  if (!optimizeImage) {
    return image;
  }
  const cleanBase = optimizeImage.endsWith('/') ? optimizeImage.slice(0, -1) : optimizeImage;
  const cleanImage = image.startsWith('/') ? image : `/${image}`;
  return `${cleanBase}${cleanImage}`;
}

interface DispatchOptions {
  token: string;
  templateId: string;
  email: string;
  variables: Record<string, unknown>;
}

async function dispatchSenderEmail(options: DispatchOptions): Promise<Response> {
  const { token, templateId, email, variables } = options;

  const url = `https://api.sender.net/v2/message/${templateId}/send`;
  return fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      to: {
        email,
        name: email.split('@')[0],
      },
      variables,
    }),
  });
}

export default async function sendRecipeHandler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(404).json({ error: 'Not found' });
    }

    const verification = await checkBotId();
    if (verification?.isBot) {
      return res.status(200).json({ success: true, message: 'It submitted!' });
    }

    const {
      email,
      recipeSlug,
      recipeTitle: inputTitle,
      recipeUrl: inputUrl,
      recipeImage: inputImage,
      recipeDescription: inputDescription,
      subscribeNewsletter,
    }: SendRecipeBody = req.body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const token = process.env.SENDER_API_TOKEN;
    if (!token) {
      console.error('Missing SENDER_API_TOKEN');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    let recipeTitle = inputTitle;
    let recipeImage = inputImage;
    let recipeDescription = inputDescription;

    if (recipeSlug && (!recipeTitle || !recipeImage || !recipeDescription)) {
      try {
        const supabase = await getSupabaseClient();
        const { data: dbRecipe } = await supabase
          .from('recipes')
          .select('title, slug, image, description')
          .eq('slug', recipeSlug)
          .maybeSingle();

        if (dbRecipe) {
          recipeTitle ||= dbRecipe.title;
          recipeImage ||= dbRecipe.image;
          recipeDescription ||= dbRecipe.description;
        }
      } catch (dbErr) {
        console.warn('Could not fetch fallback recipe details from Supabase:', dbErr);
      }
    }

    const baseUrl = getBaseUrl(req);
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    let recipeUrl: string;
    if (recipeSlug) {
      recipeUrl = `${cleanBase}/kitchen/recipe/${recipeSlug}`;
    } else if (inputUrl?.startsWith('http')) {
      recipeUrl = inputUrl;
    } else {
      const path = inputUrl?.startsWith('/') ? inputUrl : `/${inputUrl || ''}`;
      recipeUrl = path.startsWith('/kitchen')
        ? `${cleanBase}${path}`
        : `${cleanBase}/kitchen${path}`;
    }

    const resolvedImage = resolveRecipeImageUrl(recipeImage);

    const variables: Record<string, unknown> = {
      url: recipeUrl,
      title: recipeTitle || 'Featured Recipe',
      description: recipeDescription || '',
      image: resolvedImage,
    };

    const templateId = 'b2gyKJ';
    const response = await dispatchSenderEmail({
      token,
      templateId,
      email,
      variables,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Sender API Error:', response.status, errText);
      return res.status(response.status).json({
        error: 'Failed to send recipe email',
        details: errText,
      });
    }

    const data = await response.json().catch(() => ({}));

    if (subscribeNewsletter) {
      void enrollNewsletterSubscriber(email, true, token).catch((err) => {
        console.error('Failed to enroll newsletter subscriber:', err);
      });
    }

    return res.status(200).json({
      success: true,
      message: 'It submitted!',
      data,
    });
  } catch (err) {
    console.error('Unexpected error in POST /send-recipe:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
