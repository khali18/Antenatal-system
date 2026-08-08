const mongoose = require('mongoose');

const pncVisitSchema = new mongoose.Schema(
    {
        pncVisitId: {
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
        delivery: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Delivery',
            required: true,
            index: true,
        },
        deliveryId: {
            type: String,
            required: true,
            index: true,
        },
        visitDate: {
            type: Date,
            default: Date.now,
        },
        visitNumber: {
            type: Number,
            required: true, // e.g. 1 (24 hrs), 2 (6 days), 3 (6 weeks)
        },
        // Mother postnatal assessment
        motherWeight: {
            type: Number,
        },
        motherBloodPressure: {
            type: String,
        },
        motherTemperature: {
            type: Number,
        },
        motherPulse: {
            type: Number,
        },
        generalObservations: {
            type: String,
        },
        breastfeedingInformation: {
            type: String,
        },
        lochiaAssessment: {
            type: String,
        },
        perineumHealing: {
            type: String,
        },
        motherMedications: {
            type: String,
        },
        motherClinicalNotes: {
            type: String,
        },
        // Baby postnatal assessment (can be multiple for twins)
        babyAssessments: [
            {
                baby: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Baby',
                },
                babyId: String,
                weight: Number,
                temperature: Number,
                feedingInformation: String,
                immunizationInformation: String,
                generalObservations: String,
            },
        ],
        // Follow up
        nextAppointmentDate: {
            type: Date,
        },
        referralInformation: {
            type: String,
        },
        notes: {
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

module.exports = mongoose.model('PNCVisit', pncVisitSchema);
