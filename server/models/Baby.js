const mongoose = require('mongoose');

const babySchema = new mongoose.Schema(
    {
        babyId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
        mother: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
            required: true,
            index: true,
        },
        motherPatientId: {
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
        dob: {
            type: Date,
            required: true,
        },
        timeOfBirth: {
            type: String,
        },
        sex: {
            type: String,
            enum: ['Male', 'Female', 'Other'],
            required: true,
        },
        birthWeight: {
            type: Number, // kg
            required: true,
        },
        birthLength: {
            type: Number, // cm
        },
        headCircumference: {
            type: Number, // cm
        },
        apgar1Min: {
            type: Number,
            min: 0,
            max: 10,
        },
        apgar5Min: {
            type: Number,
            min: 0,
            max: 10,
        },
        immunizationsGiven: [
            {
                type: String,
            },
        ],
        feedingMethod: {
            type: String,
            default: 'Exclusive Breastfeeding',
        },
        followUpNotes: {
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

module.exports = mongoose.model('Baby', babySchema);
