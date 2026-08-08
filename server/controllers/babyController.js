const Baby = require('../models/Baby');
const Delivery = require('../models/Delivery');
const Patient = require('../models/Patient');
const { logAuditAction } = require('../utils/auditLogger');

// Generate Baby ID (BBY-2026-0001)
const generateBabyId = async () => {
    const currentYear = new Date().getFullYear();
    const count = await Baby.countDocuments();
    const nextNum = (count + 1).toString().padStart(4, '0');
    return `BBY-${currentYear}-${nextNum}`;
};

// @desc    Get all baby records
// @route   GET /api/babies
// @access  Private
exports.getBabies = async (req, res, next) => {
    try {
        const { motherPatientId, deliveryId } = req.query;
        const query = {};
        if (motherPatientId) query.motherPatientId = motherPatientId;
        if (deliveryId) query.deliveryId = deliveryId;

        const babies = await Baby.find(query)
            .populate('mother', 'fullName patientId phone')
            .populate('delivery')
            .sort({ dob: -1 });

        res.status(200).json({ success: true, count: babies.length, babies });
    } catch (error) {
        next(error);
    }
};

// @desc    Get baby by ID
// @route   GET /api/babies/:id
// @access  Private
exports.getBabyById = async (req, res, next) => {
    try {
        const baby = await Baby.findById(req.params.id)
            .populate('mother')
            .populate('delivery');

        if (!baby) {
            return res.status(404).json({ success: false, message: 'Baby record not found' });
        }

        res.status(200).json({ success: true, baby });
    } catch (error) {
        next(error);
    }
};

// @desc    Register new baby linked to mother & delivery
// @route   POST /api/babies
// @access  Private
exports.createBaby = async (req, res, next) => {
    try {
        const {
            motherPatientId,
            deliveryId,
            dob,
            timeOfBirth,
            sex,
            birthWeight,
            birthLength,
            headCircumference,
            apgar1Min,
            apgar5Min,
            immunizationsGiven,
            feedingMethod,
            followUpNotes,
        } = req.body;

        if (!motherPatientId || !deliveryId || !dob || !sex || !birthWeight) {
            return res.status(400).json({
                success: false,
                message: 'Please provide Mother Patient ID, Delivery ID, DOB, Sex, and Birth Weight.',
            });
        }

        const mother = await Patient.findOne({
            $or: [{ patientId: motherPatientId }, { _id: motherPatientId.match(/^[0-9a-fA-F]{24}$/) ? motherPatientId : null }],
        });

        if (!mother) {
            return res.status(404).json({ success: false, message: 'Mother patient record not found' });
        }

        const delivery = await Delivery.findOne({
            $or: [{ deliveryId }, { _id: deliveryId.match(/^[0-9a-fA-F]{24}$/) ? deliveryId : null }],
        });

        if (!delivery) {
            return res.status(404).json({ success: false, message: 'Delivery record not found' });
        }

        const babyId = await generateBabyId();

        const baby = await Baby.create({
            babyId,
            mother: mother._id,
            motherPatientId: mother.patientId,
            delivery: delivery._id,
            deliveryId: delivery.deliveryId,
            dob: new Date(dob),
            timeOfBirth: timeOfBirth || '12:00 PM',
            sex,
            birthWeight: Number(birthWeight),
            birthLength: birthLength ? Number(birthLength) : undefined,
            headCircumference: headCircumference ? Number(headCircumference) : undefined,
            apgar1Min: apgar1Min ? Number(apgar1Min) : undefined,
            apgar5Min: apgar5Min ? Number(apgar5Min) : undefined,
            immunizationsGiven: immunizationsGiven || ['BCG', 'OPV-0'],
            feedingMethod: feedingMethod || 'Exclusive Breastfeeding',
            followUpNotes,
            recordedBy: req.user.id,
        });

        await logAuditAction({
            user: req.user,
            req,
            action: 'BABY_CREATE',
            module: 'Baby',
            recordId: baby.babyId,
            description: `Registered baby (${baby.babyId}, Sex: ${sex}, Weight: ${birthWeight}kg) for mother '${mother.fullName}'.`,
        });

        res.status(201).json({
            success: true,
            message: 'Baby record registered successfully',
            baby,
        });
    } catch (error) {
        next(error);
    }
};
