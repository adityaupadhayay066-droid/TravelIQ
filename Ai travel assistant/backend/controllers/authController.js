'use strict';

const { User, Session, LoginHistory, RefreshToken, SecurityAlert, OtpVerification, UserSecurity, UserPasskey, UserActivityLog } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/db');
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
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not configured');
    return jwt.sign({ id, sessionId, role }, secret, {
        expiresIn: '15m', // Short-lived access token
    });
};

const generateRefreshToken = (id, sessionId, deviceId) => {
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!refreshSecret) throw new Error('JWT_REFRESH_SECRET is not configured');
    return jwt.sign({
        id,
        sessionId,
        deviceId,
        jti: crypto.randomBytes(12).toString('hex')
    }, refreshSecret, {
        algorithm: 'HS256',
        expiresIn: '7d', // 7 days
    });
};

const setTokenCookies = (res, accessToken, refreshToken) => {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
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
    const isSuperAdminUser = user.admin_role === 'super_admin' || user.email === 'adityaupadhayay066@gmail.com' || user.email === (process.env.ADMIN_SEED_EMAIL || 'admin@traveliq.com');
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone_number,
        role: user.role,
        admin_role: isSuperAdminUser ? 'super_admin' : (user.admin_role || (user.role === 'admin' ? 'admin' : null)),
        profile_image: user.profile_image,
        theme_preference: user.theme_preference,
        email_verified: user.email_verified,
        phone_verified: user.phone_verified,
        two_factor_enabled: user.two_factor_enabled,
        account_status: user.account_status,
        deviceId
    };
}

