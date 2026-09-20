const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getFavorites,
  createFavorite,
  deleteFavorite,
  getRewards,
  getNotifications,
  getWeather
} = require('../controllers/userController');
const { createTicket, getUserTickets } = require('../controllers/supportController');

// All endpoints protected under user token verification
router.use(protect);

router.get('/favorites', getFavorites);
router.post('/favorites', createFavorite);
router.delete('/favorites/:id', deleteFavorite);

router.get('/rewards', getRewards);
router.get('/notifications', getNotifications);
router.get('/weather', getWeather);

// Customer Support Tickets
router.post('/tickets', createTicket);
router.get('/tickets', getUserTickets);

module.exports = router;
