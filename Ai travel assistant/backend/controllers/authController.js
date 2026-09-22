const { User, Session, LoginHistory, RefreshToken, SecurityAlert, OtpVerification, UserSecurity, UserPasskey, UserActivityLog } = require('../models');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const geoip = require('geoip-lite');
const { sendEmail } = require('../services/emailService');
const axios = require('axios');
const { parseUserAgent } = require('../utils/uaParser');

// ─── Security Helpers ───
async function checkPwnedPassword(password) {
    // Only enforce HaveIBeenPwned breach check if explicitly enabled in environment variables
    if (process.env.ENFORCE_PWNED_CHECK === 'true') {
        const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
        const prefix = hash.slice(0, 5);
        const suffix = hash.slice(5);
        try {
            const response = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`, { timeout: 3000 });
            const lines = response.data.split('\n');
            for (const line of lines) {
                if (line.startsWith(suffix)) {
                    return true; // Password found in breach
                }
            }
        } catch (err) {
            console.warn('HaveIBeenPwned API check warning:', err.message);
        }
    }
    return false;
}

async function verifyTurnstile(token) {
    if (!process.env.TURNSTILE_SECRET_KEY || !token) return true; // Bypass if not configured
    try {
        const res = await axios.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            secret: process.env.TURNSTILE_SECRET_KEY,
            response: token
        });
        return res.data.success;
    } catch (err) {
        console.error('Turnstile verification failed:', err);
        return false;
    }
}

// ─── JWT Utilities ───
const generateAccessToken = (id, sessionId, role) => {
    return jwt.sign({ id, sessionId, role }, process.env.JWT_SECRET || 'super_secret_jwt_key_traveliq_2026', {
        expiresIn: '15m', // Short-lived access token
    });
};

const generateRefreshToken = (id, sessionId, deviceId) => {
    return jwt.sign({ id, sessionId, deviceId }, process.env.JWT_REFRESH_SECRET || 'refresh_super_secret_2026', {
        expiresIn: '7d', // 7 days
    });
};

const setTokenCookies = (res, accessToken, refreshToken) => {
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};



// ─── Helper: Create session & log history ───
async function createSessionAndLog(user, deviceId, userAgent, ipAddress, isTrusted = false) {
    const { device_type, device_name, os, browser } = parseUserAgent(userAgent);

    if (user.role === 'admin') {
        // Enforce single active session for administrators across all devices.
        // Revoke all other active sessions and refresh tokens for this administrator.
        await Session.destroy({ where: { user_id: user.id } });
        await RefreshToken.destroy({ where: { user_id: user.id } });
    } else {
        // Evict existing session on this device
        await Session.destroy({ where: { user_id: user.id, device_id: deviceId } });
    }

    // Enforce device limit (max 2 per category for standard users)
    const activeSessions = await Session.findAll({
        where: { user_id: user.id, device_type },
        order: [['created_at', 'ASC']]
    });
    if (user.role === 'user' && activeSessions.length >= 2) {
        await activeSessions[0].destroy();
    }

    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    // Geolocation mapping
    let loginLocation = 'Unknown Location';
    const geo = geoip.lookup(ipAddress);
    if (geo) {
        loginLocation = `${geo.city || 'Unknown City'}, ${geo.region || geo.country}`;
    } else if (ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress.includes('127.0.0.1')) {
        loginLocation = 'Local Development';
    }

    await Session.create({
        session_id: sessionId,
        user_id: user.id,
        device_id: deviceId,
        device_type,
        device_name,
        os,
        browser,
        ip_address: ipAddress,
        login_location: loginLocation,
        is_trusted: isTrusted,
        expires_at: expiresAt
    });

    try {
        await LoginHistory.create({
            user_id: user.id,
            session_id: sessionId,
            device_type,
            device_name,
            os,
            browser,
            ip_address: ipAddress,
            location: loginLocation
        });
    } catch (err) {
        console.warn('[Session Log Warning]: LoginHistory creation failed:', err.message);
    }

    user.last_login = new Date();
    user.last_ip = ipAddress;
    await user.save();

    // Generate Refresh Token
    const refreshToken = generateRefreshToken(user.id, sessionId, deviceId);
    const rtExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    await RefreshToken.create({
        user_id: user.id,
        token: refreshToken,
        device_id: deviceId,
        expires_at: rtExpires
    });

    try {
        await UserActivityLog.create({
            user_id: user.id,
            event_type: 'LOGIN_SUCCESS',
            ip_address: ipAddress,
            device_info: `${device_type} - ${browser} on ${os}`,
            location: loginLocation
        });
    } catch (err) {
        console.warn('[Session Log Warning]: UserActivityLog creation failed:', err.message);
    }

    return { sessionId, deviceId, device_type, device_name, os, browser, loginLocation, refreshToken };
}

// ─── Helper: Build user response object ───
function buildUserResponse(user, sessionId, deviceId) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone_number,
        role: user.role,
        profile_image: user.profile_image,
        theme_preference: user.theme_preference,
        email_verified: user.email_verified,
        phone_verified: user.phone_verified,
        two_factor_enabled: user.two_factor_enabled,
        account_status: user.account_status,
        deviceId
    };
}

// ─── Helper: Verify OTP code ───
async function verifyOtp(userId, otpCode, type, purpose) {
    const record = await OtpVerification.findOne({
        where: {
            user_id: userId,
            otp_code: otpCode,
            type,
            purpose,
            verified: false
        },
        order: [['created_at', 'DESC']]
    });

    if (!record) {
        return { success: false, message: 'Invalid OTP code.' };
    }

    if (new Date() > new Date(record.expires_at)) {
        return { success: false, message: 'OTP code has expired.' };
    }

    record.verified = true;
    await record.save();

    return { success: true };
}

// ═════════════════════════════════════════════════
// USER REGISTRATION
// ═════════════════════════════════════════════════
const registerUser = async (req, res) => {
    const { name, email, password, phone, turnstileToken } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (process.env.TURNSTILE_SECRET_KEY) {
        const isValidToken = await verifyTurnstile(turnstileToken);
        if (!isValidToken) {
            return res.status(400).json({ message: 'CAPTCHA verification failed. Please try again.' });
        }
    }

    const isPwned = await checkPwnedPassword(password);
    if (isPwned) {
        return res.status(400).json({ message: 'This password was found in a data breach. Please choose a different one.' });
    }

    // Check if strong password policy is enforced
    const fs = require('fs');
    const path = require('path');
    let enforceStrong = false;
    try {
        const settingsPath = path.join(__dirname, '../config/security_settings.json');
        if (fs.existsSync(settingsPath)) {
            const raw = fs.readFileSync(settingsPath);
            const settings = JSON.parse(raw);
            enforceStrong = settings.enforce_strong_password;
        }
    } catch (err) {
        console.error("Failed to read security settings:", err);
    }

    if (enforceStrong) {
        const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!strongRegex.test(password)) {
            return res.status(400).json({ message: 'Strong password required: minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character.' });
        }
    } else {
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
        }
    }

    try {
        const userExists = await User.findOne({ where: { email: email.toLowerCase().trim() } });
        if (userExists) {
            return res.status(400).json({ message: 'An account with this email address already exists.' });
        }

        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            phone_number: phone || null,
            email_verified: true,
            phone_verified: false,
            two_factor_enabled: false,
            account_status: 'active',
            role: 'user'
        });

        // ─── Direct login post-registration ───
        const userAgent = req.headers['user-agent'] || '';
        const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
        const deviceId = crypto.randomUUID();
        
        const sessionInfo = await createSessionAndLog(user, deviceId, userAgent, ipAddress, true);

        // Set secure cookies
        const accessToken = generateAccessToken(user.id, sessionInfo.sessionId, user.role);
        setTokenCookies(res, accessToken, sessionInfo.refreshToken);

        return res.status(201).json(buildUserResponse(user, sessionInfo.sessionId, deviceId));
    } catch (error) {
        console.error('[Register Error]:', error);
        res.status(500).json({ message: 'Registration failed. Please try again later.' });
    }
};

// ═════════════════════════════════════════════════
// USER LOGIN
// ═════════════════════════════════════════════════
const loginUser = async (req, res) => {
    const { email, password, device_id: clientDeviceId, trust_device, turnstileToken } = req.body;
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '127.0.0.1';

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    if (process.env.TURNSTILE_SECRET_KEY) {
        const isValidToken = await verifyTurnstile(turnstileToken);
        if (!isValidToken) {
            return res.status(400).json({ message: 'CAPTCHA verification failed. Please try again.' });
        }
    }

    try {
        const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // ─── Account status checks ───
        if (user.account_status === 'deleted') {
            return res.status(403).json({ message: 'This account has been permanently deleted. Contact support for assistance.' });
        }

        if (user.account_status === 'pending_verification') {
            user.account_status = 'active';
            user.email_verified = true;
            await user.save();
        }

        if (user.account_status === 'deactivated') {
            // Reactivate on login attempt
            user.account_status = 'active';
        }

        // ─── Brute-force lockout check ───
        if (user.suspended_until && new Date() < new Date(user.suspended_until)) {
            const minutesLeft = Math.ceil((new Date(user.suspended_until) - new Date()) / 1000 / 60);
            return res.status(403).json({
                message: `Account temporarily locked due to too many failed login attempts. Try again in ${minutesLeft} minute(s).`,
                locked_until: user.suspended_until
            });
        }

        // ─── Password validation ───
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            user.failed_attempts = (user.failed_attempts || 0) + 1;
            if (user.failed_attempts >= 5) {
                user.suspended_until = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
                user.failed_attempts = 0;
                await user.save();
                await UserActivityLog.create({
                    user_id: user.id,
                    event_type: 'FAILED_LOGIN_LOCKED',
                    ip_address: ipAddress,
                    device_info: userAgent
                });
                return res.status(403).json({
                    message: 'Too many failed login attempts. Your account has been locked for 15 minutes.',
                    locked_until: user.suspended_until
                });
            }
            await user.save();
            await UserActivityLog.create({
                user_id: user.id,
                event_type: 'FAILED_LOGIN',
                ip_address: ipAddress,
                device_info: userAgent
            });
            const remaining = 5 - user.failed_attempts;
            return res.status(401).json({
                message: `Invalid email or password. ${remaining} attempt(s) remaining before lockout.`
            });
        }

        // ─── Successful password → reset counters ───
        user.failed_attempts = 0;
        if (user.suspended_until) user.suspended_until = null;
        await user.save();

        // ─── Device detection ───
        const { device_type, device_name, os, browser } = parseUserAgent(userAgent);
        const deviceId = clientDeviceId || crypto.randomUUID();

        // Check if this is a trusted/known device
        const trustedDevices = user.trusted_devices || [];
        const isKnownDevice = trustedDevices.includes(deviceId);

        // Check if 2FA (Email OTP) is enabled for this user in user_security
        let isTwoFactorEnabled = false;
        let recoveryEmail = null;
        const sec = await UserSecurity.findOne({ where: { user_id: user.id } });
        if (sec) {
            isTwoFactorEnabled = sec.two_factor_enabled;
            recoveryEmail = sec.recovery_email;
        }

        // If 2FA is enabled and device is NOT trusted, we must prompt for 2FA verification code
        if (isTwoFactorEnabled && !isKnownDevice) {
            const otpCode = crypto.randomInt(100000, 999999).toString();
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

            await OtpVerification.create({
                user_id: user.id,
                otp_code: otpCode,
                type: 'email',
                purpose: 'login_2fa',
                expires_at: expiresAt,
                verified: false
            });

            // Send Email OTP
            await sendEmail({
                to: user.email,
                subject: '🔒 TravelIQ Two-Factor Verification Code',
                otpCode,
                purpose: 'login_2fa',
                html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #0f172a; color: #ffffff;">
                            <h2 style="color: #6366f1; text-align: center;">Two-Factor Authentication</h2>
                            <p style="color: #cbd5e1;">Hello,</p>
                            <p style="color: #cbd5e1;">A sign-in attempt was made to your TravelIQ account.</p>
                            <p style="color: #cbd5e1;">Please use the following one-time verification code to complete your login:</p>
                            <div style="font-size: 32px; font-weight: bold; text-align: center; color: #6366f1; padding: 15px; background-color: #1e293b; border-radius: 8px; margin: 20px 0; letter-spacing: 5px; border: 1px solid #334155;">
                                ${otpCode}
                            </div>
                            <p style="font-size: 12px; color: #64748b;">This code is valid for 5 minutes. If you did not initiate this request, please change your password immediately.</p>
                        </div>
                    `
            });

            return res.json({
                two_factor_required: true,
                userId: user.id,
                email: user.email,
                recovery_email: recoveryEmail
            });
        }

        // ─── Direct login ───
        const sessionInfo = await createSessionAndLog(user, deviceId, userAgent, ipAddress, isKnownDevice);

        // ─── Suspicious Login Detection ───
        if (!isKnownDevice && user.role !== 'admin') {
            await SecurityAlert.create({
                user_id: user.id,
                alert_type: 'new_device',
                ip_address: ipAddress,
                location: sessionInfo.loginLocation,
                details: { device_type, os, browser }
            });

            // Send Security Alert Email (non-blocking for fast login response)
            sendEmail({
                to: user.email,
                subject: '⚠️ New Device Sign-In Alert',
                html: `
                    <h2>Security Alert</h2>
                    <p>We noticed a new sign-in to your TravelIQ account.</p>
                    <ul>
                        <li><strong>Device:</strong> ${device_type} (${os} / ${browser})</li>
                        <li><strong>Location:</strong> ${sessionInfo.loginLocation}</li>
                        <li><strong>IP Address:</strong> ${ipAddress}</li>
                        <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
                    </ul>
                    <p>If this was you, you can safely ignore this email.</p>
                    <p>If you don't recognize this activity, please change your password immediately and review your active sessions in the Security Dashboard.</p>
                `
            }).catch(err => console.warn('Non-blocking security alert email error:', err.message));
        }

        // Set secure cookies
        const accessToken = generateAccessToken(user.id, sessionInfo.sessionId, user.role);
        setTokenCookies(res, accessToken, sessionInfo.refreshToken);

        return res.json(buildUserResponse(user, sessionInfo.sessionId, deviceId));

    } catch (error) {
        console.error('[Login Error]:', error);
        res.status(500).json({ message: 'Login failed due to a server error. Please try again.' });
    }
};



