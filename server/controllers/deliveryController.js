const Delivery = require('../models/Delivery');
const Pregnancy = require('../models/Pregnancy');
const Patient = require('../models/Patient');
const { logAuditAction } = require('../utils/auditLogger');

// Generate Delivery ID (DEL-2026-0001)
const generateDeliveryId = async () => {
    const currentYear = new Date().getFullYear();
    const count = await Delivery.countDocuments();
    const nextNum = (count + 1).toString().padStart(4, '0');
    return `DEL-${currentYear}-${nextNum}`;
};

// @desc    Get all delivery records
// @route   GET /api/deliveries
// @access  Private
exports.getDeliveries = async (req, res, next) => {
    try {
        const { patientId, pregnancyId } = req.query;
        const query = {};
        if (patientId) query.patientId = patientId;
        if (pregnancyId) query.pregnancyId = pregnancyId;

        const deliveries = await Delivery.find(query)
            .populate('patient', 'fullName patientId phone dob')
            .populate('pregnancy')
            .populate('recordedBy', 'fullName role')
            .sort({ deliveryDate: -1 });

        res.status(200).json({ success: true, count: deliveries.length, deliveries });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single delivery details
// @route   GET /api/deliveries/:id
// @access  Private
exports.getDeliveryById = async (req, res, next) => {
    try {
        const delivery = await Delivery.findById(req.params.id)
            .populate('patient')
            .populate('pregnancy')
            .populate('recordedBy', 'fullName role');

        if (!delivery) {
            return res.status(404).json({ success: false, message: 'Delivery record not found' });
        }

        res.status(200).json({ success: true, delivery });
    } catch (error) {
        next(error);
    }
};

// @desc    Record delivery & update active pregnancy status to 'Delivered'
// @route   POST /api/deliveries
// @access  Private
exports.createDelivery = async (req, res, next) => {
    try {
        const {
            patientId,
            pregnancyId,
            deliveryDate,
            deliveryTime,
            placeOfDelivery,
            modeOfDelivery,
            outcome,
            numberOfBabies,
            maternalNotes,
            additionalNotes,
        } = req.body;

        if (!patientId || !deliveryDate || !modeOfDelivery || !outcome) {
            return res.status(400).json({
                success: false,
                message: 'Please provide Patient ID, Delivery Date, Mode of Delivery, and Outcome.',
            });
        }

        const patient = await Patient.findOne({
            $or: [{ patientId }, { _id: patientId.match(/^[0-9a-fA-F]{24}$/) ? patientId : null }],
        });

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

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
                message: 'No active pregnancy record found for this patient to link delivery to.',
            });
        }

        const deliveryId = await generateDeliveryId();

        const delivery = await Delivery.create({
            deliveryId,
            patient: patient._id,
            patientId: patient.patientId,
            pregnancy: pregnancy._id,
            pregnancyId: pregnancy.pregnancyId,
            deliveryDate: new Date(deliveryDate),
            deliveryTime: deliveryTime || '12:00 PM',
            placeOfDelivery: placeOfDelivery || 'Hospital Maternity Ward',
            modeOfDelivery,
            outcome,
            numberOfBabies: Number(numberOfBabies || 1),
            maternalNotes,
            additionalNotes,
            recordedBy: req.user.id,
        });

        // Update pregnancy status to 'Delivered' and update Para count
        pregnancy.status = 'Delivered';
        pregnancy.para = (pregnancy.para || 0) + Number(numberOfBabies || 1);
        await pregnancy.save();

        await logAuditAction({
            user: req.user,
            req,
            action: 'DELIVERY_CREATE',
            module: 'Delivery',
            recordId: delivery.deliveryId,
            description: `Recorded delivery (${delivery.deliveryId}) for patient '${patient.fullName}' (${modeOfDelivery}, Outcome: ${outcome}, ${numberOfBabies} baby/babies). Pregnancy status updated to 'Delivered'.`,
        });

        res.status(201).json({
            success: true,
            message: 'Delivery record created and pregnancy status updated to Delivered',
            delivery,
        });
    } catch (error) {
        next(error);
    }
};
