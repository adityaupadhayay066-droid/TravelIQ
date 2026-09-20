const jwt = require('jsonwebtoken');
const { User, Session } = require('../models');

/**
 * Core authentication middleware — verifies JWT + active database session.
 */
const protect = async (req, res, next) => {
    let token;
    // Support both HttpOnly cookie and Bearer header (for mobile/API clients)
    if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_traveliq_2026');

            // Stateful session verification
            const activeSession = await Session.findOne({
                where: { session_id: decoded.sessionId, user_id: decoded.id }
            });

            if (!activeSession) {
                return res.status(401).json({ message: 'Session revoked or expired. Please log in again.' });
            }

            // Expiry check
            if (new Date() > new Date(activeSession.expires_at)) {
                await activeSession.destroy();
                return res.status(401).json({ message: 'Session expired. Please log in again.' });
            }

            // Fetch user
            req.user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized — user account not found.' });
            }

            // Account status checks
            if (req.user.account_status === 'deactivated') {
                return res.status(403).json({ message: 'This account has been deactivated by an administrator.' });
            }
            if (req.user.account_status === 'deleted') {
                return res.status(403).json({ message: 'This account has been permanently deleted.' });
            }
            if (req.user.account_status === 'pending_verification') {
                return res.status(403).json({ message: 'Account verification required. Please verify your email first.' });
            }

            // Suspension check
            if (req.user.suspended_until && new Date() < new Date(req.user.suspended_until)) {
                return res.status(403).json({
                    message: `This account is temporarily suspended until ${new Date(req.user.suspended_until).toLocaleString()}.`
                });
            }

            // Attach session info
            req.sessionId = decoded.sessionId;
            req.sessionRecord = activeSession;

            // Touch last active time
            activeSession.last_active = new Date();
            await activeSession.save();

            return next();
        } catch (error) {
            console.error('[authMiddleware Error]:', error.message);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Session token expired. Please log in again.' });
            }
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Invalid session token. Please log in again.' });
            }
            return res.status(401).json({ message: 'Authentication failed. Please log in again.' });
        }
    }

    return res.status(401).json({ message: 'Not authorized — no session token provided.' });
};

/**
 * Admin-only middleware — must be used AFTER protect middleware in the chain.
 */
const adminProtect = async (req, res, next) => {
    try {
        await protect(req, res, () => {
            if (res.headersSent) return;
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
            }
            next();
        });
    } catch (error) {
        if (!res.headersSent) {
            return res.status(401).json({ message: 'Authentication failed.' });
        }
    }
};

/**
 * Optional protection — attaches user if token exists and is valid, but allows anonymous requests if not.
 */
const optionalProtect = async (req, res, next) => {
    let token;
    if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_traveliq_2026');
            const activeSession = await Session.findOne({
                where: { session_id: decoded.sessionId, user_id: decoded.id }
            });

            if (activeSession && new Date() < new Date(activeSession.expires_at)) {
                const user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
                if (user && user.account_status === 'active') {
                    req.user = user;
                    req.sessionId = decoded.sessionId;
                    activeSession.last_active = new Date();
                    await activeSession.save();
                }
            }
        } catch (error) {
            // Ignore token errors, treat as anonymous
        }
    }
    return next();
};

/**
 * Role-based permission guard (e.g. ['super_admin', 'data_manager'])
 */
const requireAdminRole = (allowedRoles = []) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
        }
        
        // Super admin has full access across all admin modules
        const userAdminRole = req.user.admin_role || (req.user.email === (process.env.ADMIN_SEED_EMAIL || 'admin@traveliq.com') ? 'super_admin' : 'admin');
        if (userAdminRole === 'super_admin' || allowedRoles.length === 0 || allowedRoles.includes(userAdminRole)) {
            return next();
        }

        return res.status(403).json({
            message: `Permission denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${userAdminRole}`
        });
    };
};

module.exports = { protect, adminProtect, optionalProtect, requireAdminRole };
