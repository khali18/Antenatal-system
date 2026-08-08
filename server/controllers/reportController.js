const Patient = require('../models/Patient');
const Pregnancy = require('../models/Pregnancy');
const ANCVisit = require('../models/ANCVisit');
const Appointment = require('../models/Appointment');
const Delivery = require('../models/Delivery');
const PNCVisit = require('../models/PNCVisit');

// Helper to get month name
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// @desc    Get executive dashboard metrics & 6 Chart.js datasets
// @route   GET /api/reports/dashboard-stats
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
    try {
        const now = new Date();
        const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // 1. Summary Cards
        const [
            totalPatients,
            activePregnancies,
            ancPatientsCount,
            pncPatientsCount,
            ancVisitsThisMonth,
            pncVisitsThisMonth,
            todaysAppointments,
            upcomingAppointments,
            missedAppointments,
            deliveriesRecorded,
        ] = await Promise.all([
            Patient.countDocuments({ status: 'active' }),
            Pregnancy.countDocuments({ status: 'Active' }),
            ANCVisit.distinct('patient').then((p) => p.length),
            PNCVisit.distinct('patient').then((p) => p.length),
            ANCVisit.countDocuments({ visitDate: { $gte: firstDayThisMonth, $lte: lastDayThisMonth } }),
            PNCVisit.countDocuments({ visitDate: { $gte: firstDayThisMonth, $lte: lastDayThisMonth } }),
            Appointment.countDocuments({ appointmentDate: { $gte: todayStart, $lte: todayEnd } }),
            Appointment.countDocuments({ appointmentDate: { $gte: todayStart }, status: 'Upcoming' }),
            Appointment.countDocuments({ status: 'Missed' }),
            Delivery.countDocuments(),
        ]);

        // 2. Monthly Trend Visualizations (Past 6 Months)
        const months = [];
        const ancRegMonthly = [];
        const ancVisitsMonthly = [];
        const pncVisitsMonthly = [];
        const deliveryMonthly = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
            const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

            months.push(`${monthNames[d.getMonth()]} ${d.getFullYear()}`);

            const [ancRegCount, ancVisitCount, pncVisitCount, delCount] = await Promise.all([
                Pregnancy.countDocuments({ registeredDate: { $gte: mStart, $lte: mEnd } }),
                ANCVisit.countDocuments({ visitDate: { $gte: mStart, $lte: mEnd } }),
                PNCVisit.countDocuments({ visitDate: { $gte: mStart, $lte: mEnd } }),
                Delivery.countDocuments({ deliveryDate: { $gte: mStart, $lte: mEnd } }),
            ]);

            ancRegMonthly.push(ancRegCount);
            ancVisitsMonthly.push(ancVisitCount);
            pncVisitsMonthly.push(pncVisitCount);
            deliveryMonthly.push(delCount);
        }

        // 3. Appointment Breakdown (Chart 4)
        const [aptCompleted, aptPending, aptMissed, aptCancelled] = await Promise.all([
            Appointment.countDocuments({ status: 'Completed' }),
            Appointment.countDocuments({ status: 'Upcoming' }),
            Appointment.countDocuments({ status: 'Missed' }),
            Appointment.countDocuments({ status: 'Cancelled' }),
        ]);

        // 4. Age Group Distribution (Chart 5)
        const patients = await Patient.find({ status: 'active' }, 'dob age');
        const ageGroups = { '<20': 0, '20-24': 0, '25-29': 0, '30-34': 0, '35+': 0 };
        patients.forEach((p) => {
            const age = p.age || 25;
            if (age < 20) ageGroups['<20']++;
            else if (age <= 24) ageGroups['20-24']++;
            else if (age <= 29) ageGroups['25-29']++;
            else if (age <= 34) ageGroups['30-34']++;
            else ageGroups['35+']++;
        });

        // 5. Recent Activity Lists
        const [recentPatients, todaysAptsList, upcomingAptsList, recentANCVisits, recentPNCVisits] = await Promise.all([
            Patient.find().sort({ createdAt: -1 }).limit(5),
            Appointment.find({ appointmentDate: { $gte: todayStart, $lte: todayEnd } })
                .populate('patient', 'fullName patientId phone')
                .sort({ appointmentTime: 1 })
                .limit(5),
            Appointment.find({ appointmentDate: { $gte: todayStart }, status: 'Upcoming' })
                .populate('patient', 'fullName patientId phone')
                .sort({ appointmentDate: 1 })
                .limit(5),
            ANCVisit.find()
                .populate('patient', 'fullName patientId')
                .sort({ visitDate: -1 })
                .limit(5),
            PNCVisit.find()
                .populate('patient', 'fullName patientId')
                .sort({ visitDate: -1 })
                .limit(5),
        ]);

        res.status(200).json({
            success: true,
            cards: {
                totalPatients,
                activePregnancies,
                ancPatientsCount,
                pncPatientsCount,
                ancVisitsThisMonth,
                pncVisitsThisMonth,
                todaysAppointments,
                upcomingAppointments,
                missedAppointments,
                deliveriesRecorded,
            },
            charts: {
                labels: months,
                ancRegistrations: ancRegMonthly,
                ancVisits: ancVisitsMonthly,
                pncVisits: pncVisitsMonthly,
                deliveryTrends: deliveryMonthly,
                appointmentBreakdown: {
                    completed: aptCompleted,
                    pending: aptPending,
                    missed: aptMissed,
                    cancelled: aptCancelled,
                },
                ageDistribution: ageGroups,
            },
            recent: {
                patients: recentPatients,
                todaysAppointments: todaysAptsList,
                upcomingAppointments: upcomingAptsList,
                ancVisits: recentANCVisits,
                pncVisits: recentPNCVisits,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Export Patients / ANC / PNC / Delivery / Appointment Reports to CSV
// @route   GET /api/reports/export-csv/:type
// @access  Private
exports.exportCSV = async (req, res, next) => {
    try {
        const { type } = req.params;
        let csvData = '';
        let filename = `report_${type}_${Date.now()}.csv`;

        if (type === 'patients') {
            const patients = await Patient.find().sort({ createdAt: -1 });
            csvData = 'Patient ID,Full Name,Age,DOB,Phone,Address,Marital Status,MRN,Registration Date,Status\n';
            patients.forEach((p) => {
                csvData += `"${p.patientId}","${p.fullName}",${p.age || ''},"${p.dob ? p.dob.toISOString().split('T')[0] : ''}","${p.phone}","${p.address}","${p.maritalStatus}","${p.medicalRecordNumber}","${p.registrationDate ? p.registrationDate.toISOString().split('T')[0] : ''}","${p.status}"\n`;
            });
        } else if (type === 'anc') {
            const visits = await ANCVisit.find().populate('patient', 'fullName').sort({ visitDate: -1 });
            csvData = 'ANC Visit ID,Patient ID,Patient Name,Visit Date,Gestational Age (Wks),Visit Number,Weight (kg),Blood Pressure,Fundal Height,Fetal Heart Rate,Risk Flags\n';
            visits.forEach((v) => {
                csvData += `"${v.ancVisitId}","${v.patientId}","${v.patient ? v.patient.fullName : ''}","${v.visitDate ? v.visitDate.toISOString().split('T')[0] : ''}",${v.gestationalAgeWeeks},${v.visitNumber},${v.weight},"${v.bloodPressure}",${v.fundalHeight || ''},${v.fetalHeartRate || ''},"${v.staffRiskFlags}"\n`;
            });
        } else if (type === 'pnc') {
            const visits = await PNCVisit.find().populate('patient', 'fullName').sort({ visitDate: -1 });
            csvData = 'PNC Visit ID,Patient ID,Mother Name,Visit Date,Visit Number,Mother Weight,Blood Pressure,Lochia,Perineum,Notes\n';
            visits.forEach((v) => {
                csvData += `"${v.pncVisitId}","${v.patientId}","${v.patient ? v.patient.fullName : ''}","${v.visitDate ? v.visitDate.toISOString().split('T')[0] : ''}",${v.visitNumber},${v.motherWeight || ''},"${v.motherBloodPressure || ''}","${v.lochiaAssessment || ''}","${v.perineumHealing || ''}","${v.notes || ''}"\n`;
            });
        } else if (type === 'appointments') {
            const appointments = await Appointment.find().populate('patient', 'fullName').sort({ appointmentDate: -1 });
            csvData = 'Appointment ID,Patient ID,Patient Name,Type,Date,Time,Status,Reason\n';
            appointments.forEach((a) => {
                csvData += `"${a.appointmentId}","${a.patientId}","${a.patient ? a.patient.fullName : ''}","${a.type}","${a.appointmentDate ? a.appointmentDate.toISOString().split('T')[0] : ''}","${a.appointmentTime}","${a.status}","${a.reason || ''}"\n`;
            });
        } else if (type === 'deliveries') {
            const deliveries = await Delivery.find().populate('patient', 'fullName').sort({ deliveryDate: -1 });
            csvData = 'Delivery ID,Patient ID,Mother Name,Delivery Date,Place,Mode of Delivery,Outcome,Number of Babies\n';
            deliveries.forEach((d) => {
                csvData += `"${d.deliveryId}","${d.patientId}","${d.patient ? d.patient.fullName : ''}","${d.deliveryDate ? d.deliveryDate.toISOString().split('T')[0] : ''}","${d.placeOfDelivery}","${d.modeOfDelivery}","${d.outcome}",${d.numberOfBabies}\n`;
            });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid report type specified for export' });
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(200).send(csvData);
    } catch (error) {
        next(error);
    }
};
