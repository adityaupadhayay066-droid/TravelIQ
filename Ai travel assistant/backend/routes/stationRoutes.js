const express = require('express');
const router = express.Router();
const { optionalProtect } = require('../middleware/authMiddleware');
const { getStation3DModel, getStationNavigation } = require('../controllers/stationController');

router.get('/3d', optionalProtect, getStation3DModel);
router.all('/navigation', optionalProtect, getStationNavigation); // Support GET and POST

module.exports = router;
