const mongoose = require('mongoose');

const pregnancySchema = new mongoose.Schema(
    {
        pregnancyId: {
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
        pregnancyNumber: {
            type: Number,
            default: 1,
        },
        gravida: {
            type: Number,
            required: [true, 'Gravida count is required'],
            min: 1,
        },
        para: {
            type: Number,
            required: [true, 'Para count is required'],
            min: 0,
        },
        lmp: {
            type: Date,
            required: [true, 'Last Menstrual Period (LMP) is required'],
        },
        edd: {
            type: Date,
        },
        gestationalAgeWeeks: {
            type: Number,
        },
        status: {
            type: String,
            enum: ['Active', 'Delivered', 'Closed', 'Transferred', 'Other'],
            default: 'Active',
            index: true,
        },
        previousHistory: {
            type: String,
        },
        notes: {
            type: String,
        },
        registeredDate: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Pre-save hook to calculate EDD and current gestational age from LMP
pregnancySchema.pre('save', function () {
    if (this.lmp) {
        const lmpDate = new Date(this.lmp);
        // Naegele's rule: LMP + 280 days (40 weeks)
        const eddDate = new Date(lmpDate.getTime() + 280 * 24 * 60 * 60 * 1000);
        this.edd = eddDate;

        // Calculate current gestational age in weeks
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - lmpDate.getTime()) / (1000 * 3600 * 24));
        this.gestationalAgeWeeks = Math.max(0, Math.floor(diffDays / 7));
    }
});

module.exports = mongoose.model('Pregnancy', pregnancySchema);
