const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
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

// All routes are protected
router.use(protect);

router.get('/', getProfile);
router.put('/', updateProfile);
router.post('/avatar', upload.single('avatar'), uploadAvatar);
router.delete('/avatar', removeAvatar);
router.put('/password', changePassword);
router.put('/theme', updateTheme);
router.post('/deactivate', deactivateAccount);
router.delete('/', deleteAccount);
router.get('/trips', getTrips);
router.get('/bookings', getBookings);
router.post('/bookings', createBooking);
router.put('/bookings/:id/cancel', cancelBooking);

module.exports = router;

