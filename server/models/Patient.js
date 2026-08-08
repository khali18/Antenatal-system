const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
    {
        patientId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
            index: true,
        },
        dob: {
            type: Date,
            required: [true, 'Date of birth is required'],
        },
        age: {
            type: Number,
        },
        gender: {
            type: String,
            default: 'Female',
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true,
            index: true,
        },
        altPhone: {
            type: String,
            trim: true,
        },
        address: {
            type: String,
            required: [true, 'Address is required'],
            trim: true,
        },
        emergencyContactName: {
            type: String,
            required: [true, 'Emergency contact name is required'],
            trim: true,
        },
        emergencyContactNumber: {
            type: String,
            required: [true, 'Emergency contact number is required'],
            trim: true,
        },
        maritalStatus: {
            type: String,
            enum: ['Single', 'Married', 'Divorced', 'Widowed', 'Other'],
            default: 'Married',
        },
        occupation: {
            type: String,
            trim: true,
        },
        nationality: {
            type: String,
            default: 'Ghanaian',
            trim: true,
        },
        registrationDate: {
            type: Date,
            default: Date.now,
        },
        medicalRecordNumber: {
            type: String,
            unique: true,
            trim: true,
            index: true,
        },
        notes: {
            type: String,
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'transferred', 'deceased'],
            default: 'active',
        },
    },
    {
        timestamps: true,
    }
);

// Calculate age before saving
patientSchema.pre('save', function () {
    if (this.dob) {
        const diff_ms = Date.now() - new Date(this.dob).getTime();
        const age_dt = new Date(diff_ms);
        this.age = Math.abs(age_dt.getUTCFullYear() - 1970);
    }
});

module.exports = mongoose.model('Patient', patientSchema);
