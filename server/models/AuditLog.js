const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        userName: {
            type: String,
            required: true,
        },
        userRole: {
            type: String,
            required: true,
        },
        action: {
            type: String,
            required: true, // e.g., "LOGIN", "PATIENT_CREATE", "ANC_VISIT_CREATE", etc.
            index: true,
        },
        module: {
            type: String,
            required: true, // e.g., "Auth", "Patients", "ANC", "Delivery", "Users", etc.
            index: true,
        },
        recordId: {
            type: String,
        },
        description: {
            type: String,
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true,
        },
        ipAddress: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
