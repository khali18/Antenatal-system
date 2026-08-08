const express = require('express');
const router = express.Router();
const { getNotifications } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getNotifications);

module.exports = router;
