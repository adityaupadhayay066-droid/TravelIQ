const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const { profileLimiter, profileSensitiveLimiter } = require('../middleware/rateLimiter');
const {
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
} = require('../controllers/profileController');

// All routes are protected and subject to profile rate limiting
router.use(protect);
router.use(profileLimiter);

router.get('/', getProfile);
router.put('/', updateProfile);
router.post('/avatar', profileSensitiveLimiter, upload.single('avatar'), uploadAvatar);
router.delete('/avatar', profileSensitiveLimiter, removeAvatar);
router.put('/password', profileSensitiveLimiter, changePassword);
router.put('/theme', updateTheme);
router.post('/deactivate', profileSensitiveLimiter, deactivateAccount);
router.delete('/', profileSensitiveLimiter, deleteAccount);
router.get('/trips', getTrips);
router.get('/bookings', getBookings);
router.post('/bookings', createBooking);
router.put('/bookings/:id/cancel', cancelBooking);

module.exports = router;

