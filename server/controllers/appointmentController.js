const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const { logAuditAction } = require('../utils/auditLogger');

// Generate Appointment ID (APT-2026-0001)
const generateAppointmentId = async () => {
    const currentYear = new Date().getFullYear();
    const count = await Appointment.countDocuments();
    const nextNum = (count + 1).toString().padStart(4, '0');
    return `APT-${currentYear}-${nextNum}`;
};

// Auto update missed appointments helper
const autoMarkMissedAppointments = async () => {
    const yesterdayEnd = new Date();
    yesterdayEnd.setHours(0, 0, 0, 0);

    await Appointment.updateMany(
        {
            appointmentDate: { $lt: yesterdayEnd },
            status: 'Upcoming',
        },
        {
            $set: { status: 'Missed' },
        }
    );
};

// @desc    Get all appointments with filters (by date, type, status, today, upcoming, missed)
// @route   GET /api/appointments
// @access  Private
exports.getAppointments = async (req, res, next) => {
    try {
        await autoMarkMissedAppointments();

        const { patientId, type, status, filterDate, range } = req.query;
        const query = {};

        if (patientId) query.patientId = patientId;
        if (type) query.type = type;
        if (status) query.status = status;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        if (range === 'today') {
            query.appointmentDate = { $gte: todayStart, $lte: todayEnd };
        } else if (range === 'tomorrow') {
            const tomorrowStart = new Date(todayStart);
            tomorrowStart.setDate(tomorrowStart.getDate() + 1);
            const tomorrowEnd = new Date(todayEnd);
            tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
            query.appointmentDate = { $gte: tomorrowStart, $lte: tomorrowEnd };
        } else if (range === 'upcoming') {
            query.appointmentDate = { $gte: todayStart };
            query.status = 'Upcoming';
        } else if (range === 'missed') {
            query.status = 'Missed';
        } else if (filterDate) {
            const dStart = new Date(filterDate);
            dStart.setHours(0, 0, 0, 0);
            const dEnd = new Date(filterDate);
            dEnd.setHours(23, 59, 59, 999);
            query.appointmentDate = { $gte: dStart, $lte: dEnd };
        }

        const appointments = await Appointment.find(query)
            .populate('patient', 'fullName patientId phone medicalRecordNumber')
            .sort({ appointmentDate: 1, appointmentTime: 1 });

        res.status(200).json({ success: true, count: appointments.length, appointments });
    } catch (error) {
        next(error);
    }
};

// @desc    Schedule new appointment
// @route   POST /api/appointments
// @access  Private
exports.createAppointment = async (req, res, next) => {
    try {
        const { patientId, type, appointmentDate, appointmentTime, reason, notes } = req.body;

        if (!patientId || !type || !appointmentDate) {
            return res.status(400).json({
                success: false,
                message: 'Please provide Patient ID, Appointment Type, and Appointment Date.',
            });
        }

        const patient = await Patient.findOne({
            $or: [{ patientId }, { _id: patientId.match(/^[0-9a-fA-F]{24}$/) ? patientId : null }],
        });

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        const appointmentId = await generateAppointmentId();

        const appointment = await Appointment.create({
            appointmentId,
            patient: patient._id,
            patientId: patient.patientId,
            type,
            appointmentDate: new Date(appointmentDate),
            appointmentTime: appointmentTime || '09:00 AM',
            reason,
            notes,
            assignedStaff: req.user.id,
            assignedStaffName: req.user.fullName,
            status: 'Upcoming',
            recordedBy: req.user.id,
        });

        await logAuditAction({
            user: req.user,
            req,
            action: 'APPOINTMENT_CREATE',
            module: 'Appointments',
            recordId: appointment.appointmentId,
            description: `Scheduled ${type} appointment (${appointment.appointmentId}) for patient '${patient.fullName}' on ${appointment.appointmentDate.toISOString().split('T')[0]}.`,
        });

        res.status(201).json({
            success: true,
            message: 'Appointment scheduled successfully',
            appointment,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update appointment status (Completed, Missed, Cancelled)
// @route   PATCH /api/appointments/:id/status
// @access  Private
exports.updateAppointmentStatus = async (req, res, next) => {
    try {
        const { status, notes } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        appointment.status = status;
        if (notes) appointment.notes = notes;
        await appointment.save();

        await logAuditAction({
            user: req.user,
            req,
            action: 'APPOINTMENT_STATUS_CHANGE',
            module: 'Appointments',
            recordId: appointment.appointmentId,
            description: `Updated status of appointment ${appointment.appointmentId} to '${status}'.`,
        });

        res.status(200).json({
            success: true,
            message: `Appointment status updated to ${status}`,
            appointment,
        });
    } catch (error) {
        next(error);
    }
};
