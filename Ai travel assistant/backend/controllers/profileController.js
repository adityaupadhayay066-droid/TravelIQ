const { User, Trip, Booking, Analytics, UserActivityLog } = require('../models');
const n8nService = require('../services/n8nService');
const { sendBookingConfirmation } = require('../services/emailService');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// GET /api/profile — Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Trip, attributes: ['id'], limit: 1 },
      ]
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const tripCount = await Trip.count({ where: { user_id: req.user.id } });
    const bookingCount = await Booking.count({ where: { user_id: req.user.id } });
    const analytics = await Analytics.findOne({ where: { user_id: req.user.id } });

    res.json({
      ...user.toSafeObject(),
      stats: {
        total_trips: tripCount,
        total_bookings: bookingCount,
        money_saved: analytics?.total_saved_money || 0,
        time_saved: analytics?.total_saved_time || 0,
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

// PUT /api/profile — Update profile details
const updateProfile = async (req, res) => {
  try {
    const { name, phone, bio, location } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (phone !== undefined) user.phone_number = phone;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;

    await user.save();
    res.json({ message: 'Profile updated', user: user.toSafeObject() });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

// POST /api/profile/avatar — Upload profile image
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Delete old avatar if exists
    if (user.profile_image) {
      const oldPath = path.join(__dirname, '..', user.profile_image);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Store relative path
    const relativePath = `/uploads/avatars/${req.file.filename}`;
    user.profile_image = relativePath;
    await user.save();

    res.json({ message: 'Avatar updated', profile_image: relativePath });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: 'Error uploading avatar' });
  }
};

// DELETE /api/profile/avatar — Remove profile image
const removeAvatar = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.profile_image) {
      const filePath = path.join(__dirname, '..', user.profile_image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      user.profile_image = null;
      await user.save();
    }

    res.json({ message: 'Avatar removed' });
  } catch (error) {
    console.error('Remove avatar error:', error);
    res.status(500).json({ message: 'Error removing avatar' });
  }
};

const axios = require('axios');
const crypto = require('crypto');

