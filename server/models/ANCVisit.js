const mongoose = require('mongoose');

const ancVisitSchema = new mongoose.Schema(
    {
        ancVisitId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
            required: true,
            index: true,
        },
        patientId: {
            type: String,
            required: true,
            index: true,
        },
        pregnancy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Pregnancy',
            required: true,
            index: true,
        },
        pregnancyId: {
            type: String,
            required: true,
            index: true,
        },
        visitDate: {
            type: Date,
            default: Date.now,
        },
        gestationalAgeWeeks: {
            type: Number,
            required: true,
        },
        visitNumber: {
            type: Number,
            required: true,
        },
        // Vital signs
        weight: {
            type: Number, // kg
            required: true,
        },
        bloodPressure: {
            type: String, // e.g. "120/80"
            required: true,
        },
        temperature: {
            type: Number, // °C
        },
        pulseRate: {
            type: Number, // bpm
        },
        respiratoryRate: {
            type: Number, // bpm
        },
        // Pregnancy observations
        fundalHeight: {
            type: Number, // cm
        },
        fetalHeartRate: {
            type: Number, // bpm
        },
        fetalMovement: {
            type: String, // e.g. "Present", "Decreased", "Absent"
            default: 'Present',
        },
        generalObservations: {
            type: String,
        },
        // Staff administrative/clinical flags (Not AI diagnosis)
        staffRiskFlags: {
            type: String,
            default: 'Normal Routine ANC',
        },
        // Investigations conducted during visit
        investigations: [
            {
                testName: String,
                testDate: Date,
                result: String,
                remarks: String,
            },
        ],
        // Medications prescribed/recorded
        medications: [
            {
                name: String,
                dosage: String,
                frequency: String,
                startDate: Date,
                endDate: Date,
                notes: String,
            },
        ],
        // Follow-up plan
        nextAppointmentDate: {
            type: Date,
        },
        referralInfo: {
            type: String,
        },
        clinicalNotes: {
            type: String,
        },
        recordedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('ANCVisit', ancVisitSchema);
