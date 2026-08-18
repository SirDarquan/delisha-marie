import { Router } from 'express';
import { backendService } from './supabase-backend.service';

const contactsRouter = Router();

contactsRouter.get('/contacts', async (req, res) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const pageSize = parseInt(req.query['pageSize'] as string) || 25;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    const folder = (req.query['folder'] as string) || 'inbox';
    const supabase = backendService.supabaseAdmin;
    let query = supabase.from('contacts').select('*', { count: 'exact' });

    if (folder === 'trash') {
      query = query.not('deleted_at', 'is', null);
    } else {
      query = query.is('deleted_at', null);
      if (folder === 'inbox') {
        query = query.is('is_archived', false);
        query = query.or(`snoozed_until.is.null,snoozed_until.lte.${new Date().toISOString()}`);
      } else if (folder === 'snoozed') {
        query = query.gt('snoozed_until', new Date().toISOString());
      }
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) {
      console.error('Error fetching contacts:', error);
      return res.status(500).json({ error: 'Failed to fetch contacts' });
    }

    return res.json({ data, count });
  } catch (err) {
    console.error('Unexpected error in GET /contacts:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

contactsRouter.get('/contacts/:id', async (req, res) => {
  try {
    const supabase = backendService.supabaseAdmin;
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      console.error('Error fetching contact:', error);
      return res.status(500).json({ error: 'Failed to fetch contact' });
    }

    return res.json(data);
  } catch (err) {
    console.error('Unexpected error in GET /contacts/:id:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

contactsRouter.put('/contacts/:id', async (req, res) => {
  try {
    const { is_read, is_archived, snoozed_until, deleted_at } = req.body;
    const supabase = backendService.supabaseAdmin;

    const updateData: Record<string, unknown> = {};
    if (is_read !== undefined) updateData['is_read'] = is_read;
    if (is_archived !== undefined) updateData['is_archived'] = is_archived;
    if (snoozed_until !== undefined) updateData['snoozed_until'] = snoozed_until;
    if (deleted_at !== undefined) updateData['deleted_at'] = deleted_at;

    const { data, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating contact:', error);
      return res.status(500).json({ error: 'Failed to update contact' });
    }

    return res.json(data);
  } catch (err) {
    console.error('Unexpected error in PUT /contacts/:id:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

contactsRouter.delete('/contacts/trash/empty', async (req, res) => {
  try {
    const supabase = backendService.supabaseAdmin;
    const { error } = await supabase.from('contacts').delete().not('deleted_at', 'is', null);

    if (error) {
      console.error('Error emptying trash:', error);
      return res.status(500).json({ error: 'Failed to empty trash' });
    }

    return res.status(204).send();
  } catch (err) {
    console.error('Unexpected error in DELETE /contacts/trash/empty:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
contactsRouter.delete('/contacts/:id', async (req, res) => {
  try {
    const supabase = backendService.supabaseAdmin;
    const { error } = await supabase.from('contacts').delete().eq('id', req.params.id);

    if (error) {
      console.error('Error deleting contact:', error);
      return res.status(500).json({ error: 'Failed to delete contact' });
    }

    return res.status(204).send();
  } catch (err) {
    console.error('Unexpected error in DELETE /contacts/:id:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default contactsRouter;
