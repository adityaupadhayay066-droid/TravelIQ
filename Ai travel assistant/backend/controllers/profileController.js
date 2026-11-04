const crypto = require('crypto');
const { User, Trip, Booking, Analytics, UserActivityLog, Train, TrainSchedule, TrainFare, Session, RefreshToken, Station, Transaction, IdempotencyKey, sequelize } = require('../models');
const { Op } = require('sequelize');
const { generateBookingReference, transitionBookingState, BOOKING_STATUSES, PAYMENT_STATUSES, expirePendingBookings } = require('../services/bookingLifecycleService');
const n8nService = require('../services/n8nService');
const { sendBookingConfirmation } = require('../services/emailService');
const { calculateRailwayFare, estimateRailDistance } = require('../utils/railwayFareCalculator');
const { trainRunsOnDate } = require('../services/routeValidationEngine');
const { resolveStation } = require('../services/stationResolver');
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

// Safe avatar file deletion helper — prevents directory traversal and arbitrary file deletion
function safelyDeleteAvatarFile(avatarPath) {
  if (!avatarPath || typeof avatarPath !== 'string') return;
  const avatarDir = path.resolve(__dirname, '..', 'uploads', 'avatars');
  const safeFilename = path.basename(avatarPath);
  const targetPath = path.resolve(avatarDir, safeFilename);
  // Ensure the target path is strictly within the avatar directory
  if (targetPath.startsWith(avatarDir) && fs.existsSync(targetPath)) {
    try {
      fs.unlinkSync(targetPath);
    } catch (err) {
      console.warn('[Avatar Cleanup Warning]:', err.message);
    }
  }
}

