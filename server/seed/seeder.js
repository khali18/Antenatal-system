const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../models/User');
const Patient = require('../models/Patient');
const Pregnancy = require('../models/Pregnancy');
const ANCVisit = require('../models/ANCVisit');
const Appointment = require('../models/Appointment');
const Delivery = require('../models/Delivery');
const Baby = require('../models/Baby');
const PNCVisit = require('../models/PNCVisit');
const LaboratoryRecord = require('../models/LaboratoryRecord');
const MedicationRecord = require('../models/MedicationRecord');
const AuditLog = require('../models/AuditLog');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/antenatal_pnc_db');
        console.log('[Seeder]: Connected to MongoDB');
    } catch (err) {
        console.error(`[Seeder Error]: ${err.message}`);
        process.exit(1);
    }
};

const seedData = async () => {
    await connectDB();

    console.log('[Seeder]: Clearing old database collections...');
    await Promise.all([
        User.deleteMany({}),
        Patient.deleteMany({}),
        Pregnancy.deleteMany({}),
        ANCVisit.deleteMany({}),
        Appointment.deleteMany({}),
        Delivery.deleteMany({}),
        Baby.deleteMany({}),
        PNCVisit.deleteMany({}),
        LaboratoryRecord.deleteMany({}),
        MedicationRecord.deleteMany({}),
        AuditLog.deleteMany({}),
    ]);

    console.log('[Seeder]: Seeding default staff accounts...');
    // Password hashing happens automatically via pre('save') hook
    const adminUser = new User({
        userId: 'USR-001',
        fullName: 'Abdulai Osman (Admin)',
        username: 'admin',
        email: 'admin@hospital.org',
        phone: '+233 24 100 0001',
        role: 'admin',
        password: 'Admin@123',
        mustChangePassword: false,
    });
    await adminUser.save();

    const nurseUser = new User({
        userId: 'USR-002',
        fullName: 'Midwife Abena Osei',
        username: 'nurse',
        email: 'abena.osei@hospital.org',
        phone: '+233 24 100 0002',
        role: 'midwife_nurse',
        password: 'Nurse@123',
        mustChangePassword: false,
    });
    await nurseUser.save();

    const recordsUser = new User({
        userId: 'USR-003',
        fullName: 'Kofi Appiah (Records)',
        username: 'records',
        email: 'records@hospital.org',
        phone: '+233 24 100 0003',
        role: 'records_officer',
        password: 'Records@123',
        mustChangePassword: false,
    });
    await recordsUser.save();

    console.log('[Seeder]: Seeding 20 realistic anonymized patient records...');
    const firstNames = ['Ama', 'Akosua', 'Adwoa', 'Yaa', 'Afia', 'Abena', 'Efua', 'Grace', 'Mercy', 'Comfort', 'Esi', 'Evelyn', 'Janet', 'Sarah', 'Patience', 'Rita', 'Gladys', 'Dorothy', 'Elizabeth', 'Hannah'];
    const lastNames = ['Mensah', 'Osei', 'Appiah', 'Owusu', 'Boateng', 'Agyei', 'Kwarteng', 'Donkor', 'Asare', 'Frimpong', 'Addai', 'Boadu', 'Gyasi', 'Aboagye', 'Annan', 'Baffoe', 'Adu', 'Sarpong', 'Oppong', 'Antwi'];
    const occupations = ['Trader', 'Teacher', 'Nurse', 'Hairdresser', 'Banker', 'Tailor', 'Civil Servant', 'Student', 'Accountant', 'Farmer'];
    const maritalStatuses = ['Married', 'Married', 'Married', 'Single', 'Married'];

    const patients = [];
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < 20; i++) {
        const fn = firstNames[i];
        const ln = lastNames[i];
        const birthYear = 1990 + (i % 12);
        const dob = new Date(birthYear, i % 12, 10 + (i % 18));
        const pId = `PAT-${currentYear}-${(i + 1).toString().padStart(4, '0')}`;
        const mrn = `MRN-${currentYear}-${(i + 1).toString().padStart(4, '0')}`;

        const pat = new Patient({
            patientId: pId,
            fullName: `${fn} ${ln}`,
            dob,
            phone: `+233 24 555 ${(1000 + i).toString()}`,
            altPhone: `+233 20 777 ${(1000 + i).toString()}`,
            address: `House No. ${12 + i}, Block ${String.fromCharCode(65 + (i % 6))}, Ridge, Accra`,
            emergencyContactName: `Kwadwo ${ln}`,
            emergencyContactNumber: `+233 24 888 ${(1000 + i).toString()}`,
            maritalStatus: maritalStatuses[i % maritalStatuses.length],
            occupation: occupations[i % occupations.length],
            nationality: 'Ghanaian',
            registrationDate: new Date(2026, 0, 5 + i),
            medicalRecordNumber: mrn,
            notes: 'Demo anonymized hospital record for ANC/PNC management testing.',
            status: 'active',
        });
        await pat.save();
        patients.push(pat);
    }

    console.log('[Seeder]: Seeding pregnancies, ANC visits, appointments, deliveries, babies, and PNC records...');

    // 1. Patient 0-9: Active Pregnancies with sequential ANC visits
    for (let i = 0; i < 10; i++) {
        const pat = patients[i];
        const lmpMonth = (i % 5) + 1; // Feb to Jun 2026
        const lmp = new Date(2026, lmpMonth, 10);
        const prgId = `PRG-${currentYear}-${(i + 1).toString().padStart(4, '0')}`;

        const preg = new Pregnancy({
            pregnancyId: prgId,
            patient: pat._id,
            patientId: pat.patientId,
            pregnancyNumber: (i % 3) + 1,
            gravida: (i % 3) + 1,
            para: (i % 2),
            lmp,
            status: 'Active',
            previousHistory: i % 2 === 0 ? 'No past pregnancy complications' : 'Previous normal vaginal delivery',
            notes: 'Routine active ANC tracking',
        });
        await preg.save();

        // Add 2 to 4 ANC visits per active pregnancy
        const visitCount = 2 + (i % 3);
        for (let v = 1; v <= visitCount; v++) {
            const visitDate = new Date(lmp.getTime() + v * 30 * 24 * 60 * 60 * 1000);
            const gaWeeks = v * 4 + 8;
            const ancId = `ANC-${currentYear}-${(i * 4 + v).toString().padStart(4, '0')}`;

            const anc = new ANCVisit({
                ancVisitId: ancId,
                patient: pat._id,
                patientId: pat.patientId,
                pregnancy: preg._id,
                pregnancyId: preg.pregnancyId,
                visitDate,
                gestationalAgeWeeks: gaWeeks,
                visitNumber: v,
                weight: 62 + v * 1.5,
                bloodPressure: v === 3 && i === 2 ? '135/85' : '118/78',
                temperature: 36.6,
                pulseRate: 76,
                respiratoryRate: 18,
                fundalHeight: gaWeeks - 2,
                fetalHeartRate: 142 + (v % 5),
                fetalMovement: 'Present',
                generalObservations: 'Patient is healthy and well-nourished.',
                staffRiskFlags: v === 3 && i === 2 ? 'Mild BP elevation - monitor next visit' : 'Normal Routine ANC',
                investigations: [
                    { testName: 'Hemoglobin (Hb)', testDate: visitDate, result: `${11.5 + (v % 2)} g/dL`, remarks: 'Normal' },
                    { testName: 'Urinalysis Protein', testDate: visitDate, result: 'Negative', remarks: 'Normal' },
                ],
                medications: [
                    { name: 'Ferrous Fumarate (Iron)', dosage: '200mg', frequency: 'Daily', startDate: visitDate, notes: 'Take after meals' },
                    { name: 'Folic Acid', dosage: '5mg', frequency: 'Daily', startDate: visitDate, notes: 'Routine supplement' },
                ],
                nextAppointmentDate: new Date(visitDate.getTime() + 28 * 24 * 60 * 60 * 1000),
                clinicalNotes: `Routine ANC visit #${v} completed.`,
                recordedBy: nurseUser._id,
            });
            await anc.save();

            // Seed Lab & Medication Records
            await LaboratoryRecord.create({
                labRecordId: `LAB-${currentYear}-${(i * 4 + v).toString().padStart(4, '0')}`,
                patient: pat._id,
                patientId: pat.patientId,
                ancVisitId: anc.ancVisitId,
                testName: 'Hemoglobin (Hb)',
                testDate: visitDate,
                result: `${11.5 + (v % 2)} g/dL`,
                remarks: 'Normal Hb levels recorded during ANC Visit',
                recordedBy: nurseUser._id,
                recordedByName: nurseUser.fullName,
            });

            await MedicationRecord.create({
                medRecordId: `MED-${currentYear}-${(i * 4 + v).toString().padStart(4, '0')}`,
                patient: pat._id,
                patientId: pat.patientId,
                visitRef: anc.ancVisitId,
                medicationName: 'Ferrous Fumarate + Folic Acid',
                dosage: '200mg / 5mg',
                frequency: 'Daily',
                startDate: visitDate,
                instructions: 'Routine antenatal iron & folate supplementation',
                recordedBy: nurseUser._id,
                recordedByName: nurseUser.fullName,
            });
        }

        // Schedule next upcoming appointment
        const aptDate = new Date();
        aptDate.setDate(aptDate.getDate() + (i + 1) * 3);
        await Appointment.create({
            appointmentId: `APT-${currentYear}-${(i + 1).toString().padStart(4, '0')}`,
            patient: pat._id,
            patientId: pat.patientId,
            type: 'ANC',
            appointmentDate: aptDate,
            appointmentTime: `${9 + (i % 4)}:00 AM`,
            reason: `Routine ANC Follow-up Visit #${visitCount + 1}`,
            assignedStaff: nurseUser._id,
            assignedStaffName: nurseUser.fullName,
            status: 'Upcoming',
            notes: 'Check blood pressure and fetal growth',
            recordedBy: nurseUser._id,
        });
    }

    // 2. Patient 10-15: Delivered Pregnancies with Deliveries, Babies, and PNC Visits
    for (let i = 10; i < 16; i++) {
        const pat = patients[i];
        const lmp = new Date(2025, 9, 10 + i);
        const delDate = new Date(2026, 6, 15 + (i - 10));
        const prgId = `PRG-${currentYear}-${(i + 1).toString().padStart(4, '0')}`;

        const preg = new Pregnancy({
            pregnancyId: prgId,
            patient: pat._id,
            patientId: pat.patientId,
            pregnancyNumber: 2,
            gravida: 2,
            para: 2,
            lmp,
            status: 'Delivered',
            previousHistory: 'Spontaneous vaginal delivery in 2023',
            notes: 'Successfully delivered at hospital ward.',
        });
        await preg.save();

        const delId = `DEL-${currentYear}-${(i - 9).toString().padStart(4, '0')}`;
        const mode = i % 2 === 0 ? 'Vaginal delivery' : 'Caesarean section';
        const isTwin = i === 12; // Patient 12 has twins

        const del = new Delivery({
            deliveryId: delId,
            patient: pat._id,
            patientId: pat.patientId,
            pregnancy: preg._id,
            pregnancyId: preg.pregnancyId,
            deliveryDate: delDate,
            deliveryTime: `${10 + i}:30 AM`,
            placeOfDelivery: 'Hospital Maternity Ward',
            modeOfDelivery: mode,
            outcome: 'Live birth',
            numberOfBabies: isTwin ? 2 : 1,
            maternalNotes: 'Mother stable post delivery. Normal blood loss.',
            additionalNotes: isTwin ? 'Twin delivery completed successfully.' : 'Normal healthy delivery.',
            recordedBy: nurseUser._id,
        });
        await del.save();

        // Register Babies
        const bCount = isTwin ? 2 : 1;
        const babyIds = [];
        for (let b = 1; b <= bCount; b++) {
            const bby = new Baby({
                babyId: `BBY-${currentYear}-${(i * 2 + b).toString().padStart(4, '0')}`,
                mother: pat._id,
                motherPatientId: pat.patientId,
                delivery: del._id,
                deliveryId: del.deliveryId,
                dob: delDate,
                timeOfBirth: `${10 + i}:${30 + b * 5} AM`,
                sex: (b + i) % 2 === 0 ? 'Male' : 'Female',
                birthWeight: 3.1 + b * 0.2,
                birthLength: 49 + b,
                headCircumference: 34,
                apgar1Min: 8,
                apgar5Min: 10,
                immunizationsGiven: ['BCG', 'OPV-0', 'Hepatitis B-0'],
                feedingMethod: 'Exclusive Breastfeeding',
                followUpNotes: 'Healthy baby, active cry, good latch.',
                recordedBy: nurseUser._id,
            });
            await bby.save();
            babyIds.push(bby);
        }

        // Register 2 PNC Visits per delivery
        for (let p = 1; p <= 2; p++) {
            const pncDate = new Date(delDate.getTime() + (p === 1 ? 1 : 7) * 24 * 60 * 60 * 1000);
            await PNCVisit.create({
                pncVisitId: `PNC-${currentYear}-${(i * 2 + p).toString().padStart(4, '0')}`,
                patient: pat._id,
                patientId: pat.patientId,
                delivery: del._id,
                deliveryId: del.deliveryId,
                visitDate: pncDate,
                visitNumber: p,
                motherWeight: 65 - p,
                motherBloodPressure: '116/76',
                motherTemperature: 36.5,
                motherPulse: 72,
                generalObservations: 'Mother recovering smoothly. No fever or excessive bleeding.',
                breastfeedingInformation: 'Exclusive breastfeeding well established.',
                lochiaAssessment: p === 1 ? 'Lochia rubra, normal amount' : 'Lochia serosa, diminishing',
                perineumHealing: mode === 'Vaginal delivery' ? 'Episiotomy wound clean and healing' : 'C-Section incision clean and dry',
                motherMedications: 'Paracetamol 500mg TDS, Multivitamin Daily',
                motherClinicalNotes: `PNC Visit #${p} complete. Mother and baby both healthy.`,
                babyAssessments: babyIds.map((bby) => ({
                    baby: bby._id,
                    babyId: bby.babyId,
                    weight: bby.birthWeight + (p === 2 ? 0.2 : 0),
                    temperature: 36.7,
                    feedingInformation: 'Active breastfeeding every 2-3 hours',
                    immunizationInformation: 'BCG and OPV-0 administered at birth',
                    generalObservations: 'Normal reflex and activity.',
                })),
                recordedBy: nurseUser._id,
            });
        }

        // Schedule PNC follow-up appointment
        await Appointment.create({
            appointmentId: `APT-${currentYear}-${(i + 1).toString().padStart(4, '0')}`,
            patient: pat._id,
            patientId: pat.patientId,
            type: 'PNC',
            appointmentDate: new Date(delDate.getTime() + 42 * 24 * 60 * 60 * 1000), // 6-week PNC
            appointmentTime: '10:00 AM',
            reason: '6-Week Postnatal Checkup for Mother & Baby',
            assignedStaff: nurseUser._id,
            assignedStaffName: nurseUser.fullName,
            status: 'Upcoming',
            notes: '6-week maternal recovery & infant immunization check',
            recordedBy: nurseUser._id,
        });
    }

    // 3. Today's & Missed appointments for demonstration
    const todayAptDate = new Date();
    await Appointment.create({
        appointmentId: `APT-${currentYear}-9901`,
        patient: patients[0]._id,
        patientId: patients[0].patientId,
        type: 'ANC',
        appointmentDate: todayAptDate,
        appointmentTime: '08:30 AM',
        reason: 'Today Routine ANC Review',
        assignedStaff: nurseUser._id,
        assignedStaffName: nurseUser.fullName,
        status: 'Upcoming',
        notes: 'Check blood pressure & lab test results',
        recordedBy: nurseUser._id,
    });

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    await Appointment.create({
        appointmentId: `APT-${currentYear}-9902`,
        patient: patients[1]._id,
        patientId: patients[1].patientId,
        type: 'ANC',
        appointmentDate: pastDate,
        appointmentTime: '02:00 PM',
        reason: 'Missed Routine ANC Follow-up',
        assignedStaff: nurseUser._id,
        assignedStaffName: nurseUser.fullName,
        status: 'Missed',
        notes: 'Patient did not show up. Phone call reminder recommended.',
        recordedBy: nurseUser._id,
    });

    console.log('[Seeder]: Seeding Audit Log history...');
    await AuditLog.create([
        {
            userName: adminUser.fullName,
            userRole: 'admin',
            action: 'SYSTEM_INIT',
            module: 'System',
            description: 'System initial database seed executed successfully with fake anonymized demo data.',
        },
        {
            userName: nurseUser.fullName,
            userRole: 'midwife_nurse',
            action: 'PATIENT_CREATE',
            module: 'Patients',
            recordId: patients[0].patientId,
            description: `Registered new patient '${patients[0].fullName}' (${patients[0].patientId}).`,
        },
        {
            userName: nurseUser.fullName,
            userRole: 'midwife_nurse',
            action: 'ANC_VISIT_CREATE',
            module: 'ANC',
            recordId: 'ANC-2026-0001',
            description: `Recorded routine ANC Visit #1 for patient '${patients[0].fullName}'.`,
        },
    ]);

    console.log('=======================================================');
    console.log('  DATABASE SEEDED SUCCESSFULLY WITH ANONYMIZED DEMO DATA');
    console.log('  Admin User:   username="admin"   password="Admin@123"');
    console.log('  Nurse User:   username="nurse"   password="Nurse@123"');
    console.log('  Records User: username="records" password="Records@123"');
    console.log('=======================================================');
    process.exit(0);
};

seedData();
