const LaboratoryRecord = require('../models/LaboratoryRecord');
const Patient = require('../models/Patient');
const { logAuditAction } = require('../utils/auditLogger');

// Generate Lab Record ID (LAB-2026-0001)
const generateLabId = async () => {
    const currentYear = new Date().getFullYear();
    const count = await LaboratoryRecord.countDocuments();
    const nextNum = (count + 1).toString().padStart(4, '0');
    return `LAB-${currentYear}-${nextNum}`;
};

// @desc    Get laboratory records
// @route   GET /api/laboratory
// @access  Private
exports.getLabRecords = async (req, res, next) => {
    try {
        const { patientId } = req.query;
        const query = {};
        if (patientId) query.patientId = patientId;

        const records = await LaboratoryRecord.find(query)
            .populate('patient', 'fullName patientId phone')
            .sort({ testDate: -1 });

        res.status(200).json({ success: true, count: records.length, records });
    } catch (error) {
        next(error);
    }
};

// @desc    Create laboratory record
// @route   POST /api/laboratory
// @access  Private
exports.createLabRecord = async (req, res, next) => {
    try {
        const { patientId, ancVisitId, testName, testDate, result, remarks } = req.body;

        if (!patientId || !testName || !result) {
            return res.status(400).json({
                success: false,
                message: 'Please provide Patient ID, Test Name, and Result.',
            });
        }

        const patient = await Patient.findOne({
            $or: [{ patientId }, { _id: patientId.match(/^[0-9a-fA-F]{24}$/) ? patientId : null }],
        });

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        const labRecordId = await generateLabId();

        const record = await LaboratoryRecord.create({
            labRecordId,
            patient: patient._id,
            patientId: patient.patientId,
            ancVisitId,
            testName,
            testDate: testDate ? new Date(testDate) : new Date(),
            result,
            remarks,
            recordedBy: req.user.id,
            recordedByName: req.user.fullName,
        });

        await logAuditAction({
            user: req.user,
            req,
            action: 'LAB_RECORD_CREATE',
            module: 'Laboratory',
            recordId: record.labRecordId,
            description: `Created laboratory record (${record.labRecordId}, Test: ${testName}) for patient '${patient.fullName}'.`,
        });

        res.status(201).json({
            success: true,
            message: 'Laboratory record created successfully',
            record,
        });
    } catch (error) {
        next(error);
    }
};
