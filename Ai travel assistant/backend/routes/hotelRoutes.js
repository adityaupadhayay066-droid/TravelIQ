const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const { protect, adminProtect } = require('../middleware/authMiddleware');

router.get('/search', hotelController.searchHotels);
router.get('/cities', hotelController.getHotelCities);
router.post('/reserve', protect, hotelController.reserveStay);
router.get('/reservations', protect, hotelController.getReservations);
router.get('/reservations/:id', protect, hotelController.getReservationById);
router.post('/reservations/:id/cancel', protect, hotelController.cancelReservation);
router.post('/reservations/:id/verify-kyc', adminProtect, hotelController.verifyKyc);

module.exports = router;
