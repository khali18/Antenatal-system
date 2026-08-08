const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Delivery = require('../models/Delivery');

// @desc    Get internal notifications (upcoming/missed appointments, recent deliveries & registrations)
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const [upcomingToday, missedList, recentDeliveries, recentRegistrations] = await Promise.all([
            Appointment.find({ appointmentDate: { $gte: todayStart, $lte: todayEnd }, status: 'Upcoming' })
                .populate('patient', 'fullName patientId phone')
                .limit(10),
            Appointment.find({ status: 'Missed' })
                .populate('patient', 'fullName patientId phone')
                .sort({ appointmentDate: -1 })
                .limit(10),
            Delivery.find()
                .populate('patient', 'fullName patientId')
                .sort({ createdAt: -1 })
                .limit(5),
            Patient.find()
                .sort({ createdAt: -1 })
                .limit(5),
        ]);

        const notifications = [];

        upcomingToday.forEach((apt) => {
            notifications.push({
                id: `apt-up-${apt._id}`,
                type: 'warning',
                icon: 'bi-calendar-event',
                title: 'Today\'s Appointment',
                message: `${apt.type} Appointment for ${apt.patient ? apt.patient.fullName : apt.patientId} scheduled for ${apt.appointmentTime}.`,
                time: 'Today',
                link: '#appointments',
            });
        });

        missedList.forEach((apt) => {
            notifications.push({
                id: `apt-ms-${apt._id}`,
                type: 'danger',
                icon: 'bi-exclamation-triangle',
                title: 'Missed Appointment Alert',
                message: `${apt.patient ? apt.patient.fullName : apt.patientId} missed ${apt.type} appointment on ${apt.appointmentDate ? apt.appointmentDate.toISOString().split('T')[0] : ''}.`,
                time: apt.appointmentDate ? apt.appointmentDate.toISOString().split('T')[0] : 'Past',
                link: '#appointments',
            });
        });

        recentDeliveries.forEach((del) => {
            notifications.push({
                id: `del-${del._id}`,
                type: 'success',
                icon: 'bi-heart-pulse-fill',
                title: 'New Delivery Recorded',
                message: `Delivery recorded for ${del.patient ? del.patient.fullName : del.patientId} (${del.modeOfDelivery}, ${del.numberOfBabies} baby/babies).`,
                time: del.deliveryDate ? del.deliveryDate.toISOString().split('T')[0] : 'Recent',
                link: '#delivery',
            });
        });

        recentRegistrations.forEach((p) => {
            notifications.push({
                id: `pat-${p._id}`,
                type: 'info',
                icon: 'bi-person-plus',
                title: 'New Patient Registered',
                message: `Registered ${p.fullName} (${p.patientId}).`,
                time: p.createdAt ? p.createdAt.toISOString().split('T')[0] : 'Recent',
                link: '#patients',
            });
        });

        res.status(200).json({
            success: true,
            count: notifications.length,
            notifications,
        });
    } catch (error) {
        next(error);
    }
};