// POST /api/profile/avatar — Upload profile image
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Safely delete old avatar if exists
    if (user.profile_image) {
      safelyDeleteAvatarFile(user.profile_image);
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
      safelyDeleteAvatarFile(user.profile_image);
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

    // Enforce consistent, strong password policy (min 10 chars, uppercase, lowercase, number, symbol)
    let minLength = 10;
    try {
      const settingsPath = path.join(__dirname, '../config/security_settings.json');
      if (fs.existsSync(settingsPath)) {
        const raw = fs.readFileSync(settingsPath);
        const settings = JSON.parse(raw);
        if (settings.min_password_length) minLength = settings.min_password_length;
      }
    } catch (err) {
      console.error("Failed to read security settings:", err);
    }

    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+={}\[\]:;<>,.?\/~`|\\-]).{10,}$/;
    if (!strongRegex.test(newPassword) || newPassword.length < minLength) {
      return res.status(400).json({
        message: `Strong password required: minimum ${minLength} characters, with at least one uppercase letter, one lowercase letter, one number, and one special character.`
      });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword; // Will be hashed by beforeUpdate hook
    await user.save();

    // Revoke all other active sessions and refresh tokens
    const currentSessionId = req.sessionId;
    if (currentSessionId) {
      await Session.destroy({
        where: {
          user_id: user.id,
          session_id: { [Op.ne]: currentSessionId }
        }
      });
    } else {
      await Session.destroy({ where: { user_id: user.id } });
    }
    await RefreshToken.destroy({ where: { user_id: user.id } });

    await UserActivityLog.create({
        user_id: user.id,
        event_type: 'PASSWORD_CHANGE',
        ip_address: req.ip || '127.0.0.1'
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error.message);
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
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const allowedSortFields = ['id', 'trip_name', 'source', 'destination', 'travel_date', 'status', 'created_at'];
    const sort = allowedSortFields.includes(req.query.sort) ? req.query.sort : 'created_at';
    const order = String(req.query.order || '').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

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

const SUPPORTED_CLASSES = ['1A', '2A', '3A', '3E', 'SL', 'CC', 'EC', '2S', 'COMBINED', 'STANDARD', 'UR', 'GENERAL'];

// POST /api/profile/bookings — Create a new user booking with authoritative fare calculation
const createBooking = async (req, res) => {
  const { 
    source_station_code = 'NDLS',
    destination_station_code = 'CSTM',
    train_number = '12951',
    travel_class = '3A',
    ticket_fare,
    booking_date,
    passengers = [],
    seat_preference = 'No Preference',
    berth_preference = 'No Preference',
    adult_count,
    child_count,
    infant_count,
    senior_count,
    total_passengers
  } = req.body;

  try {
    // 0. Transport type validation
    const rawTransport = req.body.transport_type || req.body.travel_mode || 'Train';
    const transportType = String(rawTransport).trim();
    if (transportType.toLowerCase() !== 'train') {
      return res.status(400).json({
        message: `Direct ticketing is currently supported for Trains only. Direct booking for '${transportType}' is unavailable.`
      });
    }

    // 0b. Journey date validation
    const rawDate = req.body.journey_date !== undefined ? req.body.journey_date : (req.body.departure_date !== undefined ? req.body.departure_date : booking_date);
    let journeyDate = null;
    if (rawDate !== undefined && rawDate !== null && rawDate !== '') {
      const dateStr = String(rawDate).slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return res.status(400).json({ message: 'Invalid journey_date format. Please use YYYY-MM-DD.' });
      }
      const parsedDate = new Date(dateStr + 'T00:00:00Z');
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: 'Invalid journey_date format.' });
      }
      const todayStr = new Date().toISOString().slice(0, 10);
      if (dateStr < todayStr) {
        return res.status(400).json({ message: 'Journey date cannot be in the past.' });
      }
      const maxDateStr = new Date(Date.now() + 120 * 86400000).toISOString().slice(0, 10);
      if (dateStr > maxDateStr) {
        return res.status(400).json({ message: 'Journey date cannot exceed the 120 days advance booking window (120-day limit).' });
      }
      journeyDate = dateStr;
    } else if (rawDate === '') {
      return res.status(400).json({ message: 'journey_date cannot be empty.' });
    } else {
      journeyDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    }

    // 0c. Strict Passenger validation & Count Derivation
    if (Array.isArray(req.body.passengers) && req.body.passengers.length === 0) {
      return res.status(400).json({ message: 'Booking must contain at least 1 passenger.' });
    }

    let rawPax = passengers;
    if (!rawPax || (Array.isArray(rawPax) && rawPax.length === 0)) {
      const pCount = Math.max(1, parseInt(total_passengers) || 1);
      rawPax = Array.from({ length: pCount }, (_, i) => ({
        name: req.user?.name || `Traveler ${i + 1}`,
        age: 30,
        gender: 'Male'
      }));
    }

    if (!Array.isArray(rawPax)) {
      return res.status(400).json({ message: 'Passenger list must be an array.' });
    }

    if (rawPax.length < 1 || rawPax.length > 10) {
      return res.status(400).json({ message: 'Invalid passenger count: between 1 and 10 travelers permitted per booking.' });
    }

    const validatedPassengers = [];
    for (let i = 0; i < rawPax.length; i++) {
      const p = rawPax[i];
      if (typeof p !== 'object' || p === null || Array.isArray(p)) {
        return res.status(400).json({ message: `Passenger #${i + 1} must be a valid passenger object.` });
      }
      if (typeof p.name !== 'string') {
        return res.status(400).json({ message: `Passenger #${i + 1} name must be a string.` });
      }
      const trimmedName = p.name.trim();
      if (trimmedName.length === 0) {
        return res.status(400).json({ message: `Passenger must have a valid non-empty name.` });
      }
      if (trimmedName.length > 100) {
        return res.status(400).json({ message: `Passenger #${i + 1} name cannot exceed 100 characters.` });
      }

      let ageNum = 30;
      if (p.age !== undefined && p.age !== null && p.age !== '') {
        ageNum = Number(p.age);
        if (!Number.isInteger(ageNum) || isNaN(ageNum)) {
          return res.status(400).json({ message: `Passenger #${i + 1} age must be an integer.` });
        }
        if (ageNum < 0 || ageNum > 125) {
          return res.status(400).json({ message: `Passenger age must be a valid age between 0 and 125.` });
        }
      }

      let gender = 'Male';
      if (p.gender !== undefined) {
        if (typeof p.gender !== 'string') {
          return res.status(400).json({ message: `Passenger #${i + 1} gender must be a string.` });
        }
        const gTrim = p.gender.trim();
        const allowedGenders = ['Male', 'Female', 'Other', 'M', 'F', 'O'];
        if (!allowedGenders.includes(gTrim)) {
          return res.status(400).json({ message: `Passenger #${i + 1} gender must be one of: ${allowedGenders.join(', ')}.` });
        }
        gender = gTrim;
      }

      validatedPassengers.push({
        name: trimmedName,
        age: ageNum,
        gender,
        seat_preference: p.seat_preference || seat_preference || 'No Preference',
        berth_preference: p.berth_preference || berth_preference || 'No Preference'
      });
    }

    // Derive passenger counts
    let derivedAdults = 0, derivedSeniors = 0, derivedChildren = 0, derivedInfants = 0;
    for (const p of validatedPassengers) {
      if (p.age >= 60) derivedSeniors++;
      else if (p.age >= 12) derivedAdults++;
      else if (p.age >= 5) derivedChildren++;
      else derivedInfants++;
    }

    if (adult_count !== undefined) {
      const clientAdults = Number(adult_count);
      if (clientAdults !== (derivedAdults + derivedSeniors) && clientAdults !== derivedAdults) {
        return res.status(400).json({ message: 'Client-supplied adult count does not match validated passenger list.' });
      }
    }
    if (child_count !== undefined && Number(child_count) !== derivedChildren) {
      return res.status(400).json({ message: 'Client-supplied child count does not match validated passenger list.' });
    }
    if (infant_count !== undefined && Number(infant_count) !== derivedInfants) {
      return res.status(400).json({ message: 'Client-supplied infant count does not match validated passenger list.' });
    }

    if (total_passengers !== undefined && total_passengers !== null && Number(total_passengers) !== validatedPassengers.length) {
      return res.status(400).json({ message: 'Passenger count mismatch between total_passengers and passenger list.' });
    }

    const passengerCount = validatedPassengers.length;

    // 0d. Idempotency Key Handling
    const headers = req.headers || {};
    const idempotencyKey = headers['idempotency-key'] || headers['x-idempotency-key'] || req.body?.idempotency_key;
    let requestHash = null;

    if (idempotencyKey) {
      const payloadToHash = {
        user_id: req.user.id,
        source: String(source_station_code || '').trim().toUpperCase(),
        destination: String(destination_station_code || '').trim().toUpperCase(),
        train: String(train_number || '').trim(),
        class: String(travel_class || '').trim().toUpperCase(),
        journey_date: journeyDate,
        passengers: validatedPassengers.map(p => ({ name: p.name.toLowerCase(), age: p.age }))
      };
      requestHash = crypto.createHash('sha256').update(JSON.stringify(payloadToHash)).digest('hex');

      const existingRecord = await IdempotencyKey.findOne({
        where: {
          user_id: req.user.id,
          operation: 'CREATE_BOOKING',
          idempotency_key: String(idempotencyKey)
        }
      });

      if (existingRecord) {
        if (existingRecord.request_hash === requestHash) {
          return res.status(existingRecord.response_status).json(existingRecord.response_body);
        } else {
          return res.status(409).json({
            message: 'Idempotency conflict: The provided idempotency key was previously used with a different request payload.'
          });
        }
      }
    }

    // 1. Station code validation & normalization
    let sourceCode = String(source_station_code || '').trim().toUpperCase();
    let destCode = String(destination_station_code || '').trim().toUpperCase();

    if (!sourceCode || !destCode) {
      return res.status(400).json({ message: 'Both source and destination station codes are required.' });
    }

    // 2. Authoritative station lookup with intelligent city/name resolution fallback
    let [stnSrc, stnDst] = await Promise.all([
      Station.findOne({ where: { station_code: sourceCode } }),
      Station.findOne({ where: { station_code: destCode } })
    ]);

    if (!stnSrc) {
      const resolved = await resolveStation(sourceCode);
      if (resolved?.primaryStationCode) {
        stnSrc = await Station.findOne({ where: { station_code: resolved.primaryStationCode } });
        if (stnSrc) {
          sourceCode = stnSrc.station_code;
        }
      }
      if (!stnSrc) {
        const { Op } = require('sequelize');
        stnSrc = await Station.findOne({
          where: {
            [Op.or]: [
              { station_name: sourceCode },
              { city: sourceCode }
            ]
          }
        });
        if (stnSrc) {
          sourceCode = stnSrc.station_code;
        }
      }
    }

    if (!stnDst) {
      const resolved = await resolveStation(destCode);
      if (resolved?.primaryStationCode) {
        stnDst = await Station.findOne({ where: { station_code: resolved.primaryStationCode } });
        if (stnDst) {
          destCode = stnDst.station_code;
        }
      }
      if (!stnDst) {
        const { Op } = require('sequelize');
        stnDst = await Station.findOne({
          where: {
            [Op.or]: [
              { station_name: destCode },
              { city: destCode }
            ]
          }
        });
        if (stnDst) {
          destCode = stnDst.station_code;
        }
      }
    }

    if (!stnSrc) {
      return res.status(400).json({ message: `Unknown origin station: ${sourceCode}` });
    }
    if (!stnDst) {
      return res.status(400).json({ message: `Unknown destination station: ${destCode}` });
    }

    if (sourceCode === destCode) {
      return res.status(400).json({ message: 'Origin and destination stations cannot be identical.' });
    }

    // 3. Travel class validation - reject unsupported classes without fallback
    const normalizedClass = String(travel_class || '').trim().toUpperCase();
    if (!SUPPORTED_CLASSES.includes(normalizedClass)) {
      return res.status(400).json({ 
        message: `Unsupported travel class: ${travel_class}. Supported classes are ${SUPPORTED_CLASSES.join(', ')}.` 
      });
    }

    // 4. Train number and route validation
    const normalizedTrain = String(train_number || '').trim();
    if (!normalizedTrain) {
      return res.status(400).json({ message: 'Train number is required.' });
    }

    const isConnectingTrain = normalizedTrain.includes('/');
    let targetTrainObj = null;

    if (!isConnectingTrain) {
      targetTrainObj = await Train.findOne({ where: { train_number: normalizedTrain } });
      
      // If train is not recognized in official directory
      if (!targetTrainObj) {
        if (normalizedTrain !== '99999') {
          return res.status(400).json({ 
            message: `Train #${normalizedTrain} is not recognized or does not exist in the official train directory.` 
          });
        }
      } else {
        // Resolve station clusters to verify train serves both origin and destination
        const sourceResolved = await resolveStation(sourceCode);
        const destResolved = await resolveStation(destCode);
        const srcCodes = sourceResolved?.stationCodes || [sourceCode];
        const dstCodes = destResolved?.stationCodes || [destCode];

        const [sourceStop, destStop] = await Promise.all([
          TrainSchedule.findOne({ where: { train_number: normalizedTrain, station_code: srcCodes } }),
          TrainSchedule.findOne({ where: { train_number: normalizedTrain, station_code: dstCodes } })
        ]);

        if (!sourceStop) {
          return res.status(400).json({ 
            message: `Train #${normalizedTrain} (${targetTrainObj.train_name}) does not serve origin station ${sourceCode}.` 
          });
        }
        if (!destStop) {
          return res.status(400).json({ 
            message: `Train #${normalizedTrain} (${targetTrainObj.train_name}) does not serve destination station ${destCode}.` 
          });
        }

        // Date verification: check operating days against journey date
        const dateToCheck = journeyDate || booking_date;
        if (dateToCheck && !trainRunsOnDate(targetTrainObj, dateToCheck)) {
          const runsOnStr = Array.isArray(targetTrainObj.runs_on) 
            ? targetTrainObj.runs_on.join(', ') 
            : (targetTrainObj.runs_on || 'Specific Days');
          return res.status(400).json({ 
            message: `Train #${normalizedTrain} (${targetTrainObj.train_name}) does not operate on ${dateToCheck}. Running days: ${runsOnStr}.` 
          });
        }
      }
    } else {
      // Connecting train validation: verify each sub-train exists
      const legs = normalizedTrain.split('/').map(s => s.trim()).filter(Boolean);
      for (const legTrainNo of legs) {
        const exists = await Train.findOne({ where: { train_number: legTrainNo } });
        if (!exists) {
          return res.status(400).json({
            message: `Connecting train leg #${legTrainNo} does not exist in the official directory.`
          });
        }
      }
    }

    // 5. Authoritatively calculate ticket fare from database
    let farePerPassenger = null;
    const fareRow = await TrainFare.findOne({
      where: {
        train_number: normalizedTrain,
        class_code: normalizedClass
      }
    });

    if (fareRow && fareRow.fare > 0) {
      farePerPassenger = fareRow.fare;
    } else if (isConnectingTrain) {
      // Authoritative connecting route fare calculation strictly across journey legs
      // Never trust client-supplied ticket_fare to prevent parameter tampering
      const legs = normalizedTrain.split('/').map(s => s.trim()).filter(Boolean);
      let legsSum = 0;
      for (const legTrainNo of legs) {
        const legFareRow = await TrainFare.findOne({
          where: {
            train_number: legTrainNo,
            ...(normalizedClass !== 'COMBINED' && normalizedClass !== 'STANDARD' ? { class_code: normalizedClass } : {})
          }
        });
        if (legFareRow && legFareRow.fare > 0) {
          legsSum += legFareRow.fare;
        } else {
          legsSum += 850;
        }
      }
      farePerPassenger = legsSum;
    } else {
      // Dynamic distance-based IRCTC telescopic fare calculation
      // Must NEVER substitute a fabricated 650 km default if stations lack coordinates
      if (!stnSrc.latitude || !stnSrc.longitude || !stnDst.latitude || !stnDst.longitude) {
        return res.status(400).json({ 
          message: 'Authoritative fare record not found and station coordinates are unavailable to calculate route distance.' 
        });
      }

      const distanceKm = estimateRailDistance(
        parseFloat(stnSrc.latitude),
        parseFloat(stnSrc.longitude),
        parseFloat(stnDst.latitude),
        parseFloat(stnDst.longitude)
      );

      if (!distanceKm || isNaN(distanceKm) || distanceKm <= 0) {
        return res.status(400).json({ message: 'Unable to calculate authoritative distance for the specified route.' });
      }

      const dynamicFare = calculateRailwayFare({
        distanceKm,
        travelClass: (normalizedClass === 'COMBINED' || normalizedClass === 'STANDARD') ? '3A' : normalizedClass,
        isSuperfast: true,
        passengers: 1
      });

      if (!dynamicFare || !dynamicFare.farePerPassenger || dynamicFare.farePerPassenger <= 0) {
        return res.status(400).json({ message: 'Fare calculation failed for requested train and travel class.' });
      }
      farePerPassenger = dynamicFare.farePerPassenger;
    }

    // Configurable Age-based fare: Infants (<5) travel free; others pay authoritative fare
    const payablePassengers = Math.max(1, derivedAdults + derivedSeniors + derivedChildren);
    const authoritativeFare = farePerPassenger * payablePassengers;

    if (isNaN(authoritativeFare) || authoritativeFare <= 0) {
      return res.status(400).json({ message: 'Invalid calculated ticket fare.' });
    }

    // 6. Atomic database creation within transaction boundaries
    const result = await sequelize.transaction(async (t) => {
      const trip = await Trip.create({
        user_id: req.user.id,
        source: sourceCode,
        destination: destCode,
        departure_date: journeyDate,
        travel_mode: 'Train',
        predicted_price: authoritativeFare,
        predicted_time: 12
      }, { transaction: t });

      let createdBooking = null;
      let bookingRef = null;

      // Safely retry on unique reference collision
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          bookingRef = generateBookingReference();
          createdBooking = await Booking.create({
            user_id: req.user.id,
            booking_reference: bookingRef,
            trip_id: trip.id,
            source_station_code: sourceCode,
            destination_station_code: destCode,
            train_number: normalizedTrain,
            travel_class: normalizedClass,
            ticket_fare: authoritativeFare,
            journey_date: journeyDate,
            transport_type: 'Train',
            idempotency_key: idempotencyKey || null,
            expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15-minute pending hold
            booking_date: new Date(),
            passengers: validatedPassengers,
            seat_preference,
            berth_preference,
            adult_count: derivedAdults + derivedSeniors,
            child_count: derivedChildren,
            infant_count: derivedInfants,
            senior_count: derivedSeniors,
            total_passengers: passengerCount,
            booking_status: 'Pending',
            payment_status: 'Unpaid'
          }, { transaction: t });
          break;
        } catch (insertErr) {
          if (insertErr.name === 'SequelizeUniqueConstraintError' &&
              insertErr.errors?.some(e => e.path === 'booking_reference')) {
            continue;
          }
          throw insertErr;
        }
      }

      if (!createdBooking) {
        throw new Error('Failed to generate a unique booking reference.');
      }

      const responseData = {
        message: 'Booking created successfully.',
        booking: createdBooking,
        booking_reference: createdBooking.booking_reference
      };

      if (idempotencyKey && requestHash) {
        try {
          await IdempotencyKey.create({
            idempotency_key: String(idempotencyKey),
            user_id: req.user.id,
            operation: 'CREATE_BOOKING',
            request_hash: requestHash,
            response_status: 201,
            response_body: responseData
          }, { transaction: t });
        } catch (idemErr) {
          if (idemErr.name === 'SequelizeUniqueConstraintError') {
            throw new Error('IDEMPOTENCY_CONCURRENCY_CONFLICT');
          }
          throw idemErr;
        }
      }

      return responseData;
    });

    // CRITICAL: No confirmation emails, n8n webhook, or analytics credits occur here.
    // Side effects only occur after server verifies successful payment.
    res.status(201).json(result);
  } catch (error) {
    if (error.message === 'IDEMPOTENCY_CONCURRENCY_CONFLICT') {
      const existing = await IdempotencyKey.findOne({
        where: { user_id: req.user.id, operation: 'CREATE_BOOKING', idempotency_key: String((req.headers && req.headers['idempotency-key']) || req.body?.idempotency_key) }
      });
      if (existing) {
        return res.status(existing.response_status).json(existing.response_body);
      }
    }
    console.error('Create booking error:', error.message);
    const status = error.statusCode || 500;
    const msg = error.statusCode ? error.message : 'Error processing booking. Please try again later.';
    res.status(status).json({ message: msg });
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

    if (booking.booking_status === 'Cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled.' });
    }

    if (booking.payment_status === 'Refunded') {
      return res.status(400).json({ message: 'Booking has already been cancelled and refunded.' });
    }

    const wasPaid = booking.payment_status === 'Paid';

    await sequelize.transaction(async (t) => {
      if (wasPaid) {
        await transitionBookingState({
          bookingId: booking.id,
          targetBookingStatus: 'Cancelled',
          targetPaymentStatus: 'Refund Pending',
          actor: { id: req.user.id, role: 'USER' },
          reason: 'User cancelled paid booking',
          existingTransaction: t
        });

        const txn = await Transaction.findOne({
          where: { booking_id: booking.id, status: 'Success' },
          lock: t.LOCK.UPDATE,
          transaction: t
        });

        if (txn) {
          txn.status = 'Refund Pending';
          await txn.save({ transaction: t });
        }
      } else {
        await transitionBookingState({
          bookingId: booking.id,
          targetBookingStatus: 'Cancelled',
          targetPaymentStatus: 'Unpaid',
          actor: { id: req.user.id, role: 'USER' },
          reason: 'User cancelled unpaid booking',
          existingTransaction: t
        });

        await Transaction.update(
          { status: 'Cancelled' },
          { where: { booking_id: booking.id, status: 'Pending' }, transaction: t }
        );
      }
    });

    // Trigger dynamic analytics sync for negative revenue / subtraction
    if (Analytics && wasPaid) {
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

    res.json({
      message: wasPaid 
        ? 'Reservation cancelled and refund initiated.' 
        : 'Reservation cancelled successfully. No refund required for unpaid booking.',
      booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error.message);
    res.status(error.statusCode || 500).json({ message: error.message || 'Error cancelling booking' });
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

