const { FavoriteRoute, UserLoyalty, Station } = require('../models');
const crypto = require('crypto');

/**
 * Fetch favorited routes for bookmarked list
 */
const getFavorites = async (req, res) => {
  try {
    const favorites = await FavoriteRoute.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']]
    });
    res.json(favorites);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Failed to retrieve saved routes' });
  }
};

/**
 * Bookmark a new station route pair
 */
const createFavorite = async (req, res) => {
  const { source_code, dest_code, source_name, dest_name } = req.body;
  try {
    if (!source_code || !dest_code || !source_name || !dest_name) {
      return res.status(400).json({ message: 'Station codes and names are required.' });
    }

    const existing = await FavoriteRoute.findOne({
      where: { user_id: req.user.id, source_code, dest_code }
    });

    if (existing) {
      return res.status(400).json({ message: 'Route already favorited.' });
    }

    const favorite = await FavoriteRoute.create({
      user_id: req.user.id,
      source_code,
      dest_code,
      source_name,
      dest_name
    });

    res.status(201).json({ message: 'Route favorited successfully!', favorite });
  } catch (error) {
    console.error('Create favorite error:', error);
    res.status(500).json({ message: 'Failed to save favorite route' });
  }
};

/**
 * Remove a favorited route
 */
const deleteFavorite = async (req, res) => {
  const { id } = req.params;
  try {
    const favorite = await FavoriteRoute.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!favorite) {
      return res.status(404).json({ message: 'Saved route not found.' });
    }

    await favorite.destroy();
    res.json({ message: 'Route removed from bookmarks.' });
  } catch (error) {
    console.error('Delete favorite error:', error);
    res.status(500).json({ message: 'Failed to remove favorite route' });
  }
};

/**
 * Fetch and sync user loyalty points/levels
 */
const getRewards = async (req, res) => {
  try {
    let loyalty = await UserLoyalty.findOne({ where: { user_id: req.user.id } });

    if (!loyalty) {
      const randomCode = 'TIQ-' + crypto.randomBytes(3).toString('hex').toUpperCase();
      loyalty = await UserLoyalty.create({
        user_id: req.user.id,
        referral_code: randomCode,
        rewards_points: 250,
        level: 'Bronze Explorer'
      });
    }

    res.json(loyalty);
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({ message: 'Failed to retrieve loyalty profile' });
  }
};

/**
 * Fetch simulated live notifications (delay, weather, fare alerts)
 */
const getNotifications = async (req, res) => {
  try {
    const alerts = [
      {
        id: 1,
        type: 'delay',
        title: 'Train Delay Alert',
        message: 'Rajdhani Express (12301) is running 15 minutes late from New Delhi.',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        unread: true
      },
      {
        id: 2,
        type: 'fare',
        title: 'Price Increase Warning',
        message: 'Fares on TCR to TCR routes expected to jump 12% tomorrow due to high demand.',
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
        unread: true
      },
      {
        id: 3,
        type: 'weather',
        title: 'Destination Weather Warning',
        message: 'Thunderstorms and heavy rain reported at SBC destination. Pack an umbrella!',
        timestamp: new Date(Date.now() - 1000 * 60 * 120),
        unread: false
      }
    ];

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

/**
 * Station weather advisor
 */
const getWeather = async (req, res) => {
  const { stationCode } = req.query;
  try {
    const weatherPool = [
      { temp: '28°C', condition: 'Thunderstorm', advisory: '⚠️ Heavy rain alerts. Expect minor platform changes.' },
      { temp: '32°C', condition: 'Cloudy', advisory: '🌤️ High humidity. Perfect travel conditions.' },
      { temp: '35°C', condition: 'Sunny', advisory: '☀️ Clear skies. Stay hydrated!' },
      { temp: '24°C', condition: 'Showers', advisory: '🌧️ Intermittent rain. Possible localized delays.' }
    ];

    const codeSum = (stationCode || 'NDLS').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const mockWeather = weatherPool[codeSum % weatherPool.length];

    res.json({
      station: stationCode || 'NDLS',
      ...mockWeather,
      forecast: [
        { day: 'Tomorrow', temp: mockWeather.temp, cond: mockWeather.condition },
        { day: 'Day 3', temp: '29°C', cond: 'Cloudy' },
        { day: 'Day 4', temp: '31°C', cond: 'Sunny' }
      ]
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve weather reports' });
  }
};

module.exports = {
  getFavorites,
  createFavorite,
  deleteFavorite,
  getRewards,
  getNotifications,
  getWeather
};
