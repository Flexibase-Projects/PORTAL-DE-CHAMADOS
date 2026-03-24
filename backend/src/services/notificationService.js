import supabase from '../config/supabase.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';

const client = () => supabaseAdmin || supabase;

export const notificationService = {
  async getByAuthUserId(authUserId, options = {}) {
    if (!authUserId) return { list: [], unreadCount: 0 };
    const db = client();
    const unreadOnly = options.unreadOnly === true;
    let q = db
      .from('PDC_notifications')
      .select('*')
      .eq('auth_user_id', authUserId)
      .order('created_at', { ascending: false })
      .limit(options.limit || 50);
    if (unreadOnly) q = q.eq('lida', false);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const list = data || [];
    const { count, error: countErr } = await db
      .from('PDC_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('auth_user_id', authUserId)
      .eq('lida', false);
    const unreadCount = countErr ? list.filter((n) => n.lida === false).length : count ?? 0;
    return { list, unreadCount };
  },

  async markAsRead(id, authUserId) {
    if (!authUserId) return null;
    const { data, error } = await client()
      .from('PDC_notifications')
      .update({ lida: true })
      .eq('id', id)
      .eq('auth_user_id', authUserId)
      .select()
      .single();
    if (error) return null;
    return data;
  },

  async markAllAsRead(authUserId) {
    if (!authUserId) return;
    await client()
      .from('PDC_notifications')
      .update({ lida: true })
      .eq('auth_user_id', authUserId)
      .eq('lida', false);
  },

  async markAllAsReadByTicketId(authUserId, ticketId) {
    if (!authUserId || !ticketId) return;
    await client()
      .from('PDC_notifications')
      .update({ lida: true })
      .eq('auth_user_id', authUserId)
      .eq('ticket_id', ticketId)
      .eq('lida', false);
  },
};
