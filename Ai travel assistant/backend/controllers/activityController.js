const { UserActivityLog } = require('../models');

// Fetch user activity logs with pagination
const getActivityLogs = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        const logs = await UserActivityLog.findAll({
            where: { user_id: req.user.id },
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        res.json(logs);
    } catch (error) {
        console.error('[Get Activity Logs Error]:', error);
        res.status(500).json({ message: 'Failed to fetch activity logs.' });
    }
};

module.exports = {
    getActivityLogs
};
