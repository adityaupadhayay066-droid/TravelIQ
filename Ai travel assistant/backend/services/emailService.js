const nodemailer = require('nodemailer');

/**
 * Helper to determine if real SMTP credentials are provided
 */
function isSmtpConfigured() {
    const user = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
    const pass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').trim();

    if (!user || !pass) return false;
    // Check for dummy or placeholder values
    if (user === '@gmail.com' || user.startsWith('@') || !user.includes('@')) return false;
    if (user === 'test@example.com' || user === 'your_email@gmail.com') return false;
    if (pass === '123165489' || pass === 'password' || pass === 'your_password') return false;

    return true;
}

let transporterInstance = null;

function getTransporter() {
    if (!transporterInstance && isSmtpConfigured()) {
        transporterInstance = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT, 10) || 587,
            secure: process.env.SMTP_PORT == 465,
            auth: {
                user: (process.env.SMTP_USER || process.env.EMAIL_USER).trim(),
                pass: (process.env.SMTP_PASS || process.env.EMAIL_PASS).trim(),
            },
            connectionTimeout: 5000, // 5s connection timeout to prevent hanging requests
            greetingTimeout: 5000,
            socketTimeout: 8000,
        });
    }
    return transporterInstance;
}

/**
 * Send email safely.
 * If SMTP credentials are dummy or missing, logs to console (especially OTPs) without throwing or stalling requests.
 */
async function sendEmail({ to, subject, html, text, otpCode, purpose = 'notification' }) {
    if (!isSmtpConfigured()) {
        if (otpCode) {
            console.log('\n┌────────────────────────────────────────────────────────┐');
            console.log(`│ 🔒 [TRAVELIQ DEV OTP] ${purpose.toUpperCase()}`);
            console.log(`│ To: ${to}`);
            console.log(`│ 🔑 Verification Code: ${otpCode}`);
            console.log(`│ (SMTP not configured. Real email simulated)            `);
            console.log('└────────────────────────────────────────────────────────┘\n');
        } else {
            console.log(`ℹ️ [Email Simulation] '${subject}' skipped for ${to} (SMTP not configured)`);
        }
        return { success: true, simulated: true };
    }

    try {
        const transporter = getTransporter();
        const mailOptions = {
            from: `"TravelIQ Security" <${(process.env.SMTP_USER || process.env.EMAIL_USER).trim()}>`,
            to,
            subject,
            ...(html ? { html } : {}),
            ...(text ? { text } : {})
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ [Email Service] Email sent successfully to ${to} (${subject})`);
        return { success: true, info };
    } catch (err) {
        console.warn(`⚠️ [Email Service] Failed to send email to ${to}: ${err.message}`);
        // If an OTP code failed to send via email, print it to console so developer isn't locked out!
        if (otpCode) {
            console.log('\n┌────────────────────────────────────────────────────────┐');
            console.log(`│ ⚠️ [FALLBACK DEV OTP] Email delivery failed`);
            console.log(`│ To: ${to}`);
            console.log(`│ 🔑 Verification Code: ${otpCode}`);
            console.log('└────────────────────────────────────────────────────────┘\n');
        }
        return { success: false, error: err.message };
    }
}

/**
 * Send booking confirmation email and simulated SMS notification
 */
async function sendBookingConfirmation({ user, booking }) {
    if (!user || !user.email) return;

    const pnr = `49204${booking.id}49`;
    const passengerNames = Array.isArray(booking.passengers)
        ? booking.passengers.map(p => typeof p === 'string' ? p : p.name).filter(Boolean).join(', ')
        : 'Confirmed Passenger';

    const subject = `🎫 Booking Confirmed: Service #${booking.train_number || '12301'} (PNR: ${pnr})`;

    const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff;">
        <div style="background: #173F3A; padding: 28px 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">TravelIQ E-Ticket Confirmation</h1>
            <p style="margin: 6px 0 0; font-size: 13px; color: #a7f3d0;">Your reservation has been confirmed and verified!</p>
        </div>
        <div style="padding: 24px;">
            <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                    <span style="font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase;">PNR / Reference:</span>
                    <strong style="font-size: 15px; color: #173F3A; font-family: monospace;">${pnr}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-size: 12px; color: #64748b;">Service Number:</span>
                    <strong style="font-size: 13px; color: #0f172a;">#${booking.train_number || '12301'}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-size: 12px; color: #64748b;">Route:</span>
                    <strong style="font-size: 13px; color: #0f172a;">${booking.source_station_code} ➔ ${booking.destination_station_code}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-size: 12px; color: #64748b;">Class:</span>
                    <strong style="font-size: 13px; color: #0f172a;">${booking.travel_class || 'SL'}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-size: 12px; color: #64748b;">Travelers:</span>
                    <strong style="font-size: 13px; color: #0f172a;">${passengerNames || user.name} (${booking.total_passengers || 1})</strong>
                </div>
                <div style="display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 8px;">
                    <span style="font-size: 13px; color: #173F3A; font-weight: bold;">Total Amount Paid:</span>
                    <strong style="font-size: 16px; color: #15803d;">₹${(booking.ticket_fare || 0).toLocaleString()}</strong>
                </div>
            </div>
            <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0;">
                💡 <strong>Important Note:</strong> Please carry an original government photo ID (Aadhaar / Voter ID / Passport) during the journey.
            </p>
        </div>
        <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 11px; color: #94a3b8;">
            TravelIQ AI Smart Travel Assistant • Automated Notification Dispatch
        </div>
    </div>
    `;

    // 1. Dispatch Email (or log simulation if SMTP credentials not filled)
    await sendEmail({
        to: user.email,
        subject,
        html,
        purpose: 'booking_confirmation'
    });

    // 2. Simulated SMS Notification
    console.log('\n┌────────────────────────────────────────────────────────┐');
    console.log(`│ 📱 [TRAVELIQ SMS SIMULATOR] Booking SMS Dispatched    `);
    console.log(`│ To: ${user.phone || '+91-9876543210'} (${user.name})`);
    console.log(`│ PNR: ${pnr} | Train: #${booking.train_number || '12301'}`);
    console.log(`│ Route: ${booking.source_station_code} ➔ ${booking.destination_station_code}`);
    console.log(`│ Class: ${booking.travel_class || 'SL'} | Fare: ₹${booking.ticket_fare}`);
    console.log(`│ Status: CONFIRMED ✅                                   `);
    console.log('└────────────────────────────────────────────────────────┘\n');
}

module.exports = {
    sendEmail,
    sendBookingConfirmation,
    isSmtpConfigured,
    getTransporter
};
