const Pregnancy = require('../models/Pregnancy');
const Patient = require('../models/Patient');
const { logAuditAction } = require('../utils/auditLogger');

// Generate Pregnancy ID (PRG-2026-0001)
const generatePregnancyId = async () => {
    const currentYear = new Date().getFullYear();
    const count = await Pregnancy.countDocuments();
    const nextNum = (count + 1).toString().padStart(4, '0');
    return `PRG-${currentYear}-${nextNum}`;
};

// @desc    Get all pregnancies
// @route   GET /api/pregnancies
// @access  Private
exports.getPregnancies = async (req, res, next) => {
    try {
        const { patientId, status } = req.query;
        const query = {};
        if (patientId) query.patientId = patientId;
        if (status) query.status = status;

        const pregnancies = await Pregnancy.find(query)
            .populate('patient', 'fullName patientId phone dob age')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: pregnancies.length, pregnancies });
    } catch (error) {
        next(error);
    }
};

// @desc    Register a new pregnancy for a patient
// @route   POST /api/pregnancies
// @access  Private
exports.createPregnancy = async (req, res, next) => {
    try {
        const { patientId, gravida, para, lmp, previousHistory, notes } = req.body;

        if (!patientId || !gravida || !lmp) {
            return res.status(400).json({
                success: false,
                message: 'Please provide Patient ID, Gravida, and Last Menstrual Period (LMP).',
            });
        }

        const patient = await Patient.findOne({
            $or: [{ patientId }, { _id: patientId.match(/^[0-9a-fA-F]{24}$/) ? patientId : null }],
        });

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        // Check if patient already has an Active pregnancy
        const activePregnancy = await Pregnancy.findOne({ patient: patient._id, status: 'Active' });
        if (activePregnancy) {
            return res.status(400).json({
                success: false,
                message: `Patient already has an Active pregnancy record (${activePregnancy.pregnancyId}). Please close or update the existing active pregnancy first.`,
            });
        }

        const countExisting = await Pregnancy.countDocuments({ patient: patient._id });
        const pregnancyId = await generatePregnancyId();

        const pregnancy = await Pregnancy.create({
            pregnancyId,
            patient: patient._id,
            patientId: patient.patientId,
            pregnancyNumber: countExisting + 1,
            gravida: Number(gravida),
            para: Number(para || 0),
            lmp,
            previousHistory,
            notes,
        });

        await logAuditAction({
            user: req.user,
            req,
            action: 'PREGNANCY_CREATE',
            module: 'Pregnancy',
            recordId: pregnancy.pregnancyId,
            description: `Registered new active pregnancy (${pregnancy.pregnancyId}) for patient '${patient.fullName}' (EDD: ${pregnancy.edd.toISOString().split('T')[0]}).`,
        });

        res.status(201).json({
            success: true,
            message: 'Pregnancy record created successfully',
            pregnancy,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update pregnancy status or details
// @route   PUT /api/pregnancies/:id
// @access  Private
exports.updatePregnancy = async (req, res, next) => {
    try {
        let pregnancy = await Pregnancy.findById(req.params.id);
        if (!pregnancy) {
            return res.status(404).json({ success: false, message: 'Pregnancy record not found' });
        }

        const { status, gravida, para, lmp, notes } = req.body;
        if (status) pregnancy.status = status;
        if (gravida) pregnancy.gravida = gravida;
        if (para !== undefined) pregnancy.para = para;
        if (lmp) pregnancy.lmp = lmp;
        if (notes) pregnancy.notes = notes;

        await pregnancy.save();

        await logAuditAction({
            user: req.user,
            req,
            action: 'PREGNANCY_UPDATE',
            module: 'Pregnancy',
            recordId: pregnancy.pregnancyId,
            description: `Updated pregnancy record (${pregnancy.pregnancyId}), status set to '${pregnancy.status}'.`,
        });

        res.status(200).json({
            success: true,
            message: 'Pregnancy record updated',
            pregnancy,
        });
    } catch (error) {
        next(error);
    }
};
