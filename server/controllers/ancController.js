const ANCVisit = require('../models/ANCVisit');
const Pregnancy = require('../models/Pregnancy');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const LaboratoryRecord = require('../models/LaboratoryRecord');
const MedicationRecord = require('../models/MedicationRecord');
const { logAuditAction } = require('../utils/auditLogger');

// Generate ANC Visit ID (ANC-2026-0001)
const generateANCVisitId = async () => {
    const currentYear = new Date().getFullYear();
    const count = await ANCVisit.countDocuments();
    const nextNum = (count + 1).toString().padStart(4, '0');
    return `ANC-${currentYear}-${nextNum}`;
};

// @desc    Get ANC visits by Patient ID or Pregnancy ID
// @route   GET /api/anc-visits
// @access  Private
exports.getANCVisits = async (req, res, next) => {
    try {
        const { patientId, pregnancyId } = req.query;
        const query = {};
        if (patientId) query.patientId = patientId;
        if (pregnancyId) query.pregnancyId = pregnancyId;

        const visits = await ANCVisit.find(query)
            .populate('patient', 'fullName patientId phone dob')
            .populate('recordedBy', 'fullName role')
            .sort({ visitNumber: 1, visitDate: 1 });

        res.status(200).json({ success: true, count: visits.length, visits });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single ANC visit details
// @route   GET /api/anc-visits/:id
// @access  Private
exports.getANCVisitById = async (req, res, next) => {
    try {
        const visit = await ANCVisit.findById(req.params.id)
            .populate('patient')
            .populate('pregnancy')
            .populate('recordedBy', 'fullName role');

        if (!visit) {
            return res.status(404).json({ success: false, message: 'ANC Visit record not found' });
        }

        res.status(200).json({ success: true, visit });
    } catch (error) {
        next(error);
    }
};

// @desc    Record new ANC Visit (Sequential & non-overwriting)
// @route   POST /api/anc-visits
// @access  Private
exports.createANCVisit = async (req, res, next) => {
    try {
        const {
            patientId,
            pregnancyId,
            visitDate,
            weight,
            bloodPressure,
            temperature,
            pulseRate,
            respiratoryRate,
            fundalHeight,
            fetalHeartRate,
            fetalMovement,
            generalObservations,
            staffRiskFlags,
            investigations,
            medications,
            nextAppointmentDate,
            referralInfo,
            clinicalNotes,
        } = req.body;

        if (!patientId || !weight || !bloodPressure) {
            return res.status(400).json({
                success: false,
                message: 'Please provide Patient ID, Weight, and Blood Pressure.',
            });
        }

        const patient = await Patient.findOne({
            $or: [{ patientId }, { _id: patientId.match(/^[0-9a-fA-F]{24}$/) ? patientId : null }],
        });

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        // Find pregnancy record
        let pregnancy;
        if (pregnancyId) {
            pregnancy = await Pregnancy.findOne({
                $or: [{ pregnancyId }, { _id: pregnancyId.match(/^[0-9a-fA-F]{24}$/) ? pregnancyId : null }],
            });
        } else {
            pregnancy = await Pregnancy.findOne({ patient: patient._id, status: 'Active' });
        }

        if (!pregnancy) {
            return res.status(400).json({
                success: false,
                message: 'No active pregnancy found for this patient. Please register a pregnancy first.',
            });
        }

        // Calculate current gestational age in weeks from pregnancy LMP
        const lmpDate = new Date(pregnancy.lmp);
        const vDate = visitDate ? new Date(visitDate) : new Date();
        const diffDays = Math.floor((vDate.getTime() - lmpDate.getTime()) / (1000 * 3600 * 24));
        const gestationalAgeWeeks = Math.max(0, Math.floor(diffDays / 7));

        // Determine visit number
        const countVisits = await ANCVisit.countDocuments({ pregnancy: pregnancy._id });
        const visitNumber = countVisits + 1;
        const ancVisitId = await generateANCVisitId();

        const ancVisit = await ANCVisit.create({
            ancVisitId,
            patient: patient._id,
            patientId: patient.patientId,
            pregnancy: pregnancy._id,
            pregnancyId: pregnancy.pregnancyId,
            visitDate: vDate,
            gestationalAgeWeeks,
            visitNumber,
            weight: Number(weight),
            bloodPressure,
            temperature: temperature ? Number(temperature) : undefined,
            pulseRate: pulseRate ? Number(pulseRate) : undefined,
            respiratoryRate: respiratoryRate ? Number(respiratoryRate) : undefined,
            fundalHeight: fundalHeight ? Number(fundalHeight) : undefined,
            fetalHeartRate: fetalHeartRate ? Number(fetalHeartRate) : undefined,
            fetalMovement: fetalMovement || 'Present',
            generalObservations,
            staffRiskFlags: staffRiskFlags || 'Normal Routine ANC',
            investigations: investigations || [],
            medications: medications || [],
            nextAppointmentDate: nextAppointmentDate ? new Date(nextAppointmentDate) : undefined,
            referralInfo,
            clinicalNotes,
            recordedBy: req.user.id,
        });

        // If investigations included, automatically record in LaboratoryRecord
        if (investigations && Array.isArray(investigations) && investigations.length > 0) {
            for (const inv of investigations) {
                if (inv.testName && inv.result) {
                    const labCount = await LaboratoryRecord.countDocuments();
                    await LaboratoryRecord.create({
                        labRecordId: `LAB-${new Date().getFullYear()}-${(labCount + 1).toString().padStart(4, '0')}`,
                        patient: patient._id,
                        patientId: patient.patientId,
                        ancVisitId: ancVisit.ancVisitId,
                        testName: inv.testName,
                        testDate: inv.testDate || vDate,
                        result: inv.result,
                        remarks: inv.remarks || `Recorded during ANC Visit #${visitNumber}`,
                        recordedBy: req.user.id,
                        recordedByName: req.user.fullName,
                    });
                }
            }
        }

        // If medications included, automatically record in MedicationRecord
        if (medications && Array.isArray(medications) && medications.length > 0) {
            for (const med of medications) {
                if (med.name && med.dosage) {
                    const medCount = await MedicationRecord.countDocuments();
                    await MedicationRecord.create({
                        medRecordId: `MED-${new Date().getFullYear()}-${(medCount + 1).toString().padStart(4, '0')}`,
                        patient: patient._id,
                        patientId: patient.patientId,
                        visitRef: ancVisit.ancVisitId,
                        medicationName: med.name,
                        dosage: med.dosage,
                        frequency: med.frequency || 'Daily',
                        startDate: med.startDate || vDate,
                        endDate: med.endDate,
                        instructions: med.notes,
                        recordedBy: req.user.id,
                        recordedByName: req.user.fullName,
                    });
                }
            }
        }

        // If nextAppointmentDate is provided, automatically schedule ANC appointment
        if (nextAppointmentDate) {
            const aptCount = await Appointment.countDocuments();
            await Appointment.create({
                appointmentId: `APT-${new Date().getFullYear()}-${(aptCount + 1).toString().padStart(4, '0')}`,
                patient: patient._id,
                patientId: patient.patientId,
                type: 'ANC',
                appointmentDate: new Date(nextAppointmentDate),
                reason: `Follow-up ANC Visit #${visitNumber + 1}`,
                assignedStaff: req.user.id,
                assignedStaffName: req.user.fullName,
                status: 'Upcoming',
                notes: `Scheduled from ANC Visit #${visitNumber}`,
                recordedBy: req.user.id,
            });
        }

        await logAuditAction({
            user: req.user,
            req,
            action: 'ANC_VISIT_CREATE',
            module: 'ANC',
            recordId: ancVisit.ancVisitId,
            description: `Recorded ANC Visit #${visitNumber} (${ancVisit.ancVisitId}) for patient '${patient.fullName}' at ${gestationalAgeWeeks} weeks GA.`,
        });

        res.status(201).json({
            success: true,
            message: `ANC Visit #${visitNumber} recorded successfully`,
            ancVisit,
        });
    } catch (error) {
        next(error);
    }
};
