const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController');

router.get('/discover', foodController.discoverFood);
router.get('/restaurant/:id', foodController.getRestaurantDetails);

module.exports = router;
