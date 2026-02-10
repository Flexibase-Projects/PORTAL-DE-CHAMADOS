import { notificationService } from '../services/notificationService.js';

function getAuthUserId(req) {
  return req.query.auth_user_id || req.headers['x-auth-user-id'];
}

export const notificationController = {
  async list(req, res) {
    try {
      const authUserId = getAuthUserId(req);
      if (!authUserId) return res.status(400).json({ success: false, error: 'auth_user_id obrigatório' });
      const { list, unreadCount } = await notificationService.getByAuthUserId(authUserId, {
        unreadOnly: req.query.unread_only === 'true',
        limit: parseInt(req.query.limit, 10) || 50,
      });
      res.json({ success: true, notifications: list, unreadCount });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async markRead(req, res) {
    try {
      const authUserId = getAuthUserId(req);
      if (!authUserId) return res.status(400).json({ success: false, error: 'auth_user_id obrigatório' });
      const notif = await notificationService.markAsRead(req.params.id, authUserId);
      if (!notif) return res.status(404).json({ success: false });
      res.json({ success: true, notification: notif });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async markAllRead(req, res) {
    try {
      const authUserId = getAuthUserId(req);
      if (!authUserId) return res.status(400).json({ success: false, error: 'auth_user_id obrigatório' });
      await notificationService.markAllAsRead(authUserId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
