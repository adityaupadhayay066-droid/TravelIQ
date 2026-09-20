const { Session, RefreshToken, UserActivityLog } = require('../models');

// Fetch all active sessions for the current user
const getActiveSessions = async (req, res) => {
    try {
        const sessions = await Session.findAll({
            where: { user_id: req.user.id },
            order: [['last_active', 'DESC']]
        });
        
        // Map the data to include an 'isCurrent' flag for UI
        const mappedSessions = sessions.map(session => {
            const data = session.toJSON();
            data.isCurrent = data.session_id === req.sessionId;
            return data;
        });

        res.json(mappedSessions);
    } catch (error) {
        console.error('[Get Sessions Error]:', error);
        res.status(500).json({ message: 'Failed to fetch active sessions.' });
    }
};

// Remotely terminate a specific session
const terminateSession = async (req, res) => {
    const { sessionId } = req.params;

    if (!sessionId) {
        return res.status(400).json({ message: 'Session ID is required.' });
    }

    try {
        const session = await Session.findOne({
            where: { session_id: sessionId, user_id: req.user.id }
        });

        if (!session) {
            return res.status(404).json({ message: 'Session not found.' });
        }

        // Revoke the refresh token associated with this device
        await RefreshToken.update(
            { revoked: true }, 
            { where: { user_id: req.user.id, device_id: session.device_id } }
        );

        // Delete the session record
        await session.destroy();

        await UserActivityLog.create({
            user_id: req.user.id,
            event_type: 'SESSION_TERMINATED',
            ip_address: req.ip || '127.0.0.1',
            device_info: `Terminated Session ID: ${sessionId}`
        });

        res.json({ message: 'Session terminated successfully.' });
    } catch (error) {
        console.error('[Terminate Session Error]:', error);
        res.status(500).json({ message: 'Failed to terminate session.' });
    }
};

module.exports = {
    getActiveSessions,
    terminateSession
};
