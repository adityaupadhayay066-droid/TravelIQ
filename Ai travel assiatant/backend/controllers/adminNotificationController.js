const { AdminNotification } = require('../models');

// GET /api/admin/notifications
const getNotifications = async (req, res) => {
    try {
        const { unreadOnly = 'false' } = req.query;
        const whereClause = {};
        if (unreadOnly === 'true') {
            whereClause.read = false;
        }

        const notifications = await AdminNotification.findAll({
            where: whereClause,
            order: [['created_at', 'DESC']],
            limit: 50
        });

        const unreadCount = await AdminNotification.count({ where: { read: false } });

        return res.json({
            success: true,
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error('getNotifications error:', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
    }
};

// PUT /api/admin/notifications/:id/read
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await AdminNotification.findByPk(id);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found.' });
        }
        await notification.update({ read: true });
        return res.json({ success: true, message: 'Marked as read.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/admin/notifications/mark-all-read
const markAllAsRead = async (req, res) => {
    try {
        await AdminNotification.update({ read: true }, { where: { read: false } });
        return res.json({ success: true, message: 'All notifications marked as read.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/admin/notifications/:id
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await AdminNotification.findByPk(id);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found.' });
        }
        await notification.destroy();
        return res.json({ success: true, message: 'Notification deleted.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