// ─── Helper: Verify OTP code with atomic transaction, row lock, attempt limits, and single-use ───
async function verifyOtp(userId, otpCode, type, purpose) {
    if (!userId || !otpCode) {
        return { success: false, message: 'Invalid verification details.' };
    }

    const cleanCode = String(otpCode).trim();
    const inputHash = crypto.createHash('sha256').update(cleanCode).digest('hex');

    const t = await sequelize.transaction();
    try {
        const record = await OtpVerification.findOne({
            where: {
                user_id: userId,
                type,
                purpose,
                verified: false
            },
            order: [['created_at', 'DESC']],
            lock: t.LOCK.UPDATE,
            transaction: t
        });

        if (!record) {
            await t.rollback();
            return { success: false, message: 'Invalid or expired verification code.' };
        }

        // Attempt limit check (maximum 5 attempts)
        if ((record.attempts || 0) >= 5) {
            await t.rollback();
            return { success: false, message: 'Maximum verification attempts exceeded. Code has been invalidated. Please request a new one.' };
        }

        if (new Date() > new Date(record.expires_at)) {
            await t.rollback();
            return { success: false, message: 'Verification code has expired. Please request a new one.' };
        }

        // Increment failed attempt counter atomically under row lock
        record.attempts = (record.attempts || 0) + 1;

        const isMatch = (record.otp_code === inputHash) || (record.otp_code === cleanCode);

        if (!isMatch) {
            await record.save({ transaction: t });
            await t.commit();
            const remaining = Math.max(0, 5 - record.attempts);
            return { success: false, message: `Invalid verification code. ${remaining} attempt(s) remaining.` };
        }

        // Consume OTP atomically: single-use guaranteed
        record.verified = true;
        await record.save({ transaction: t });
        await t.commit();

        return { success: true };
    } catch (err) {
        await t.rollback();
        throw err;
    }
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
        const ipAddress = req.ip || '127.0.0.1';
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
    const ipAddress = req.ip || '127.0.0.1';

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
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        // ─── Successful password → reset counters ───
        user.failed_attempts = 0;
        if (user.suspended_until) user.suspended_until = null;
        await user.save();

        // ─── Device detection ───
        const { device_type, device_name, os, browser } = parseUserAgent(userAgent);
        const deviceId = clientDeviceId || crypto.randomUUID();

        // Check if this is a verified trusted device using cryptographic server-side token
        let isKnownDevice = false;
        const trustedDeviceCookie = req.cookies?.trusted_device_token;
        if (trustedDeviceCookie && process.env.JWT_SECRET) {
            try {
                const decoded = jwt.verify(trustedDeviceCookie, process.env.JWT_SECRET, { algorithms: ['HS256'] });
                if (decoded.purpose === 'trusted_device' && Number(decoded.userId) === Number(user.id)) {
                    const trustedDevices = user.trusted_devices || [];
                    if (trustedDevices.includes(decoded.deviceId)) {
                        isKnownDevice = true;
                    }
                }
            } catch (err) {
                // Invalid or expired trusted device cookie
            }
        }

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
            const hashedOtp = crypto.createHash('sha256').update(otpCode).digest('hex');
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

            await OtpVerification.create({
                user_id: user.id,
                otp_code: hashedOtp,
                type: 'email',
                purpose: 'login_2fa',
                expires_at: expiresAt,
                verified: false,
                attempts: 0
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

            const challengeToken = jwt.sign(
                { userId: user.id, email: user.email, purpose: '2fa_challenge' },
                process.env.JWT_SECRET,
                { expiresIn: '5m' }
            );

            return res.json({
                two_factor_required: true,
                challengeToken,
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
    const ipAddress = req.ip || '127.0.0.1';

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
            const hashedOtp = crypto.createHash('sha256').update(otpCode).digest('hex');
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

            await OtpVerification.create({
                user_id: user.id,
                otp_code: hashedOtp,
                type: 'email',
                purpose: 'admin_2fa',
                expires_at: expiresAt,
                verified: false,
                attempts: 0
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

            const challengeToken = jwt.sign(
                { userId: user.id, email: user.email, role: 'admin', purpose: 'admin_2fa_challenge' },
                process.env.JWT_SECRET,
                { expiresIn: '5m' }
            );

            return res.json({
                two_factor_required: true,
                challengeToken,
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
    const { userId, otpCode, challengeToken } = req.body;
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || '127.0.0.1';

    if (!userId || !otpCode || !challengeToken) {
        return res.status(400).json({ message: 'User ID, OTP code, and administrator challenge token are required.' });
    }

    try {
        let challengePayload;
        try {
            challengePayload = jwt.verify(challengeToken, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        } catch (err) {
            return res.status(401).json({ message: 'Administrator challenge token is invalid or has expired.' });
        }

        if (!challengePayload || challengePayload.purpose !== 'admin_2fa_challenge' || Number(challengePayload.userId) !== Number(userId)) {
            return res.status(401).json({ message: 'Unauthorized administrator challenge verification attempt.' });
        }

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

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    // 1. Authorization: Only allow via existing Super Admin session or valid one-time provisioning secret
    const isSuperAdminCaller = req.user && req.user.role === 'admin' && (req.user.admin_role === 'super_admin' || req.user.email === 'adityaupadhayay066@gmail.com' || req.user.email === (process.env.ADMIN_SEED_EMAIL || 'admin@traveliq.com'));
    const serverProvisioningToken = process.env.ADMIN_PROVISIONING_TOKEN || process.env.ADMIN_SECRET_KEY;
    const providedToken = req.headers['x-admin-provisioning-token'] || adminSecret;

    let isTokenAuthorized = false;
    if (serverProvisioningToken && providedToken && serverProvisioningToken !== 'ADMIN2026' && serverProvisioningToken.length >= 16) {
        const bufA = Buffer.from(String(providedToken));
        const bufB = Buffer.from(String(serverProvisioningToken));
        if (bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)) {
            isTokenAuthorized = true;
        }
    }

    if (!isSuperAdminCaller && !isTokenAuthorized) {
        return res.status(403).json({ 
            message: 'Unauthorized: Administrator registration is strictly restricted. Super Administrator session or valid server provisioning token required.' 
        });
    }

    // 2. Strong Password Policy for Administrators
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
    if (!strongPasswordRegex.test(password)) {
        return res.status(400).json({ 
            message: 'Administrator password must be at least 10 characters long, containing uppercase, lowercase, a digit, and a special character.' 
        });
    }

    // 3. Breach check
    const isPwned = await checkPwnedPassword(password);
    if (isPwned) {
        return res.status(400).json({ 
            message: 'This password has appeared in known data breaches. Please choose a different, unique password.' 
        });
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
            two_factor_enabled: true, // Require 2FA for administrators
            account_status: 'active',
            role: 'admin',
            admin_role: 'admin' // Newly registered admins receive standard admin role
        });

        await SecurityAlert.create({
            user_id: user.id,
            alert_type: 'admin_account_created',
            ip_address: req.ip || '127.0.0.1',
            location: 'System Provisioning',
            details: {
                message: `New administrator provisioned: ${user.email}`,
                provisionedBy: isSuperAdminCaller ? `SuperAdmin #${req.user.id}` : 'Provisioning Token'
            }
        });

        const userAgent = req.headers['user-agent'] || '';
        const ipAddress = req.ip || '127.0.0.1';
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
    const { userId, otpCode, challengeToken, deviceId, trustDevice } = req.body;
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || '127.0.0.1';

    if (!userId || !otpCode || !challengeToken) {
        return res.status(400).json({ message: 'User ID, OTP code, and login challenge token are required.' });
    }

    try {
        let challengePayload;
        try {
            challengePayload = jwt.verify(challengeToken, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        } catch (err) {
            return res.status(401).json({ message: 'Login challenge token is invalid or has expired.' });
        }

        if (!challengePayload || challengePayload.purpose !== '2fa_challenge' || Number(challengePayload.userId) !== Number(userId)) {
            return res.status(401).json({ message: 'Unauthorized login challenge verification attempt.' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check if the user entered a valid backup recovery code
        let isBackupCode = false;
        const sec = await UserSecurity.findOne({ where: { user_id: userId } });
        if (sec && sec.backup_codes && Array.isArray(sec.backup_codes)) {
            const cleanCandidate = String(otpCode).toUpperCase().trim();
            const candidateHash = crypto.createHash('sha256').update(cleanCandidate).digest('hex');
            const hashIndex = sec.backup_codes.indexOf(candidateHash);
            const plainIndex = sec.backup_codes.indexOf(cleanCandidate);
            const matchedIndex = hashIndex !== -1 ? hashIndex : plainIndex;

            if (matchedIndex !== -1) {
                // Valid backup code! Single use: remove it atomically
                const updatedCodes = [...sec.backup_codes];
                updatedCodes.splice(matchedIndex, 1);
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
            // Verify via OTP table with atomic row-lock
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

            // Cryptographically bind trusted device state to HTTP-only cookie
            const trustedDeviceToken = jwt.sign(
                { userId: user.id, deviceId: activeDeviceId, purpose: 'trusted_device' },
                process.env.JWT_SECRET,
                { expiresIn: '30d' }
            );
            const isProd = process.env.NODE_ENV === 'production';
            res.cookie('trusted_device_token', trustedDeviceToken, {
                httpOnly: true,
                secure: isProd,
                sameSite: isProd ? 'none' : 'lax',
                maxAge: 30 * 24 * 60 * 60 * 1000
            });
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
        const {
            generateAuthenticationOptions,
            storeChallenge,
            getRpId
        } = require('../utils/webauthn');

        const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
        
        // Prevent user enumeration: if user not found or no passkeys, return generic options with dummy challenge
        if (!user) {
            const dummyOptions = await generateAuthenticationOptions({
                rpID: getRpId(req),
                userVerification: 'preferred'
            });
            const challengeToken = storeChallenge({
                challenge: dummyOptions.challenge,
                dummy: true
            });
            return res.json({
                ...dummyOptions,
                challengeToken,
                allowCredentials: []
            });
        }

        const passkeys = await UserPasskey.findAll({ where: { user_id: user.id } });
        if (passkeys.length === 0) {
            const dummyOptions = await generateAuthenticationOptions({
                rpID: getRpId(req),
                userVerification: 'preferred'
            });
            const challengeToken = storeChallenge({
                challenge: dummyOptions.challenge,
                dummy: true
            });
            return res.json({
                ...dummyOptions,
                challengeToken,
                allowCredentials: []
            });
        }

        const allowCredentials = passkeys.map(pk => ({
            id: pk.credential_id,
            transports: pk.transports ? JSON.parse(pk.transports) : undefined
        }));

        const options = await generateAuthenticationOptions({
            rpID: getRpId(req),
            allowCredentials,
            userVerification: 'preferred'
        });

        const challengeToken = storeChallenge({
            challenge: options.challenge,
            userId: user.id,
            email: user.email,
            type: 'login'
        });

        res.json({
            ...options,
            challengeToken
        });
    } catch (error) {
        console.error('[Passkey Challenge Error]:', error);
        res.status(500).json({ message: 'Failed to generate passkey challenge.' });
    }
};

// ═════════════════════════════════════════════════
// PASSKEY LOGIN VERIFY (Biometric WebAuthn check)
// ═════════════════════════════════════════════════
const passkeyLoginVerify = async (req, res) => {
    const { challengeToken, response, credentialId, deviceId } = req.body;
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || '127.0.0.1';

    try {
        const {
            verifyAuthenticationResponse,
            consumeChallenge,
            getRpId,
            getExpectedOrigins
        } = require('../utils/webauthn');

        if (!challengeToken) {
            return res.status(400).json({ message: 'challengeToken is required for passkey verification.' });
        }

        // Single-use challenge: consuming it immediately prevents replay attacks
        const stored = consumeChallenge(challengeToken);
        if (!stored || stored.dummy || stored.type !== 'login' || !stored.userId) {
            return res.status(401).json({ message: 'Passkey verification failed or challenge has expired.' });
        }

        // Obtain identity strictly from verified server-side challenge context, never trust client-supplied userId
        const authenticatedUserId = stored.userId;
        const targetCredId = response?.id || credentialId;

        if (!targetCredId) {
            return res.status(400).json({ message: 'Credential ID is required.' });
        }

        const passkey = await UserPasskey.findOne({
            where: { user_id: authenticatedUserId, credential_id: targetCredId }
        });

        if (!passkey) {
            return res.status(401).json({ message: 'Credential not registered for this account.' });
        }

        // Cryptographic WebAuthn signature assertion verification
        if (response && response.response && response.response.clientDataJSON && response.response.signature) {
            const verification = await verifyAuthenticationResponse({
                response,
                expectedChallenge: stored.challenge,
                expectedOrigin: getExpectedOrigins(req),
                expectedRPID: getRpId(req),
                credential: {
                    id: passkey.credential_id,
                    publicKey: Buffer.from(passkey.public_key, 'base64'),
                    counter: Number(passkey.counter || 0),
                    transports: passkey.transports ? JSON.parse(passkey.transports) : undefined
                },
                requireUserPresence: true,
                requireUserVerification: false
            });

            if (!verification.verified) {
                return res.status(401).json({ message: 'Cryptographic WebAuthn signature verification failed.' });
            }

            // Update counter for authenticator clone detection
            if (verification.authenticationInfo && typeof verification.authenticationInfo.newCounter === 'number') {
                passkey.counter = verification.authenticationInfo.newCounter;
                await passkey.save();
            }
        } else {
            // Client failed to provide cryptographic assertion
            return res.status(401).json({ message: 'Cryptographic WebAuthn signature assertion is required.' });
        }

        const user = await User.findByPk(authenticatedUserId);
        if (!user || user.account_status !== 'active') {
            return res.status(403).json({ message: 'Account is not authorized or is inactive.' });
        }

        // Success! Authenticate user and create session
        const activeDeviceId = deviceId || crypto.randomUUID();
        const sessionInfo = await createSessionAndLog(user, activeDeviceId, userAgent, ipAddress, true);

        await SecurityAlert.create({
            user_id: user.id,
            alert_type: 'new_device',
            ip_address: ipAddress,
            location: sessionInfo.loginLocation,
            details: { message: 'Signed in successfully via verified cryptographic WebAuthn passkey.' }
        });

        const accessToken = generateAccessToken(user.id, sessionInfo.sessionId, user.role);
        setTokenCookies(res, accessToken, sessionInfo.refreshToken);

        return res.json(buildUserResponse(user, sessionInfo.sessionId, activeDeviceId));

    } catch (error) {
        console.error('[Passkey Verify Login Error]:', error);
        return res.status(401).json({ message: 'Biometric passkey verification failed.' });
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
// REFRESH SESSION (Silent Token Refresh with Rotation & Reuse Detection)
// ═════════════════════════════════════════════════
const refreshSession = async (req, res) => {
    const rawToken = req.cookies?.refreshToken || req.headers['x-refresh-token'] || req.body?.refreshToken;

    if (!rawToken) {
        return res.status(401).json({ message: 'No refresh token provided.' });
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!refreshSecret) {
        return res.status(500).json({ message: 'Server authentication configuration error.' });
    }

    try {
        const decoded = jwt.verify(rawToken, refreshSecret, { algorithms: ['HS256'] });

        const rtRecord = await RefreshToken.findOne({
            where: { token: rawToken }
        });

        if (!rtRecord) {
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken', { path: '/api/auth' });
            return res.status(401).json({ message: 'Invalid refresh token.' });
        }

        // ─── Token Reuse Detection: If token was already revoked, terminate all sessions ───
        if (rtRecord.revoked) {
            console.warn(`🚨 [SECURITY ALERT] Refresh token reuse detected for User ID ${rtRecord.user_id}! Revoking all sessions.`);
            await RefreshToken.update({ revoked: true }, { where: { user_id: rtRecord.user_id } });
            await Session.destroy({ where: { user_id: rtRecord.user_id } });

            try {
                await SecurityAlert.create({
                    user_id: rtRecord.user_id,
                    alert_type: 'SUSPICIOUS_LOGIN',
                    severity: 'CRITICAL',
                    resolved: false,
                    details: { reason: 'Refresh token reuse detected. All sessions revoked for safety.' }
                });
            } catch (alertErr) {}

            res.clearCookie('accessToken');
            res.clearCookie('refreshToken', { path: '/api/auth' });
            return res.status(401).json({ message: 'Compromised refresh token: Token reuse detected. All sessions terminated.' });
        }

        if (new Date() > new Date(rtRecord.expires_at)) {
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken', { path: '/api/auth' });
            return res.status(401).json({ message: 'Refresh token has expired.' });
        }

        const user = await User.findByPk(rtRecord.user_id);
        if (!user || user.account_status !== 'active') {
            return res.status(403).json({ message: 'User account is inactive or suspended.' });
        }

        // 1. Invalidate/revoke current refresh token immediately (rotation)
        rtRecord.revoked = true;
        await rtRecord.save();

        // 2. Issue a new rotated refresh token
        const newRefreshToken = generateRefreshToken(user.id, decoded.sessionId, decoded.deviceId || rtRecord.device_id);
        const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await RefreshToken.create({
            user_id: user.id,
            device_id: decoded.deviceId || rtRecord.device_id || 'unknown',
            token: newRefreshToken,
            expires_at: newExpiresAt,
            revoked: false
        });

        // 3. Issue new access token
        const newAccessToken = generateAccessToken(user.id, decoded.sessionId, user.role);

        // 4. Set secure HTTP-only cookies
        const isProdEnv = process.env.NODE_ENV === 'production';
        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: isProdEnv,
            sameSite: isProdEnv ? 'none' : 'lax',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: isProdEnv,
            sameSite: isProdEnv ? 'none' : 'lax',
            path: '/api/auth',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            message: 'Session refreshed successfully with token rotation.',
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken', { path: '/api/auth' });
        return res.status(401).json({ message: 'Invalid or expired refresh token.' });
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
