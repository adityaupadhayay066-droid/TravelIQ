const { SosAlert, User } = require('../models');
const { sendEmail } = require('../services/emailService');
const parser = require('ua-parser-js');

exports.triggerSOS = async (req, res) => {
    try {
        const { location } = req.body;
        const user = await User.findByPk(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const ua = parser(req.headers['user-agent']);
        const deviceString = `${ua.browser.name || 'Unknown Browser'} on ${ua.os.name || 'Unknown OS'}`;
        
        const alert = await SosAlert.create({
            user_id: user.id,
            user_name: user.name,
            email: user.email,
            location: location || 'Location unavailable',
            device: deviceString,
            status: 'active'
        });

        // Send Email (non-blocking)
        sendEmail({
            to: user.email,
            subject: '🚨 Emergency SOS Alert - TravelIQ',
            text: `Emergency assistance requested.\n\nUser Name: ${user.name}\nEmail: ${user.email}\nDate: ${new Date().toLocaleDateString()}\nTime: ${new Date().toLocaleTimeString()}\nLocation: ${location || 'Unavailable'}\nDevice: ${deviceString}\n\nReference ID: ${alert.id}`
        }).then(res => {
            if (res.success && !res.simulated) {
                console.log(`[SOS] Emergency email sent for Alert #${alert.id}`);
            }
        }).catch(mailErr => {
            console.warn('[SOS] Failed to send email:', mailErr.message);
        });

        res.status(201).json({
            message: 'Emergency Alert Sent Successfully',
            alertId: alert.id,
            timestamp: alert.timestamp
        });
    } catch (error) {
        console.error('Error triggering SOS:', error);
        res.status(500).json({ message: 'Server Error triggering SOS' });
    }
};

exports.getAlerts = async (req, res) => {
    try {
        const alerts = await SosAlert.findAll({
            order: [['timestamp', 'DESC']],
            limit: 100
        });
        res.status(200).json(alerts);
    } catch (error) {
        console.error('Error fetching SOS alerts:', error);
        res.status(500).json({ message: 'Server Error fetching SOS alerts' });
    }
};
