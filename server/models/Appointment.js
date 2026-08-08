const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
    {
        appointmentId: {
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
        type: {
            type: String,
            enum: ['ANC', 'PNC', 'Follow-up', 'Laboratory', 'Other'],
            required: true,
        },
        appointmentDate: {
            type: Date,
            required: true,
            index: true,
        },
        appointmentTime: {
            type: String,
            default: '09:00 AM',
        },
        reason: {
            type: String,
            trim: true,
        },
        assignedStaff: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        assignedStaffName: {
            type: String,
        },
        status: {
            type: String,
            enum: ['Upcoming', 'Completed', 'Missed', 'Cancelled'],
            default: 'Upcoming',
            index: true,
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

module.exports = mongoose.model('Appointment', appointmentSchema);
