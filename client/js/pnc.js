/* ==========================================================================
   POSTNATAL CARE (PNC) VISITS MODULE
   ========================================================================== */

function openNewPNCVisitModal(patientMongoId, deliveryMongoId, motherFullName) {
  const form = document.getElementById('form-new-pnc-visit');
  if (form) {
    form.reset();
    form.visitDate.value = new Date().toISOString().split('T')[0];
  }
  document.getElementById('pnc-modal-patient-id').value = patientMongoId || '';
  document.getElementById('pnc-modal-delivery-id').value = deliveryMongoId || '';
  document.getElementById('pnc-modal-patient-name').value = motherFullName || '';

  openModal('modal-new-pnc-visit');
}

// Handle Record PNC Visit Submit
document.getElementById('form-new-pnc-visit')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await apiRequest('/pnc-visits', 'POST', data);
    if (res.success) {
      showToast(res.message, 'success');
      closeModal('modal-new-pnc-visit');
      if (typeof currentActiveProfileData !== 'undefined' && currentActiveProfileData && currentActiveProfileData.patient._id === data.patientId) {
        viewPatientProfile(data.patientId);
      } else {
        loadView('pnc-visits');
      }
    }
  } catch (err) {
    // Error handled by apiRequest
  }
});

async function loadPNCVisitsView() {
  const container = document.getElementById('view-content');
  container.innerHTML = `
    <div class="custom-card">
      <div class="card-header">
        <h5 class="card-title"><i class="bi bi-bandaid me-2 text-primary"></i> Master Postnatal Care (PNC) Visit Logs</h5>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-custom align-middle">
            <thead>
              <tr>
                <th>PNC Visit ID</th>
                <th>Mother Name</th>
                <th>Visit Date</th>
                <th>Visit #</th>
                <th>Mother Weight</th>
                <th>Blood Pressure</th>
                <th>Lochia Assessment</th>
              </tr>
            </thead>
            <tbody id="tbl-pnc-visits-body">
              <tr><td colspan="7" class="text-center py-4 text-muted">Loading PNC visit records...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  try {
    const res = await apiRequest('/pnc-visits');
    if (res.success) {
      const tbody = document.getElementById('tbl-pnc-visits-body');
      if (!tbody) return;
      if (res.visits.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No PNC visits recorded yet.</td></tr>`;
        return;
      }
      tbody.innerHTML = res.visits.map((p) => `
        <tr>
          <td><span class="badge bg-light text-primary border">${p.pncVisitId}</span></td>
          <td class="fw-semibold cursor-pointer text-primary" onclick="viewPatientProfile('${p.patient ? p.patient._id : p.patientId}')">${p.patient ? p.patient.fullName : p.patientId}</td>
          <td>${p.visitDate ? p.visitDate.split('T')[0] : ''}</td>
          <td><span class="badge bg-light text-dark border">Visit #${p.visitNumber}</span></td>
          <td>${p.motherWeight || '-'} kg</td>
          <td><strong>${p.motherBloodPressure || '-'}</strong></td>
          <td><small>${p.lochiaAssessment || 'Normal'}</small></td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load PNC visits:', err);
  }
}
