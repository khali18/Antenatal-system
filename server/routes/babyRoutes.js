const express = require('express');
const router = express.Router();
const { getBabies, getBabyById, createBaby } = require('../controllers/babyController');
const { protect, restrictRecordsOfficerClinicalEdits } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getBabies)
    .post(restrictRecordsOfficerClinicalEdits, createBaby);

router.get('/:id', getBabyById);

module.exports = router;
