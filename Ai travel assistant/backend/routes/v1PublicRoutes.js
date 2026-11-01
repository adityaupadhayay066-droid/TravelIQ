const express = require('express');
const router = express.Router();
const { requireApiKey } = require('../middleware/apiKeyMiddleware');
const aiService = require('../services/aiService');

// All endpoints in this router are secured with X-API-Key and metered for billing
router.use(requireApiKey);

/**
 * Health check & Key Validation
 * GET /api/v1/public/ping
 */
router.get('/ping', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TravelIQ API Key authenticated successfully',
    organization: req.organization.name,
    plan_tier: req.organization.plan_tier,
    quota_limit: req.organization.monthly_quota,
    quota_remaining: Math.max(0, req.organization.monthly_quota - req.organization.used_quota),
    timestamp: new Date().toISOString()
  });
});

/**
 * Delay Prediction API
 * POST /api/v1/public/predict-delay
 */
router.post('/predict-delay', async (req, res) => {
  try {
    const trainNumber = req.body.train_number || req.body.trainNumber;
    const route = req.body.route;
    const weather = req.body.weather;
    const dayOfWeek = req.body.day_of_week || req.body.dayOfWeek;

    if (!trainNumber) {
      return res.status(400).json({ success: false, error: 'Missing required field: train_number' });
    }

    const payload = {
      train_number: trainNumber,
      route,
      weather,
      day_of_week: dayOfWeek
    };

    const prediction = await aiService.predictDelay(payload);
    return res.status(200).json({
      success: true,
      data: prediction
    });
  } catch (err) {
    console.error('[Public API: predictDelay Error]:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to process delay prediction' });
  }
});

/**
 * Fare Forecast API
 * POST /api/v1/public/predict-fare
 */
router.post('/predict-fare', async (req, res) => {
  try {
    const source = req.body.source;
    const destination = req.body.destination;
    const travelClass = req.body.travel_class || req.body.travelClass;
    const travelDate = req.body.travel_date || req.body.travelDate;

    if (!source || !destination) {
      return res.status(400).json({ success: false, error: 'Missing required fields: source, destination' });
    }

    const payload = {
      source,
      destination,
      travel_class: travelClass,
      travel_date: travelDate
    };

    const forecast = await aiService.predictFare(payload);
    return res.status(200).json({
      success: true,
      data: forecast
    });
  } catch (err) {
    console.error('[Public API: predictFare Error]:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to process fare forecast' });
  }
});

/**
 * Crowd & Occupancy Prediction API
 * POST /api/v1/public/predict-crowd
 */
router.post('/predict-crowd', async (req, res) => {
  try {
    const stationCode = req.body.station_code || req.body.stationCode;
    const trainNumber = req.body.train_number || req.body.trainNumber;
    const timeSlot = req.body.time_slot || req.body.timeSlot;

    if (!stationCode && !trainNumber) {
      return res.status(400).json({ success: false, error: 'Must provide either station_code or train_number' });
    }

    const payload = {
      station_code: stationCode,
      train_number: trainNumber,
      time_slot: timeSlot
    };

    const prediction = await aiService.predictCrowd(payload);
    return res.status(200).json({
      success: true,
      data: prediction
    });
  } catch (err) {
    console.error('[Public API: predictCrowd Error]:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to process crowd prediction' });
  }
});

/**
 * Route Optimization API (Developer Portal Endpoint)
 * POST /api/v1/public/optimize-route
 */
router.post('/optimize-route', async (req, res) => {
  try {
    const source = req.body.source;
    const destination = req.body.destination;
    const preference = req.body.preference || req.body.preferences || 'time';

    if (!source || !destination) {
      return res.status(400).json({ success: false, error: 'Missing source or destination' });
    }

    const payload = { source, destination, preference };
    const result = await aiService.optimizeRoute(payload);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('[Public API: optimizeRoute Error]:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to process route optimization' });
  }
});

/**
 * Intelligent Route Recommendation API (NCF Recommender)
 * POST /api/v1/public/recommend-route
 */
router.post('/recommend-route', async (req, res) => {
  try {
    const { source, destination, preferences } = req.body;
    if (!source || !destination) {
      return res.status(400).json({ success: false, error: 'Missing source or destination' });
    }

    const recommendation = await aiService.recommendRoute(req.body);
    return res.status(200).json({
      success: true,
      data: recommendation
    });
  } catch (err) {
    console.error('[Public API: recommendRoute Error]:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to process route recommendation' });
  }
});

/**
 * Food & Culinary Recommendation API
 * POST /api/v1/public/recommend-food
 */
router.post('/recommend-food', async (req, res) => {
  try {
    const destination = req.body.destination;
    const dietaryPref = req.body.dietary_pref || req.body.dietaryPref;
    const budget = req.body.budget;

    if (!destination) {
      return res.status(400).json({ success: false, error: 'Missing destination' });
    }

    const foodRecs = await aiService.recommendFood({
      destination,
      dietary_pref: dietaryPref,
      budget
    });
    return res.status(200).json({
      success: true,
      data: foodRecs
    });
  } catch (err) {
    console.error('[Public API: recommendFood Error]:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to process food recommendations' });
  }
});

module.exports = router;
