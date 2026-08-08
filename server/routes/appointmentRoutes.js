const express = require('express');
const router = express.Router();
const { getAppointments, createAppointment, updateAppointmentStatus } = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getAppointments)
    .post(createAppointment);

router.patch('/:id/status', updateAppointmentStatus);

module.exports = router;
