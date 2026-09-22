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
    const { train_number, route, weather, day_of_week } = req.body;
    if (!train_number) {
      return res.status(400).json({ success: false, error: 'Missing required field: train_number' });
    }

    const prediction = await aiService.predictDelay(req.body);
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
    const { source, destination, travel_class, travel_date } = req.body;
    if (!source || !destination) {
      return res.status(400).json({ success: false, error: 'Missing required fields: source, destination' });
    }

    const forecast = await aiService.predictFare(req.body);
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
    const { station_code, train_number, time_slot } = req.body;
    if (!station_code && !train_number) {
      return res.status(400).json({ success: false, error: 'Must provide either station_code or train_number' });
    }

    const prediction = await aiService.predictCrowd(req.body);
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
 * Intelligent Route Recommendation API
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
    const { destination, dietary_pref, budget } = req.body;
    if (!destination) {
      return res.status(400).json({ success: false, error: 'Missing destination' });
    }

    const foodRecs = await aiService.recommendFood(req.body);
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
