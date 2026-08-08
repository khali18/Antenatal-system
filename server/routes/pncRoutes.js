const express = require('express');
const router = express.Router();
const { getPNCVisits, getPNCVisitById, createPNCVisit } = require('../controllers/pncController');
const { protect, restrictRecordsOfficerClinicalEdits } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getPNCVisits)
    .post(restrictRecordsOfficerClinicalEdits, createPNCVisit);

router.get('/:id', getPNCVisitById);

module.exports = router;
