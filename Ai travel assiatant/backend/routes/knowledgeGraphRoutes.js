const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getGraphData } = require('../controllers/knowledgeGraphController');

router.get('/data', protect, getGraphData);

module.exports = router;
