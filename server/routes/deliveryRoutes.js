const express = require('express');
const router = express.Router();
const { getDeliveries, getDeliveryById, createDelivery } = require('../controllers/deliveryController');
const { protect, restrictRecordsOfficerClinicalEdits } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getDeliveries)
    .post(restrictRecordsOfficerClinicalEdits, createDelivery);

router.get('/:id', getDeliveryById);

module.exports = router;
