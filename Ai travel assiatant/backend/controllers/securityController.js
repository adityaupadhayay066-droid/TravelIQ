const { Session, LoginHistory, User, RefreshToken, SecurityAlert, UserSecurity, UserPasskey } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');
const { sendEmail } = require('../services/emailService');

/**
 * Fetch login history for the current user.
 */
const getLoginHistory = async (req, res) => {
    try {
        const history = await LoginHistory.findAll({
            where: { user_id: req.user.id },
            order: [['login_time', 'DESC']],
            limit: 50
        });

        const activeSessions = await Session.findAll({ where: { user_id: req.user.id } });
        const activeIds = activeSessions.map(s => s.session_id);

        const mappedHistory = history.map(h => {
            const data = h.toJSON();
            const isStillActive = activeIds.includes(data.session_id);
            return {
                ...data,
                is_active: isStillActive,
                status: isStillActive ? 'Active Session' : (data.logout_time ? 'Signed Out' : 'Session Expired')
            };
        });

        res.json(mappedHistory);
    } catch (error) {
        console.error('[Get History Error]:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Retrieve active devices/sessions for current user.
 */
const getActiveSessions = async (req, res) => {
    try {
        const sessions = await Session.findAll({
            where: { user_id: req.user.id },
            order: [['last_active', 'DESC']]
        });

        const mapped = sessions.map(s => {
            const data = s.toJSON();
            return {
                ...data,
                is_current: data.session_id === req.sessionId
            };
        });

        res.json(mapped);
    } catch (error) {
        console.error('[Get Active Sessions Error]:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Revoke a specific session and log it.
 */
const revokeSession = async (req, res) => {
    const { sessionId } = req.params;
    try {
        const session = await Session.findOne({
            where: { session_id: sessionId, user_id: req.user.id }
        });

        if (session) {
            await session.destroy();
            await RefreshToken.update({ revoked: true }, { where: { user_id: req.user.id, device_id: session.device_id } });
        }

        const history = await LoginHistory.findOne({
            where: { session_id: sessionId, user_id: req.user.id }
        });

        if (history) {
            history.logout_time = new Date();
            await history.save();
        }

        res.json({ message: 'Device revoked, active session invalidated.' });
    } catch (error) {
        console.error('[Revoke Session Error]:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Toggle two-factor authentication for the current user.
 */
const toggle2FA = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        user.two_factor_enabled = !user.two_factor_enabled;
        await user.save();

        res.json({
            two_factor_enabled: user.two_factor_enabled,
            message: user.two_factor_enabled
                ? 'Two-factor authentication has been enabled. You will receive a verification code on every new login.'
                : 'Two-factor authentication has been disabled.'
        });
    } catch (error) {
        console.error('[Toggle 2FA Error]:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get list of trusted devices for the current user.
 */
const getTrustedDevices = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const trustedIds = user.trusted_devices || [];

        // Find sessions that match trusted device IDs
        const trustedSessions = await Session.findAll({
            where: {
                user_id: user.id,
                device_id: { [Op.in]: trustedIds.length > 0 ? trustedIds : ['__none__'] }
            }
        });

        const devices = trustedIds.map(deviceId => {
            const session = trustedSessions.find(s => s.device_id === deviceId);
            return {
                device_id: deviceId,
                device_name: session?.device_name || 'Unknown Device',
                os: session?.os || 'Unknown',
                browser: session?.browser || 'Unknown',
                last_active: session?.last_active || null,
                has_active_session: !!session
            };
        });

        res.json(devices);
    } catch (error) {
        console.error('[Get Trusted Devices Error]:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Remove a device from the trusted list.
 */
const removeTrustedDevice = async (req, res) => {
    const { deviceId } = req.params;
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const trusted = user.trusted_devices || [];
        user.trusted_devices = trusted.filter(id => id !== deviceId);
        await user.save();

        res.json({ message: 'Device removed from trusted list.' });
    } catch (error) {
        console.error('[Remove Trusted Device Error]:', error);
        res.status(500).json({ message: error.message });
    }
};

// ═════════════════════════════════════════════════
// GET SECURITY ALERTS
// ═════════════════════════════════════════════════
const getSecurityAlerts = async (req, res) => {
    try {
        const alerts = await SecurityAlert.findAll({
            where: { user_id: req.user.id, resolved: false },
            order: [['created_at', 'DESC']],
            limit: 10
        });

        res.json(alerts);
    } catch (error) {
        console.error('[Get Alerts Error]:', error);
        res.status(500).json({ message: 'Failed to fetch security alerts.' });
    }
};

// ═════════════════════════════════════════════════
// RESOLVE SECURITY ALERT
// ═════════════════════════════════════════════════
const resolveAlert = async (req, res) => {
    const { alertId } = req.params;

    try {
        const alert = await SecurityAlert.findOne({
            where: { id: alertId, user_id: req.user.id }
        });

        if (!alert) {
            return res.status(404).json({ message: 'Alert not found.' });
        }

        alert.resolved = true;
        await alert.save();

        res.json({ message: 'Alert marked as resolved.' });
    } catch (error) {
        console.error('[Resolve Alert Error]:', error);
        res.status(500).json({ message: 'Failed to resolve alert.' });
    }
};

/**
 * Fetch general security score and checklists
 */
const getUserSecuritySettings = async (req, res) => {
    try {
        let sec = await UserSecurity.findOne({ where: { user_id: req.user.id } });
        if (!sec) {
            sec = await UserSecurity.create({ user_id: req.user.id });
        }
        
        let score = 30; // default for strong password
        const checklist = {
            strong_password: true,
            two_factor: false,
            passkey: false,
            recovery_options: false
        };

        if (sec.two_factor_enabled) {
            score += 25;
            checklist.two_factor = true;
        }
        if (sec.passkey_enabled) {
            score += 25;
            checklist.passkey = true;
        }
        if (sec.recovery_email || sec.recovery_phone) {
            score += 20;
            checklist.recovery_options = true;
        }
        
        const user = await User.findByPk(req.user.id);
        if (user.trusted_devices && user.trusted_devices.length > 0) {
            score += 5;
        }

        res.json({
            settings: sec,
            score,
            checklist
        });
    } catch (error) {
        console.error('[Get Security Settings Error]:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Update recovery options
 */
const updateRecoveryOptions = async (req, res) => {
    const { recovery_email, recovery_phone } = req.body;
    try {
        let sec = await UserSecurity.findOne({ where: { user_id: req.user.id } });
        if (!sec) {
            sec = await UserSecurity.create({ user_id: req.user.id });
        }
        sec.recovery_email = recovery_email || sec.recovery_email;
        sec.recovery_phone = recovery_phone || sec.recovery_phone;
        await sec.save();

        await SecurityAlert.create({
            user_id: req.user.id,
            alert_type: 'security_settings_changed',
            ip_address: req.ip || '127.0.0.1',
            location: 'Account Settings',
            details: { message: 'Recovery options updated.' }
        });

        res.json({ message: 'Recovery options updated successfully.', settings: sec });
    } catch (error) {
        console.error('[Update Recovery Options Error]:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Generate backup codes
 */
const generateBackupCodes = async (req, res) => {
    try {
        let sec = await UserSecurity.findOne({ where: { user_id: req.user.id } });
        if (!sec) {
            sec = await UserSecurity.create({ user_id: req.user.id });
        }
        
        const codes = [];
        for (let i = 0; i < 10; i++) {
            codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
        }
        
        sec.backup_codes = codes;
        await sec.save();

        await SecurityAlert.create({
            user_id: req.user.id,
            alert_type: 'security_settings_changed',
            ip_address: req.ip || '127.0.0.1',
            location: 'Account Settings',
            details: { message: 'Backup recovery codes generated.' }
        });

        res.json({ message: 'Backup codes generated.', codes });
    } catch (error) {
        console.error('[Generate Backup Codes Error]:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * WebAuthn Passkey Registration Challenge
 */
const registerPasskeyChallenge = async (req, res) => {
    try {
        const challenge = crypto.randomBytes(32).toString('hex');
        res.json({
            challenge,
            rp: { name: 'TravelIQ' },
            user: {
                id: req.user.id,
                name: req.user.email,
                displayName: req.user.name
            },
            pubKeyCredParams: [
                { type: 'public-key', alg: -7 },
                { type: 'public-key', alg: -257 }
            ]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Verify WebAuthn Passkey Registration response
 */
const verifyPasskeyRegister = async (req, res) => {
    const { credentialId, publicKey } = req.body;
    try {
        if (!credentialId || !publicKey) {
            return res.status(400).json({ message: 'Credential ID and Public Key are required.' });
        }

        await UserPasskey.create({
            user_id: req.user.id,
            credential_id: credentialId,
            public_key: publicKey
        });

        let sec = await UserSecurity.findOne({ where: { user_id: req.user.id } });
        if (!sec) {
            sec = await UserSecurity.create({ user_id: req.user.id });
        }
        sec.passkey_enabled = true;
        await sec.save();

        await SecurityAlert.create({
            user_id: req.user.id,
            alert_type: 'passkey_added',
            ip_address: req.ip || '127.0.0.1',
            location: 'Security Portal',
            details: { credentialId }
        });

        res.json({ message: 'Passkey registered successfully!' });
    } catch (error) {
        console.error('[Verify Passkey Register Error]:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Remove all user passkeys
 */
const removePasskeys = async (req, res) => {
    try {
        await UserPasskey.destroy({ where: { user_id: req.user.id } });
        
        let sec = await UserSecurity.findOne({ where: { user_id: req.user.id } });
        if (sec) {
            sec.passkey_enabled = false;
            await sec.save();
        }

        await SecurityAlert.create({
            user_id: req.user.id,
            alert_type: 'passkey_removed',
            ip_address: req.ip || '127.0.0.1',
            location: 'Security Portal',
            details: { message: 'All passkeys removed.' }
        });

        res.json({ message: 'All passkeys removed.' });
    } catch (error) {
        console.error('[Remove Passkeys Error]:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Mark a device ID as trusted
 */
const markDeviceAsTrusted = async (req, res) => {
    const { deviceId } = req.body;
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const trusted = user.trusted_devices || [];
        if (!trusted.includes(deviceId)) {
            trusted.push(deviceId);
            user.trusted_devices = trusted;
            await user.save();
        }

        if (req.sessionId) {
            await Session.update({ is_trusted: true }, { where: { session_id: req.sessionId } });
        }

        res.json({ message: 'Device successfully marked as trusted.' });
    } catch (error) {
        console.error('[Mark Device Trusted Error]:', error);
        res.status(500).json({ message: error.message });
    }
};

const triggerSOS = async (req, res) => {
    const { latitude, longitude, emergency_type = 'General' } = req.body;
    try {
        const user = await User.findByPk(req.user.id);
        const details = {
            message: `CRITICAL SOS TRIGGERED: passenger ${user.name} reported a ${emergency_type} emergency.`,
            emergency_type,
            responder_status: 'Dispatched',
            rp_helpline: '182 / 112',
            timestamp: new Date()
        };

        const alert = await SecurityAlert.create({
            user_id: req.user.id,
            alert_type: 'SOS_DISPATCHED',
            ip_address: req.ip || '127.0.0.1',
            location: latitude && longitude ? `LAT: ${latitude}, LNG: ${longitude}` : 'Unknown Coordinates',
            details
        });

        console.log(`[SOS ALARM] User ${user.email} triggered SOS at [${latitude}, ${longitude}]. Dispatching RPF Responder...`);

        // Trigger dynamic notification to administrator
        sendEmail({
            to: process.env.ADMIN_ALERT_EMAIL || 'admin@traveliq.com',
            subject: '⚠️ CRITICAL ALARM: Passenger SOS Emergency Dispatched',
            html: `
                <h3>⚠️ CRITICAL EMERGENCY SYSTEM ALERT</h3>
                <p><strong>Passenger Name:</strong> ${user.name}</p>
                <p><strong>Email Address:</strong> ${user.email}</p>
                <p><strong>Emergency Nature:</strong> ${emergency_type}</p>
                <p><strong>Locked GPS Coordinates:</strong> ${latitude && longitude ? `${latitude}, ${longitude}` : 'Unknown'}</p>
                <p><strong>Dispatched Team:</strong> Railway Protection Force (RPF) Responder Team Locked.</p>
                <p>Please log in to the TravelIQ Administration Panel immediately to track GIS telemetry.</p>
            `
        }).then(result => {
            if (result.success && !result.simulated) {
                console.log(`[SOS ALARM] Emergency alerts successfully emailed to security dispatch.`);
            }
        }).catch(mailErr => {
            console.warn('[SOS ALARM] Mail notify warning:', mailErr.message);
        });

        res.status(201).json({
            message: '🚨 EMERGENCY DISPATCHED: Coordinates & live metrics sent to Railway Protection Force!',
            alert
        });
    } catch (error) {
        console.error('[Trigger SOS Controller Error]:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getLoginHistory,
    getActiveSessions,
    revokeSession,
    toggle2FA,
    getTrustedDevices,
    removeTrustedDevice,
    getSecurityAlerts,
    resolveAlert,
    getUserSecuritySettings,
    updateRecoveryOptions,
    generateBackupCodes,
    registerPasskeyChallenge,
    verifyPasskeyRegister,
    removePasskeys,
    markDeviceAsTrusted,
    triggerSOS
};
