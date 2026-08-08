const express = require('express');
const router = express.Router();
const {
    getPatients,
    getPatientById,
    getPatientFullProfile,
    createPatient,
    updatePatient,
    togglePatientStatus,
    deletePatient,
} = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getPatients).post(createPatient);
router.get('/:id', getPatientById);
router.get('/:id/full-profile', getPatientFullProfile);
router.put('/:id', updatePatient);
router.patch('/:id/status', togglePatientStatus);
router.delete('/:id', deletePatient);

module.exports = router;
