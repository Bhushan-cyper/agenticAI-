const Notification = require('../models/Notification');

class NotificationController {
  async getAll(req, res, next) {
    try {
      const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
      const unreadCount = await Notification.countDocuments({ isRead: false });
      res.status(200).json({
        success: true,
        unreadCount,
        notifications,
      });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const notification = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
      res.status(200).json({
        success: true,
        notification,
      });
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      await Notification.updateMany({ isRead: false }, { isRead: true });
      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new NotificationController();
