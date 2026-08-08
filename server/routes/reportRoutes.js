const express = require('express');
const router = express.Router();
const { getDashboardStats, exportCSV } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/dashboard-stats', getDashboardStats);
router.get('/export-csv/:type', exportCSV);

module.exports = router;
