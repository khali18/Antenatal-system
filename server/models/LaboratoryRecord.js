const mongoose = require('mongoose');

const laboratoryRecordSchema = new mongoose.Schema(
    {
        labRecordId: {
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
        ancVisitId: {
            type: String,
        },
        testName: {
            type: String,
            required: true,
            trim: true,
        },
        testDate: {
            type: Date,
            default: Date.now,
        },
        result: {
            type: String,
            required: true,
        },
        remarks: {
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

module.exports = mongoose.model('LaboratoryRecord', laboratoryRecordSchema);
