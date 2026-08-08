const express = require('express');
const router = express.Router();
const { getMedicationRecords, createMedicationRecord } = require('../controllers/medicationController');
const { protect, restrictRecordsOfficerClinicalEdits } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getMedicationRecords)
    .post(restrictRecordsOfficerClinicalEdits, createMedicationRecord);

module.exports = router;
