const { Session } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all active sessions for the currently logged-in user.
 */
const getActiveSessions = async (req, res) => {
    try {
        const sessions = await Session.findAll({
            where: { user_id: req.user.id },
            order: [['last_active', 'DESC']]
        });

        // Map and mark the current active session
        const mappedSessions = sessions.map(session => {
            const data = session.toJSON();
            return {
                ...data,
                is_current: data.session_id === req.sessionId
            };
        });

        res.json(mappedSessions);
    } catch (error) {
        console.error('[Get Sessions Error]:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Revoke a specific active session.
 */
const revokeSession = async (req, res) => {
    const { sessionId } = req.params;
    try {
        const session = await Session.findOne({
            where: { session_id: sessionId, user_id: req.user.id }
        });

        if (!session) {
            return res.status(404).json({ message: 'Session not found or does not belong to you.' });
        }

        await session.destroy();
        res.json({ message: 'Device session successfully revoked.' });
    } catch (error) {
        console.error('[Revoke Session Error]:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Revoke all active sessions except the current one.
 */
const revokeOtherSessions = async (req, res) => {
    try {
        const deletedCount = await Session.destroy({
            where: {
                user_id: req.user.id,
                session_id: {
                    [Op.ne]: req.sessionId // not equal to current session
                }
            }
        });

        res.json({
            message: `Successfully terminated ${deletedCount} other device session(s).`
        });
    } catch (error) {
        console.error('[Revoke Other Sessions Error]:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getActiveSessions,
    revokeSession,
    revokeOtherSessions
};
