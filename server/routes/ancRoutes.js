const express = require('express');
const router = express.Router();
const { getANCVisits, getANCVisitById, createANCVisit } = require('../controllers/ancController');
const { protect, restrictRecordsOfficerClinicalEdits } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getANCVisits)
    .post(restrictRecordsOfficerClinicalEdits, createANCVisit);

router.get('/:id', getANCVisitById);

module.exports = router;