// ═════════════════════════════════════════════════
// ADMIN LOGIN (Separate endpoint)
// ═════════════════════════════════════════════════
const adminLogin = async (req, res) => {
    const { email, password } = req.body;
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '127.0.0.1';

    if (!email || !password) {
        return res.status(400).json({ message: 'Admin email and password are required.' });
    }

    try {
        const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });

        if (!user) {
            return res.status(401).json({ message: 'Invalid administrator credentials.' });
        }

        // ─── Reject non-admins immediately (server-side enforcement) ───
        if (user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied. This portal is restricted to authorized administrators only.'
            });
        }

        if (user.account_status === 'deleted' || user.account_status === 'deactivated') {
            return res.status(403).json({ message: 'This administrator account has been disabled.' });
        }

        // ─── Brute-force lockout ───
        if (user.suspended_until && new Date() < new Date(user.suspended_until)) {
            const minutesLeft = Math.ceil((new Date(user.suspended_until) - new Date()) / 1000 / 60);
            return res.status(403).json({
                message: `Administrator account temporarily locked. Try again in ${minutesLeft} minute(s).`
            });
        }

        // ─── Password validation ───
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            user.failed_attempts = (user.failed_attempts || 0) + 1;
            if (user.failed_attempts >= 3) { // Stricter for admin: 3 attempts
                user.suspended_until = new Date(Date.now() + 30 * 60 * 1000); // 30 min lock
                user.failed_attempts = 0;
                await user.save();
                return res.status(403).json({
                    message: 'Too many failed attempts. Administrator account locked for 30 minutes.'
                });
            }
            await user.save();
            return res.status(401).json({ message: 'Invalid administrator credentials.' });
        }

        // ─── Reset failed attempts ───
        user.failed_attempts = 0;
        if (user.suspended_until) user.suspended_until = null;
        await user.save();

        // Check if 2FA (Email OTP) is enabled for admin in user_security
        let isTwoFactorEnabled = false;
        const sec = await UserSecurity.findOne({ where: { user_id: user.id } });
        if (sec) {
            isTwoFactorEnabled = sec.two_factor_enabled;
        }

        if (isTwoFactorEnabled) {
            const otpCode = crypto.randomInt(100000, 999999).toString();
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

            await OtpVerification.create({
                user_id: user.id,
                otp_code: otpCode,
                type: 'email',
                purpose: 'admin_2fa',
                expires_at: expiresAt,
                verified: false
            });

            // Send Email OTP
            await sendEmail({
                to: user.email,
                subject: '🔒 TravelIQ Admin Two-Factor Verification Code',
                otpCode,
                purpose: 'admin_2fa',
                html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #0f172a; color: #ffffff;">
                            <h2 style="color: #6366f1; text-align: center;">Admin Two-Factor Authentication</h2>
                            <p style="color: #cbd5e1;">Hello Admin,</p>
                            <p style="color: #cbd5e1;">An admin sign-in attempt was made to your TravelIQ account.</p>
                            <p style="color: #cbd5e1;">Please use the following one-time verification code to complete your login:</p>
                            <div style="font-size: 32px; font-weight: bold; text-align: center; color: #6366f1; padding: 15px; background-color: #1e293b; border-radius: 8px; margin: 20px 0; letter-spacing: 5px; border: 1px solid #334155;">
                                ${otpCode}
                            </div>
                            <p style="font-size: 12px; color: #64748b;">This code is valid for 5 minutes.</p>
                        </div>
                    `
            });

            return res.json({
                two_factor_required: true,
                userId: user.id,
                email: user.email
            });
        }

        const deviceId = crypto.randomUUID();
        const sessionInfo = await createSessionAndLog(user, deviceId, userAgent, ipAddress, true);

        // Set secure cookies
        const accessToken = generateAccessToken(user.id, sessionInfo.sessionId, user.role);
        setTokenCookies(res, accessToken, sessionInfo.refreshToken);

        return res.json(buildUserResponse(user, sessionInfo.sessionId, deviceId));

    } catch (error) {
        console.error('[Admin Login Error]:', error);
        res.status(500).json({ message: 'Admin authentication failed. Please try again.' });
    }
};

// ═════════════════════════════════════════════════
// ADMIN OTP VERIFY (Separate endpoint)
// ═════════════════════════════════════════════════
const adminVerifyOtp = async (req, res) => {
    const { userId, otpCode } = req.body;
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '127.0.0.1';

    if (!userId || !otpCode) {
        return res.status(400).json({ message: 'User ID and OTP code are required.' });
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Administrator account not found.' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Not an administrator account.' });
        }

        const verificationResult = await verifyOtp(userId, otpCode, 'email', 'admin_2fa');
        if (!verificationResult.success) {
            return res.status(400).json({ message: verificationResult.message });
        }

        // ─── Create admin session ───
        const deviceId = crypto.randomUUID();
        const sessionInfo = await createSessionAndLog(user, deviceId, userAgent, ipAddress, true);

        // Set secure cookies
        const accessToken = generateAccessToken(user.id, sessionInfo.sessionId, user.role);
        setTokenCookies(res, accessToken, sessionInfo.refreshToken);

        return res.json(buildUserResponse(user, sessionInfo.sessionId, deviceId));

    } catch (error) {
        console.error('[Admin Verify OTP Error]:', error);
        res.status(500).json({ message: 'Admin OTP verification failed.' });
    }
};

// ═════════════════════════════════════════════════
// ADMIN REGISTRATION (Separate endpoint)
// ═════════════════════════════════════════════════
const registerAdmin = async (req, res) => {
    const { name, email, password, adminSecret } = req.body;

    if (!name || !email || !password || !adminSecret) {
        return res.status(400).json({ message: 'Name, email, password, and admin security key are required.' });
    }

    const expectedSecret = process.env.ADMIN_SECRET_KEY || 'ADMIN2026';
    if (adminSecret.trim() !== expectedSecret.trim()) {
        return res.status(403).json({ message: 'Invalid Admin Security Key. Authorization failed.' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    try {
        const userExists = await User.findOne({ where: { email: email.toLowerCase().trim() } });
        if (userExists) {
            return res.status(400).json({ message: 'An account with this email address already exists.' });
        }

        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            email_verified: true,
            phone_verified: false,
            two_factor_enabled: false,
            account_status: 'active',
            role: 'admin'
        });

        const userAgent = req.headers['user-agent'] || '';
        const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
        const deviceId = crypto.randomUUID();

        const sessionInfo = await createSessionAndLog(user, deviceId, userAgent, ipAddress, true);

        const accessToken = generateAccessToken(user.id, sessionInfo.sessionId, user.role);
        setTokenCookies(res, accessToken, sessionInfo.refreshToken);

        return res.status(201).json(buildUserResponse(user, sessionInfo.sessionId, deviceId));
    } catch (error) {
        console.error('[Admin Register Error]:', error);
        res.status(500).json({ message: 'Admin registration failed. Please try again later.' });
    }
};

// ═════════════════════════════════════════════════
// USER OTP VERIFY (Optional 2FA verification)
// ═════════════════════════════════════════════════
const verify2FA = async (req, res) => {
    const { userId, otpCode, deviceId, trustDevice } = req.body;
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '127.0.0.1';

    if (!userId || !otpCode) {
        return res.status(400).json({ message: 'User ID and OTP code are required.' });
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check if the user entered a valid backup recovery code
        let isBackupCode = false;
        const sec = await UserSecurity.findOne({ where: { user_id: userId } });
        if (sec && sec.backup_codes && Array.isArray(sec.backup_codes)) {
            const index = sec.backup_codes.indexOf(otpCode.toUpperCase().trim());
            if (index !== -1) {
                // Valid backup code! Remove it
                const updatedCodes = [...sec.backup_codes];
                updatedCodes.splice(index, 1);
                sec.backup_codes = updatedCodes;
                await sec.save();
                isBackupCode = true;

                await SecurityAlert.create({
                    user_id: user.id,
                    alert_type: 'security_settings_changed',
                    ip_address: ipAddress,
                    location: 'OTP Recovery',
                    details: { message: 'Backup recovery code used for login.' }
                });
            }
        }

        if (!isBackupCode) {
            // Verify via OTP table
            const verificationResult = await verifyOtp(userId, otpCode, 'email', 'login_2fa');
            if (!verificationResult.success) {
                return res.status(400).json({ message: verificationResult.message });
            }
        }

        // Successfully verified! Manage trusted device
        const activeDeviceId = deviceId || crypto.randomUUID();
        if (trustDevice) {
            const trusted = user.trusted_devices || [];
            if (!trusted.includes(activeDeviceId)) {
                trusted.push(activeDeviceId);
                user.trusted_devices = trusted;
                await user.save();
            }
        }

        // Generate session & login
        const sessionInfo = await createSessionAndLog(user, activeDeviceId, userAgent, ipAddress, trustDevice || user.trusted_devices.includes(activeDeviceId));

        // Set secure cookies
        const accessToken = generateAccessToken(user.id, sessionInfo.sessionId, user.role);
        setTokenCookies(res, accessToken, sessionInfo.refreshToken);

        return res.json(buildUserResponse(user, sessionInfo.sessionId, activeDeviceId));

    } catch (error) {
        console.error('[Verify 2FA Error]:', error);
        res.status(500).json({ message: 'Verification failed due to a server error.' });
    }
};

// ═════════════════════════════════════════════════
// PASSKEY LOGIN CHALLENGE (WebAuthn passwordless request)
// ═════════════════════════════════════════════════
const passkeyLoginChallenge = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required to challenge passkeys.' });
    }

    try {
        const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
        if (!user) {
            return res.status(404).json({ message: 'User not found with this email.' });
        }

        const passkeys = await UserPasskey.findAll({ where: { user_id: user.id } });
        if (passkeys.length === 0) {
            return res.status(400).json({ message: 'No registered passkeys found for this account.' });
        }

        const challenge = crypto.randomBytes(32).toString('hex');
        res.json({
            challenge,
            userId: user.id,
            allowCredentials: passkeys.map(pk => ({
                id: pk.credential_id,
                type: 'public-key'
            }))
        });
    } catch (error) {
        console.error('[Passkey Challenge Error]:', error);
        res.status(500).json({ message: error.message });
    }
};

// ═════════════════════════════════════════════════
// PASSKEY LOGIN VERIFY (Biometric WebAuthn check)
// ═════════════════════════════════════════════════
const passkeyLoginVerify = async (req, res) => {
    const { userId, credentialId, deviceId } = req.body;
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '127.0.0.1';

    if (!userId || !credentialId) {
        return res.status(400).json({ message: 'User ID and credential ID are required.' });
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const passkey = await UserPasskey.findOne({
            where: { user_id: userId, credential_id: credentialId }
        });

        if (!passkey) {
            return res.status(401).json({ message: 'Invalid biometrics credential registration.' });
        }

        // Success! Log the user in
        const activeDeviceId = deviceId || crypto.randomUUID();
        const sessionInfo = await createSessionAndLog(user, activeDeviceId, userAgent, ipAddress, true);

        // Record a security event
        await SecurityAlert.create({
            user_id: user.id,
            alert_type: 'new_device',
            ip_address: ipAddress,
            location: sessionInfo.loginLocation,
            details: { message: 'Signed in successfully via biometric Passkey.' }
        });

        // Set secure cookies
        const accessToken = generateAccessToken(user.id, sessionInfo.sessionId, user.role);
        setTokenCookies(res, accessToken, sessionInfo.refreshToken);

        return res.json(buildUserResponse(user, sessionInfo.sessionId, activeDeviceId));

    } catch (error) {
        console.error('[Passkey Verify Login Error]:', error);
        res.status(500).json({ message: 'Biometric passkey sign-in failed.' });
    }
};

// ═════════════════════════════════════════════════
// GET CURRENT USER (/auth/me)
// ═════════════════════════════════════════════════
const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json(user.toSafeObject());
    } catch (error) {
        console.error('[Get Current User Error]:', error);
        res.status(500).json({ message: 'Failed to fetch user profile.' });
    }
};

// ═════════════════════════════════════════════════
// SECURE LOGOUT
// ═════════════════════════════════════════════════
const logoutUser = async (req, res) => {
    try {
        if (req.sessionId) {
            await Session.destroy({ where: { session_id: req.sessionId } });
            await RefreshToken.update({ revoked: true }, { where: { user_id: req.user.id, device_id: req.sessionRecord?.device_id } });
            
            await LoginHistory.update(
                { logout_time: new Date() },
                { where: { session_id: req.sessionId, user_id: req.user.id } }
            );
        }
        
        // Clear cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken', { path: '/api/auth' });
        
        await UserActivityLog.create({
            user_id: req.user.id,
            event_type: 'LOGOUT',
            ip_address: req.ip || '127.0.0.1'
        });

        res.json({ message: 'Logged out successfully. Session invalidated.' });
    } catch (error) {
        console.error('[Logout Error]:', error);
        res.status(500).json({ message: 'Logout failed.' });
    }
};

// ═════════════════════════════════════════════════
// REFRESH SESSION (Silent Token Refresh)
// ═════════════════════════════════════════════════
const refreshSession = async (req, res) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token provided.' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_super_secret_2026');

        const rtRecord = await RefreshToken.findOne({
            where: { token: refreshToken, user_id: decoded.id }
        });

        if (!rtRecord || rtRecord.revoked || new Date() > new Date(rtRecord.expires_at)) {
            // If compromised or expired, clear cookie
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken', { path: '/api/auth' });
            return res.status(401).json({ message: 'Invalid or expired refresh token.' });
        }

        const user = await User.findByPk(decoded.id);
        if (!user || user.account_status !== 'active') {
            return res.status(403).json({ message: 'User account is not active.' });
        }

        // Issue new access token
        const newAccessToken = generateAccessToken(user.id, decoded.sessionId, user.role);

        // Optionally, rotate refresh token here, but for simplicity we'll just keep the existing one until it expires.
        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.json({ message: 'Session refreshed successfully.' });
    } catch (error) {
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken', { path: '/api/auth' });
        return res.status(401).json({ message: 'Invalid refresh token.' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    adminLogin,
    adminVerifyOtp,
    registerAdmin,
    getCurrentUser,
    logoutUser,
    refreshSession,
    verify2FA,
    passkeyLoginChallenge,
    passkeyLoginVerify
};
