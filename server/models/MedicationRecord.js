const mongoose = require('mongoose');

const medicationRecordSchema = new mongoose.Schema(
    {
        medRecordId: {
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
        visitRef: {
            type: String, // ANC or PNC Visit ID
        },
        medicationName: {
            type: String,
            required: true,
            trim: true,
        },
        dosage: {
            type: String,
            required: true,
        },
        frequency: {
            type: String,
            required: true,
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        endDate: {
            type: Date,
        },
        instructions: {
            type: String,
        },
        recordedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        recordedByName: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('MedicationRecord', medicationRecordSchema);
