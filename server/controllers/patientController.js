const Patient = require('../models/Patient');
const Pregnancy = require('../models/Pregnancy');
const ANCVisit = require('../models/ANCVisit');
const Appointment = require('../models/Appointment');
const Delivery = require('../models/Delivery');
const Baby = require('../models/Baby');
const PNCVisit = require('../models/PNCVisit');
const LaboratoryRecord = require('../models/LaboratoryRecord');
const MedicationRecord = require('../models/MedicationRecord');
const { logAuditAction } = require('../utils/auditLogger');

// Generate Unique Patient ID (PAT-2026-0001)
const generatePatientId = async () => {
    const currentYear = new Date().getFullYear();
    const count = await Patient.countDocuments();
    const nextNum = (count + 1).toString().padStart(4, '0');
    return `PAT-${currentYear}-${nextNum}`;
};

// Generate Unique MRN (MRN-2026-0001)
const generateMRN = async () => {
    const currentYear = new Date().getFullYear();
    const count = await Patient.countDocuments();
    const nextNum = (count + 1).toString().padStart(4, '0');
    return `MRN-${currentYear}-${nextNum}`;
};

// @desc    Get all patients with pagination & search
// @route   GET /api/patients
// @access  Private
exports.getPatients = async (req, res, next) => {
    try {
        const { search, status, page = 1, limit = 20 } = req.query;

        const query = {};
        if (status) query.status = status;

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { patientId: searchRegex },
                { fullName: searchRegex },
                { phone: searchRegex },
                { medicalRecordNumber: searchRegex },
            ];
        }

        const total = await Patient.countDocuments(query);
        const patients = await Patient.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.status(200).json({
            success: true,
            count: patients.length,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            patients,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single patient details by ID or Mongo _id
// @route   GET /api/patients/:id
// @access  Private
exports.getPatientById = async (req, res, next) => {
    try {
        let patient = await Patient.findOne({
            $or: [{ patientId: req.params.id }, { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }],
        });

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        res.status(200).json({ success: true, patient });
    } catch (error) {
        next(error);
    }
};

// @desc    Get full patient 360 profile with all associated medical records
// @route   GET /api/patients/:id/full-profile
// @access  Private
exports.getPatientFullProfile = async (req, res, next) => {
    try {
        const patient = await Patient.findOne({
            $or: [{ patientId: req.params.id }, { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }],
        });

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        // Fetch related records in parallel
        const [pregnancies, ancVisits, appointments, deliveries, babies, pncVisits, labRecords, medicationRecords] = await Promise.all([
            Pregnancy.find({ patient: patient._id }).sort({ createdAt: -1 }),
            ANCVisit.find({ patient: patient._id }).sort({ visitNumber: 1 }),
            Appointment.find({ patient: patient._id }).sort({ appointmentDate: -1 }),
            Delivery.find({ patient: patient._id }).sort({ deliveryDate: -1 }),
            Baby.find({ mother: patient._id }).sort({ dob: -1 }),
            PNCVisit.find({ patient: patient._id }).sort({ visitNumber: 1 }),
            LaboratoryRecord.find({ patient: patient._id }).sort({ testDate: -1 }),
            MedicationRecord.find({ patient: patient._id }).sort({ createdAt: -1 }),
        ]);

        const activePregnancy = pregnancies.find((p) => p.status === 'Active') || null;

        res.status(200).json({
            success: true,
            patient,
            activePregnancy,
            pregnancies,
            ancVisits,
            appointments,
            deliveries,
            babies,
            pncVisits,
            labRecords,
            medicationRecords,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Register new patient
// @route   POST /api/patients
// @access  Private
exports.createPatient = async (req, res, next) => {
    try {
        const {
            fullName,
            dob,
            phone,
            altPhone,
            address,
            emergencyContactName,
            emergencyContactNumber,
            maritalStatus,
            occupation,
            nationality,
            notes,
        } = req.body;

        if (!fullName || !dob || !phone || !address || !emergencyContactName || !emergencyContactNumber) {
            return res.status(400).json({
                success: false,
                message: 'Please fill all required fields: Name, DOB, Phone, Address, Emergency Contact details.',
            });
        }

        const patientId = await generatePatientId();
        const medicalRecordNumber = await generateMRN();

        const patient = await Patient.create({
            patientId,
            fullName,
            dob,
            phone,
            altPhone,
            address,
            emergencyContactName,
            emergencyContactNumber,
            maritalStatus: maritalStatus || 'Married',
            occupation,
            nationality: nationality || 'Ghanaian',
            medicalRecordNumber,
            notes,
        });

        await logAuditAction({
            user: req.user,
            req,
            action: 'PATIENT_CREATE',
            module: 'Patients',
            recordId: patient.patientId,
            description: `Registered new patient '${patient.fullName}' (ID: ${patient.patientId}).`,
        });

        res.status(201).json({
            success: true,
            message: 'Patient registered successfully',
            patient,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update patient demographic information
// @route   PUT /api/patients/:id
// @access  Private
exports.updatePatient = async (req, res, next) => {
    try {
        let patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        const updatedPatient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        await logAuditAction({
            user: req.user,
            req,
            action: 'PATIENT_UPDATE',
            module: 'Patients',
            recordId: patient.patientId,
            description: `Updated demographic information for patient '${patient.fullName}'.`,
        });

        res.status(200).json({
            success: true,
            message: 'Patient information updated',
            patient: updatedPatient,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Soft delete / Deactivate patient
// @route   PATCH /api/patients/:id/status
// @access  Private
exports.togglePatientStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        patient.status = status || (patient.status === 'active' ? 'inactive' : 'active');
        await patient.save();

        await logAuditAction({
            user: req.user,
            req,
            action: 'PATIENT_STATUS_CHANGE',
            module: 'Patients',
            recordId: patient.patientId,
            description: `Changed patient '${patient.fullName}' status to '${patient.status}'.`,
        });

        res.status(200).json({
            success: true,
            message: `Patient status updated to ${patient.status}`,
            status: patient.status,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Permanently delete patient record
// @route   DELETE /api/patients/:id
// @access  Private
exports.deletePatient = async (req, res, next) => {
    try {
        const patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        await Patient.findByIdAndDelete(req.params.id);

        await logAuditAction({
            user: req.user,
            req,
            action: 'PATIENT_DELETE',
            module: 'Patients',
            recordId: patient.patientId,
            description: `Permanently deleted patient record '${patient.fullName}' (ID: ${patient.patientId}).`,
        });

        res.status(200).json({
            success: true,
            message: 'Patient record permanently deleted',
        });
    } catch (error) {
        next(error);
    }
};
