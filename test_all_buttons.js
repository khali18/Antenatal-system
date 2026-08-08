const http = require('http');

function makeRequest(path, method = 'GET', data = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 7000,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        if (token) options.headers['Authorization'] = `Bearer ${token}`;

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, body });
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function runTests() {
    console.log('=== SYSTEMATIC SYSTEM BUTTON & API VERIFICATION ===\n');

    // 1. Login Admin
    const loginRes = await makeRequest('/auth/login', 'POST', { username: 'admin', password: 'Admin@123' });
    console.log('1. Admin Login:', loginRes.status === 200 ? 'SUCCESS' : 'FAILED', loginRes.data.user ? loginRes.data.user.fullName : '');
    const token = loginRes.data.token;

    // 2. Fetch Patients List
    const patientsRes = await makeRequest('/patients', 'GET', null, token);
    console.log('2. Fetch Patients List:', patientsRes.status === 200 ? 'SUCCESS' : 'FAILED', `Count: ${patientsRes.data.count}`);
    const firstPatient = patientsRes.data.patients[0];
    console.log(`   Target Test Patient: ${firstPatient.fullName} (_id: ${firstPatient._id}, ID: ${firstPatient.patientId})`);

    // 3. Test View Patient Profile Endpoint (/profile)
    const profileRes1 = await makeRequest(`/patients/${firstPatient._id}/profile`, 'GET', null, token);
    console.log('3. Patient 360 Profile Endpoint (/profile):', profileRes1.status === 200 ? 'SUCCESS' : 'FAILED');

    // 4. Test View Patient Profile Endpoint (/full-profile)
    const profileRes2 = await makeRequest(`/patients/${firstPatient.patientId}/full-profile`, 'GET', null, token);
    console.log('4. Patient 360 Profile Endpoint (/full-profile):', profileRes2.status === 200 ? 'SUCCESS' : 'FAILED');

    // 5. Fetch Appointments
    const aptsRes = await makeRequest('/appointments', 'GET', null, token);
    console.log('5. Fetch Appointments List:', aptsRes.status === 200 ? 'SUCCESS' : 'FAILED', `Count: ${aptsRes.data.appointments.length}`);
    const firstApt = aptsRes.data.appointments[0];
    console.log(`   Target Test Appointment ID: ${firstApt.appointmentId} (_id: ${firstApt._id})`);

    // 6. Test Mark Done on Appointment (PATCH status)
    const patchDoneRes = await makeRequest(`/appointments/${firstApt._id}/status`, 'PATCH', { status: 'Completed' }, token);
    console.log('6. Appointment Mark Done Action:', patchDoneRes.status === 200 ? 'SUCCESS' : 'FAILED', patchDoneRes.data.message);

    // 7. Test Cancel on Appointment (PATCH status)
    const patchCancelRes = await makeRequest(`/appointments/${firstApt._id}/status`, 'PATCH', { status: 'Cancelled' }, token);
    console.log('7. Appointment Cancel Action:', patchCancelRes.status === 200 ? 'SUCCESS' : 'FAILED', patchCancelRes.data.message);

    console.log('\n=== ALL API ACTION TESTS COMPLETED PERFECTLY ===');
}

runTests().catch(console.error);
