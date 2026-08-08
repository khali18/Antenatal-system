/* ==========================================================================
   ANTENATAL (ANC) VISITS MODULE
   ========================================================================== */

function openNewANCVisitModal(patientMongoId, pregnancyMongoId, patientFullName) {
  const form = document.getElementById('form-new-anc-visit');
  if (form) form.reset();
  document.getElementById('anc-modal-patient-id').value = patientMongoId || '';
  document.getElementById('anc-modal-pregnancy-id').value = pregnancyMongoId || '';
  document.getElementById('anc-modal-patient-name').value = patientFullName || '';
  document.getElementById('anc-visit-date').value = new Date().toISOString().split('T')[0];

  openModal('modal-new-anc-visit');
}

// Handle Record ANC Visit Submit
document.getElementById('form-new-anc-visit')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await apiRequest('/anc-visits', 'POST', data);
    if (res.success) {
      showToast(res.message, 'success');
      closeModal('modal-new-anc-visit');
      if (typeof currentActiveProfileData !== 'undefined' && currentActiveProfileData && currentActiveProfileData.patient._id === data.patientId) {
        viewPatientProfile(data.patientId);
      } else {
        loadView('anc-visits');
      }
    }
  } catch (err) {
    // Error handled by apiRequest
  }
});

async function loadANCVisitsView() {
  const container = document.getElementById('view-content');
  container.innerHTML = `
    <div class="custom-card">
      <div class="card-header">
        <h5 class="card-title"><i class="bi bi-journal-medical me-2 text-primary"></i> Master Antenatal Care (ANC) Visit Logs</h5>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-custom align-middle">
            <thead>
              <tr>
                <th>ANC ID</th>
                <th>Patient Name</th>
                <th>Visit Date</th>
                <th>GA (Wks)</th>
                <th>Visit #</th>
                <th>Weight</th>
                <th>Blood Pressure</th>
                <th>FHR</th>
                <th>Risk Tag / Staff Flags</th>
              </tr>
            </thead>
            <tbody id="tbl-anc-visits-body">
              <tr><td colspan="9" class="text-center py-4 text-muted">Loading ANC visit records...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  try {
    const res = await apiRequest('/anc-visits');
    if (res.success) {
      const tbody = document.getElementById('tbl-anc-visits-body');
      if (!tbody) return;
      if (res.visits.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">No ANC visits recorded yet.</td></tr>`;
        return;
      }
      tbody.innerHTML = res.visits.map((v) => `
        <tr>
          <td><span class="badge bg-light text-primary border">${v.ancVisitId}</span></td>
          <td class="fw-semibold cursor-pointer text-primary" onclick="viewPatientProfile('${v.patient ? v.patient._id : v.patientId}')">${v.patient ? v.patient.fullName : v.patientId}</td>
          <td>${v.visitDate ? v.visitDate.split('T')[0] : ''}</td>
          <td>${v.gestationalAgeWeeks} wks</td>
          <td><span class="badge bg-light text-dark border">Visit #${v.visitNumber}</span></td>
          <td>${v.weight} kg</td>
          <td><strong>${v.bloodPressure}</strong></td>
          <td>${v.fetalHeartRate || '-'} bpm</td>
          <td><span class="badge bg-amber-subtle text-amber border">${v.staffRiskFlags || 'Normal Routine'}</span></td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load ANC visits:', err);
  }
}
