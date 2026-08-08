const MedicationRecord = require('../models/MedicationRecord');
const Patient = require('../models/Patient');
const { logAuditAction } = require('../utils/auditLogger');

// Generate Med Record ID (MED-2026-0001)
const generateMedId = async () => {
    const currentYear = new Date().getFullYear();
    const count = await MedicationRecord.countDocuments();
    const nextNum = (count + 1).toString().padStart(4, '0');
    return `MED-${currentYear}-${nextNum}`;
};

// @desc    Get medication/supplement records
// @route   GET /api/medications
// @access  Private
exports.getMedicationRecords = async (req, res, next) => {
    try {
        const { patientId } = req.query;
        const query = {};
        if (patientId) query.patientId = patientId;

        const records = await MedicationRecord.find(query)
            .populate('patient', 'fullName patientId phone')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: records.length, records });
    } catch (error) {
        next(error);
    }
};

// @desc    Record medication / supplement entry
// @route   POST /api/medications
// @access  Private
exports.createMedicationRecord = async (req, res, next) => {
    try {
        const { patientId, visitRef, medicationName, dosage, frequency, startDate, endDate, instructions } = req.body;

        if (!patientId || !medicationName || !dosage || !frequency) {
            return res.status(400).json({
                success: false,
                message: 'Please provide Patient ID, Medication Name, Dosage, and Frequency.',
            });
        }

        const patient = await Patient.findOne({
            $or: [{ patientId }, { _id: patientId.match(/^[0-9a-fA-F]{24}$/) ? patientId : null }],
        });

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        const medRecordId = await generateMedId();

        const record = await MedicationRecord.create({
            medRecordId,
            patient: patient._id,
            patientId: patient.patientId,
            visitRef,
            medicationName,
            dosage,
            frequency,
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: endDate ? new Date(endDate) : undefined,
            instructions,
            recordedBy: req.user.id,
            recordedByName: req.user.fullName,
        });

        await logAuditAction({
            user: req.user,
            req,
            action: 'MEDICATION_RECORD_CREATE',
            module: 'Medications',
            recordId: record.medRecordId,
            description: `Recorded medication '${medicationName}' (${dosage}) for patient '${patient.fullName}'.`,
        });

        res.status(201).json({
            success: true,
            message: 'Medication record created successfully',
            record,
        });
    } catch (error) {
        next(error);
    }
};
