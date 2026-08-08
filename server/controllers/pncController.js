const PNCVisit = require('../models/PNCVisit');
const Patient = require('../models/Patient');
const Delivery = require('../models/Delivery');
const Appointment = require('../models/Appointment');
const { logAuditAction } = require('../utils/auditLogger');

// Generate PNC Visit ID (PNC-2026-0001)
const generatePNCVisitId = async () => {
    const currentYear = new Date().getFullYear();
    const count = await PNCVisit.countDocuments();
    const nextNum = (count + 1).toString().padStart(4, '0');
    return `PNC-${currentYear}-${nextNum}`;
};

// @desc    Get PNC visits by Patient ID or Delivery ID
// @route   GET /api/pnc-visits
// @access  Private
exports.getPNCVisits = async (req, res, next) => {
    try {
        const { patientId, deliveryId } = req.query;
        const query = {};
        if (patientId) query.patientId = patientId;
        if (deliveryId) query.deliveryId = deliveryId;

        const visits = await PNCVisit.find(query)
            .populate('patient', 'fullName patientId phone dob')
            .populate('delivery')
            .populate('recordedBy', 'fullName role')
            .sort({ visitNumber: 1, visitDate: 1 });

        res.status(200).json({ success: true, count: visits.length, visits });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single PNC Visit record
// @route   GET /api/pnc-visits/:id
// @access  Private
exports.getPNCVisitById = async (req, res, next) => {
    try {
        const visit = await PNCVisit.findById(req.params.id)
            .populate('patient')
            .populate('delivery')
            .populate('recordedBy', 'fullName role');

        if (!visit) {
            return res.status(404).json({ success: false, message: 'PNC Visit record not found' });
        }

        res.status(200).json({ success: true, visit });
    } catch (error) {
        next(error);
    }
};

// @desc    Record new PNC Visit for Mother & Baby (Sequential & non-overwriting)
// @route   POST /api/pnc-visits
// @access  Private
exports.createPNCVisit = async (req, res, next) => {
    try {
        const {
            patientId,
            deliveryId,
            visitDate,
            motherWeight,
            motherBloodPressure,
            motherTemperature,
            motherPulse,
            generalObservations,
            breastfeedingInformation,
            lochiaAssessment,
            perineumHealing,
            motherMedications,
            motherClinicalNotes,
            babyAssessments,
            nextAppointmentDate,
            referralInformation,
            notes,
        } = req.body;

        if (!patientId || !deliveryId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide Patient ID and Delivery ID.',
            });
        }

        const patient = await Patient.findOne({
            $or: [{ patientId }, { _id: patientId.match(/^[0-9a-fA-F]{24}$/) ? patientId : null }],
        });

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        const delivery = await Delivery.findOne({
            $or: [{ deliveryId }, { _id: deliveryId.match(/^[0-9a-fA-F]{24}$/) ? deliveryId : null }],
        });

        if (!delivery) {
            return res.status(404).json({ success: false, message: 'Delivery record not found' });
        }

        const countVisits = await PNCVisit.countDocuments({ delivery: delivery._id });
        const visitNumber = countVisits + 1;
        const pncVisitId = await generatePNCVisitId();

        const pncVisit = await PNCVisit.create({
            pncVisitId,
            patient: patient._id,
            patientId: patient.patientId,
            delivery: delivery._id,
            deliveryId: delivery.deliveryId,
            visitDate: visitDate ? new Date(visitDate) : new Date(),
            visitNumber,
            motherWeight: motherWeight ? Number(motherWeight) : undefined,
            motherBloodPressure,
            motherTemperature: motherTemperature ? Number(motherTemperature) : undefined,
            motherPulse: motherPulse ? Number(motherPulse) : undefined,
            generalObservations,
            breastfeedingInformation,
            lochiaAssessment,
            perineumHealing,
            motherMedications,
            motherClinicalNotes,
            babyAssessments: babyAssessments || [],
            nextAppointmentDate: nextAppointmentDate ? new Date(nextAppointmentDate) : undefined,
            referralInformation,
            notes,
            recordedBy: req.user.id,
        });

        // If nextAppointmentDate is provided, automatically schedule PNC appointment
        if (nextAppointmentDate) {
            const aptCount = await Appointment.countDocuments();
            await Appointment.create({
                appointmentId: `APT-${new Date().getFullYear()}-${(aptCount + 1).toString().padStart(4, '0')}`,
                patient: patient._id,
                patientId: patient.patientId,
                type: 'PNC',
                appointmentDate: new Date(nextAppointmentDate),
                reason: `Follow-up PNC Visit #${visitNumber + 1}`,
                assignedStaff: req.user.id,
                assignedStaffName: req.user.fullName,
                status: 'Upcoming',
                notes: `Scheduled from PNC Visit #${visitNumber}`,
                recordedBy: req.user.id,
            });
        }

        await logAuditAction({
            user: req.user,
            req,
            action: 'PNC_VISIT_CREATE',
            module: 'PNC',
            recordId: pncVisit.pncVisitId,
            description: `Recorded PNC Visit #${visitNumber} (${pncVisit.pncVisitId}) for mother '${patient.fullName}' and associated baby/babies.`,
        });

        res.status(201).json({
            success: true,
            message: `PNC Visit #${visitNumber} recorded successfully`,
            pncVisit,
        });
    } catch (error) {
        next(error);
    }
};
