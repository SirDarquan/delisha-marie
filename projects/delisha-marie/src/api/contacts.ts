import { Router } from 'express';
import { getSupabaseClient } from './supabase';

const contactsRouter = Router();

contactsRouter.post('/contacts', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

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
});

export default contactsRouter;
