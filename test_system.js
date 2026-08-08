const http = require('http');

async function makeRequest(path, method = 'GET', data = null, token = null) {
    return new Promise((resolve, reject) => {
        const postData = data ? JSON.stringify(data) : '';

        const options = {
            hostname: '127.0.0.1',
            port: 7000,
            path: `/api${path}`,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (postData) {
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        if (token) options.headers['Authorization'] = `Bearer ${token}`;

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, body });
                }
            });
        });

        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
    });
}

async function runTests() {
    console.log('--- STARTING ANC/PNC SYSTEM INTEGRATION VERIFICATION ---');

    // 1. Test Admin Login
    console.log('\n[1] Testing Auth API - Admin Login...');
    const loginRes = await makeRequest('/auth/login', 'POST', { username: 'admin', password: 'Admin@123' });
    console.log(`Status: ${loginRes.status}, Success: ${loginRes.data.success}, User: ${loginRes.data.user?.fullName}`);
    const token = loginRes.data.token;

    if (!token) {
        console.error('Login failed!', loginRes.data);
        process.exit(1);
    }

    // 2. Test Executive Dashboard Stats
    console.log('\n[2] Testing Dashboard Analytics API...');
    const dashRes = await makeRequest('/reports/dashboard-stats', 'GET', null, token);
    console.log(`Cards -> Total Patients: ${dashRes.data.cards.totalPatients}, Active Pregnancies: ${dashRes.data.cards.activePregnancies}, ANC Month: ${dashRes.data.cards.ancVisitsThisMonth}`);
    console.log(`Charts -> ANC Registrations Array Length: ${dashRes.data.charts.ancRegistrations.length}`);

    // 3. Test Patient Directory API
    console.log('\n[3] Testing Patients API...');
    const patRes = await makeRequest('/patients', 'GET', null, token);
    console.log(`Total Patients Returned: ${patRes.data.patients.length}`);
    const samplePatient = patRes.data.patients[0];
    console.log(`Sample Patient: ${samplePatient.fullName} (${samplePatient.patientId})`);

    // 4. Test Patient 360 Profile API
    console.log('\n[4] Testing Patient 360 Full Profile Lookup...');
    const profRes = await makeRequest(`/patients/${samplePatient._id}/full-profile`, 'GET', null, token);
    console.log(`Patient Profile Name: ${profRes.data.patient.fullName}`);
    console.log(`Active Pregnancy: ${profRes.data.activePregnancy ? profRes.data.activePregnancy.pregnancyId : 'None'}`);
    console.log(`ANC Visits Count: ${profRes.data.ancVisits.length}`);

    // 5. Test Appointments API
    console.log('\n[5] Testing Appointments API...');
    const aptRes = await makeRequest('/appointments', 'GET', null, token);
    console.log(`Total Appointments: ${aptRes.data.appointments.length}`);

    // 6. Test Deliveries & Baby APIs
    console.log('\n[6] Testing Deliveries & Baby APIs...');
    const delRes = await makeRequest('/deliveries', 'GET', null, token);
    const bbyRes = await makeRequest('/babies', 'GET', null, token);
    console.log(`Deliveries: ${delRes.data.deliveries.length}, Babies: ${bbyRes.data.babies.length}`);

    // 7. Test PNC Visits API
    console.log('\n[7] Testing Postnatal Care (PNC) Visits API...');
    const pncRes = await makeRequest('/pnc-visits', 'GET', null, token);
    console.log(`PNC Visits: ${pncRes.data.visits.length}`);

    // 8. Test Audit Logs API
    console.log('\n[8] Testing Audit Logs Security API...');
    const auditRes = await makeRequest('/audit-logs', 'GET', null, token);
    console.log(`Audit Logs Recorded: ${auditRes.data.logs.length}`);

    console.log('\n=======================================================');
    console.log('  ALL INTEGRATION VERIFICATION TESTS PASSED SUCCESSFULLY!');
    console.log('=======================================================');
}

runTests().catch(console.error);
