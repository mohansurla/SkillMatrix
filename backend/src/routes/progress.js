const express = require('express');
const router = express.Router();
const { getProgress, getOverview, getRankings } = require('../controllers/progressController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, getProgress);
router.get('/overview', authenticate, authorize('admin'), getOverview);
router.get('/rankings', authenticate, getRankings);

module.exports = router;
