const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');

router.get('/search', hotelController.searchHotels);
router.get('/cities', hotelController.getHotelCities);
router.post('/reserve', hotelController.reserveStay);
router.get('/reservations', hotelController.getReservations);

module.exports = router;
