const express = require('express');
const router = express.Router();
const { getPregnancies, createPregnancy, updatePregnancy } = require('../controllers/pregnancyController');
const { protect, restrictRecordsOfficerClinicalEdits } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getPregnancies)
    .post(restrictRecordsOfficerClinicalEdits, createPregnancy);

router.route('/:id')
    .put(restrictRecordsOfficerClinicalEdits, updatePregnancy);

module.exports = router;
