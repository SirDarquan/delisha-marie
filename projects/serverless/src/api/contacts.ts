import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from './supabase';

export default async function contactsHandler(req: VercelRequest, res: VercelResponse) {
  try {
    // In Vercel, the route is already matched by the filename.
    if (req.method !== 'POST') {
      return res.status(404).json({ error: 'Not found' });
    }

    const { name, email, subject, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('contacts')
      .insert([
        {
          name,
          email,
          subject,
          message,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error inserting contact:', error);
      return res.status(500).json({ error: 'Failed to save contact message' });
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error('Unexpected error in POST /contacts:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