async function checkPwnedPassword(password) {
    const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    try {
        const response = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`);
        const lines = response.data.split('\n');
        for (const line of lines) {
            if (line.startsWith(suffix)) {
                return true; // Password found in breach
            }
        }
    } catch (err) {
        console.error('HaveIBeenPwned API check failed:', err);
    }
    return false;
}

// PUT /api/profile/password — Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new password are required' });
    }

    const isPwned = await checkPwnedPassword(newPassword);
    if (isPwned) {
        return res.status(400).json({ message: 'This password was found in a data breach. Please choose a different one.' });
    }

    // Check if strong password policy is enforced
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
      if (!strongRegex.test(newPassword)) {
        return res.status(400).json({ message: 'Strong password required: minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character.' });
      }
    } else {
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters' });
      }
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword; // Will be hashed by beforeUpdate hook
    await user.save();

    await UserActivityLog.create({
        user_id: user.id,
        event_type: 'PASSWORD_CHANGE',
        ip_address: req.ip || '127.0.0.1'
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Error changing password' });
  }
};

// PUT /api/profile/theme — Update theme preference
const updateTheme = async (req, res) => {
  try {
    const { theme } = req.body;
    if (!['dark', 'light', 'system'].includes(theme)) {
      return res.status(400).json({ message: 'Invalid theme. Use: dark, light, or system' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.theme_preference = theme;
    await user.save();
    res.json({ message: 'Theme updated', theme });
  } catch (error) {
    console.error('Update theme error:', error);
    res.status(500).json({ message: 'Error updating theme' });
  }
};

// POST /api/profile/deactivate — Deactivate account
const deactivateAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });

    user.account_status = 'deactivated';
    await user.save();
    res.json({ message: 'Account deactivated. You can reactivate by logging in again.' });
  } catch (error) {
    console.error('Deactivate error:', error);
    res.status(500).json({ message: 'Error deactivating account' });
  }
};

// DELETE /api/profile — Permanently delete account
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });

    // Delete all related data
    await Trip.destroy({ where: { user_id: req.user.id } });
    await Booking.destroy({ where: { user_id: req.user.id } });
    await Analytics.destroy({ where: { user_id: req.user.id } });

    // Delete avatar file
    if (user.profile_image) {
      const filePath = path.join(__dirname, '..', user.profile_image);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await user.destroy();
    res.json({ message: 'Account permanently deleted' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Error deleting account' });
  }
};

// GET /api/profile/trips — Get user's trip history
const getTrips = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const sort = req.query.sort || 'created_at';
    const order = req.query.order === 'asc' ? 'ASC' : 'DESC';

    const { count, rows } = await Trip.findAndCountAll({
      where: { user_id: req.user.id },
      order: [[sort, order]],
      limit,
      offset
    });

    res.json({
      trips: rows,
      pagination: {
        total: count,
        page,
        pages: Math.ceil(count / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({ message: 'Error fetching trips' });
  }
};

// GET /api/profile/bookings — Get user's bookings
const getBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Booking.findAndCountAll({
      where: { user_id: req.user.id },
      include: [{ model: Trip }],
      order: [['booking_date', 'DESC']],
      limit,
      offset
    });

    res.json({
      bookings: rows,
      pagination: {
        total: count,
        page,
        pages: Math.ceil(count / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
};

// POST /api/profile/bookings — Create a new user booking
const createBooking = async (req, res) => {
  const { 
    trip_id = 1,
    source_station_code = 'SRC',
    destination_station_code = 'DST',
    train_number = '00000',
    travel_class = 'SL',
    ticket_fare = 1000,
    booking_date,
    passengers = [],
    seat_preference = 'No Preference',
    berth_preference = 'No Preference',
    adult_count = 1,
    child_count = 0,
    infant_count = 0,
    senior_count = 0,
    total_passengers = 1
  } = req.body;

  try {
    console.log(`[Backend] Creating new Trip for booking to satisfy foreign key...`);
    const newTrip = await Trip.create({
      user_id: req.user.id,
      source: source_station_code,
      destination: destination_station_code,
      departure_date: booking_date || new Date(),
      travel_mode: 'Train',
      predicted_price: ticket_fare,
      predicted_time: 12
    });
    const finalTripId = newTrip.id;

    const booking = await Booking.create({
      user_id: req.user.id,
      trip_id: finalTripId,
      source_station_code,
      destination_station_code,
      train_number,
      travel_class,
      ticket_fare,
      booking_date: booking_date || new Date(),
      passengers,
      seat_preference,
      berth_preference,
      adult_count,
      child_count,
      infant_count,
      senior_count,
      total_passengers
    });

    // Trigger dynamic analytics sync
    if (Analytics) {
      try {
        let userAnalytics = await Analytics.findOne({ where: { user_id: req.user.id } });
        if (!userAnalytics) {
          userAnalytics = await Analytics.create({
            user_id: req.user.id,
            route_accuracy: 94.5,
            ai_prediction_score: 98.2,
            total_saved_money: 0,
            total_saved_time: 0
          });
        }
        userAnalytics.total_saved_money = parseFloat(userAnalytics.total_saved_money) + Math.round(ticket_fare * 0.12);
        userAnalytics.total_saved_time = parseFloat(userAnalytics.total_saved_time) + 1.5;
        await userAnalytics.save();
      } catch (err) {
        console.error('Failed to sync analytics on booking:', err.message);
      }
    }

    // 1. Dispatch Email & Simulated SMS Booking Confirmation
    sendBookingConfirmation({ user: req.user, booking }).catch(err => {
      console.error('[ProfileController] Booking confirmation notification error:', err.message);
    });

    // 2. Trigger n8n Automation asynchronously for AI journey briefing & notifications
    n8nService.triggerBookingWebhook(booking, req.user).catch(err => {
      console.error('[ProfileController] n8n booking webhook error:', err.message);
    });

    res.status(201).json({ message: 'Booking confirmed successfully.', booking });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/profile/bookings/:id/cancel — Cancel a user's booking
const cancelBooking = async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await Booking.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found or not authorized.' });
    }

    booking.booking_status = 'Cancelled';
    booking.payment_status = 'Refunded';
    await booking.save();

    // Trigger dynamic analytics sync for negative revenue / subtraction
    if (Analytics) {
      try {
        let userAnalytics = await Analytics.findOne({ where: { user_id: req.user.id } });
        if (userAnalytics) {
          userAnalytics.total_saved_money = Math.max(0, parseFloat(userAnalytics.total_saved_money) - Math.round(booking.ticket_fare * 0.12));
          userAnalytics.total_saved_time = Math.max(0, parseFloat(userAnalytics.total_saved_time) - 1.5);
          await userAnalytics.save();
        }
      } catch (err) {
        console.error('Failed to sync analytics on cancel:', err.message);
      }
    }

    res.json({ message: 'Reservation cancelled & refund initiated.', booking });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Error cancelling booking' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  removeAvatar,
  changePassword,
  updateTheme,
  deactivateAccount,
  deleteAccount,
  getTrips,
  getBookings,
  createBooking,
  cancelBooking
};

