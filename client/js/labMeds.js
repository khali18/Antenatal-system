/* ==========================================================================
   LABORATORY & MEDICATION LOGS MODULE
   ========================================================================== */

async function loadLaboratoryView() {
    const container = document.getElementById('view-content');
    container.innerHTML = `
    <div class="custom-card">
      <div class="card-header">
        <h5 class="card-title"><i class="bi bi-vial me-2 text-primary"></i> Laboratory Investigations Register</h5>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-custom">
            <thead>
              <tr>
                <th>Lab Record ID</th>
                <th>Patient Name</th>
                <th>Test Name</th>
                <th>Test Date</th>
                <th>Result</th>
                <th>Remarks</th>
                <th>Recorded By</th>
              </tr>
            </thead>
            <tbody id="tbl-lab-body">
              <tr><td colspan="7" class="text-center py-4 text-muted">Loading laboratory records...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

    try {
        const res = await apiRequest('/laboratory');
        if (res.success) {
            const tbody = document.getElementById('tbl-lab-body');
            if (res.records.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No laboratory records found.</td></tr>`;
                return;
            }
            tbody.innerHTML = res.records.map((l) => `
        <tr>
          <td><span class="badge bg-light text-primary border">${l.labRecordId}</span></td>
          <td class="fw-semibold cursor-pointer text-primary" onclick="viewPatientProfile('${l.patient ? l.patient._id : l.patientId}')">${l.patient ? l.patient.fullName : l.patientId}</td>
          <td class="fw-bold">${l.testName}</td>
          <td>${l.testDate ? l.testDate.split('T')[0] : ''}</td>
          <td><strong>${l.result}</strong></td>
          <td><small>${l.remarks || 'Normal'}</small></td>
          <td><small class="text-muted">${l.recordedByName || 'Staff'}</small></td>
        </tr>
      `).join('');
        }
    } catch (err) {
        console.error('Failed to load lab records:', err);
    }
}

async function loadMedicationsView() {
    const container = document.getElementById('view-content');
    container.innerHTML = `
    <div class="custom-card">
      <div class="card-header">
        <h5 class="card-title"><i class="bi bi-capsule me-2 text-primary"></i> Prescriptions & Medication Logs</h5>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-custom">
            <thead>
              <tr>
                <th>Med Record ID</th>
                <th>Patient Name</th>
                <th>Medication / Supplement</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Start Date</th>
                <th>Instructions</th>
              </tr>
            </thead>
            <tbody id="tbl-meds-body">
              <tr><td colspan="7" class="text-center py-4 text-muted">Loading medication logs...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

    try {
        const res = await apiRequest('/medications');
        if (res.success) {
            const tbody = document.getElementById('tbl-meds-body');
            if (res.records.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No medication records found.</td></tr>`;
                return;
            }
            tbody.innerHTML = res.records.map((m) => `
        <tr>
          <td><span class="badge bg-light text-primary border">${m.medRecordId}</span></td>
          <td class="fw-semibold cursor-pointer text-primary" onclick="viewPatientProfile('${m.patient ? m.patient._id : m.patientId}')">${m.patient ? m.patient.fullName : m.patientId}</td>
          <td class="fw-bold">${m.medicationName}</td>
          <td>${m.dosage}</td>
          <td>${m.frequency}</td>
          <td>${m.startDate ? m.startDate.split('T')[0] : ''}</td>
          <td><small>${m.instructions || '-'}</small></td>
        </tr>
      `).join('');
        }
    } catch (err) {
        console.error('Failed to load medication records:', err);
    }
}
