const { run, get, all } = require('../database/db');

const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const total_obj = await get('SELECT COUNT(*) as total FROM notifications WHERE user_id = ?', [req.user.id]);
    const unread = await get('SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND is_read = 0', [req.user.id]);
    const notifications = await all(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [req.user.id, Number(limit), offset]
    );
    res.json({
      success: true,
      data: {
        notifications,
        unread_count: unread.cnt,
        pagination: { total: total_obj.total, page: Number(page), limit: Number(limit) },
      },
    });
  } catch (err) { next(err); }
};

const markRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notif = await get('SELECT id FROM notifications WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found.' });
    await run('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) { next(err); }
};

const markAllRead = async (req, res, next) => {
  try {
    await run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) { next(err); }
};

module.exports = { getNotifications, markRead, markAllRead };
