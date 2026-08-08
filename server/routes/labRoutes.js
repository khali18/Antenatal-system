const express = require('express');
const router = express.Router();
const { getLabRecords, createLabRecord } = require('../controllers/labController');
const { protect, restrictRecordsOfficerClinicalEdits } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getLabRecords)
    .post(restrictRecordsOfficerClinicalEdits, createLabRecord);

module.exports = router;
