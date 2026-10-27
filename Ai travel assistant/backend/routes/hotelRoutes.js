const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const { protect } = require('../middleware/authMiddleware');

router.get('/search', hotelController.searchHotels);
router.get('/cities', hotelController.getHotelCities);
router.post('/reserve', protect, hotelController.reserveStay);
router.get('/reservations', protect, hotelController.getReservations);
router.get('/reservations/:id', protect, hotelController.getReservationById);

module.exports = router;
