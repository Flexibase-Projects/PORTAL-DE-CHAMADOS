import supabase from '../config/supabase.js';

export const notificationService = {
  async getByAuthUserId(authUserId, options = {}) {
    if (!authUserId) return { list: [], unreadCount: 0 };
    const unreadOnly = options.unreadOnly === true;
    let q = supabase
      .from('PDC_notifications')
      .select('*')
      .eq('auth_user_id', authUserId)
      .order('created_at', { ascending: false })
      .limit(options.limit || 50);
    if (unreadOnly) q = q.eq('lida', false);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const list = data || [];
    const { count } = await supabase
      .from('PDC_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('auth_user_id', authUserId)
      .eq('lida', false);
    return { list, unreadCount: count ?? 0 };
  },

  async markAsRead(id, authUserId) {
    if (!authUserId) return null;
    const { data, error } = await supabase
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
    await supabase
      .from('PDC_notifications')
      .update({ lida: true })
      .eq('auth_user_id', authUserId)
      .eq('lida', false);
  },
};
