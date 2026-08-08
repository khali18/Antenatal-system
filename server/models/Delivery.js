const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema(
    {
        deliveryId: {
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
        deliveryDate: {
            type: Date,
            required: true,
            index: true,
        },
        deliveryTime: {
            type: String,
            default: '12:00 PM',
        },
        placeOfDelivery: {
            type: String,
            default: 'Hospital Maternity Ward',
        },
        modeOfDelivery: {
            type: String,
            enum: ['Vaginal delivery', 'Caesarean section', 'Assisted vaginal delivery', 'Other'],
            default: 'Vaginal delivery',
        },
        outcome: {
            type: String,
            enum: ['Live birth', 'Stillbirth', 'Maternal complication', 'Other'],
            default: 'Live birth',
        },
        numberOfBabies: {
            type: Number,
            default: 1,
            min: 1,
        },
        maternalNotes: {
            type: String,
        },
        additionalNotes: {
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

module.exports = mongoose.model('Delivery', deliverySchema);
