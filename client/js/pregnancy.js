/* ==========================================================================
   PREGNANCY RECORDS MODULE
   ========================================================================== */

function openRegisterPregnancyModal(patientMongoId, patientFullName) {
  const form = document.getElementById('form-register-pregnancy');
  if (form) form.reset();
  document.getElementById('pregnancy-modal-patient-id').value = patientMongoId || '';
  document.getElementById('pregnancy-modal-patient-name').value = patientFullName || '';
  document.getElementById('preview-edd-text').innerText = 'Estimated Delivery Date (EDD) will be calculated automatically.';

  openModal('modal-register-pregnancy');
}

function previewEDD(lmpDateStr) {
  if (!lmpDateStr) return;
  const lmp = new Date(lmpDateStr);
  const edd = new Date(lmp.getTime() + 280 * 24 * 60 * 60 * 1000);
  const formattedEDD = edd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const el = document.getElementById('preview-edd-text');
  if (el) el.innerHTML = `<i class="bi bi-check-circle-fill text-success me-1"></i> Auto-Calculated EDD: <strong>${formattedEDD}</strong> (40 Weeks)`;
}

// Handle Register Pregnancy Submit
document.getElementById('form-register-pregnancy')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await apiRequest('/pregnancies', 'POST', data);
    if (res.success) {
      showToast(res.message, 'success');
      closeModal('modal-register-pregnancy');
      if (typeof currentActiveProfileData !== 'undefined' && currentActiveProfileData && currentActiveProfileData.patient._id === data.patientId) {
        viewPatientProfile(data.patientId);
      } else {
        loadView('pregnancies');
      }
    }
  } catch (err) {
    // Error toast handled by apiRequest
  }
});

async function loadPregnanciesView() {
  const container = document.getElementById('view-content');
  container.innerHTML = `
    <div class="custom-card">
      <div class="card-header">
        <h5 class="card-title"><i class="bi bi-person-heart me-2 text-primary"></i> Master Pregnancy Register</h5>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-custom align-middle">
            <thead>
              <tr>
                <th>Pregnancy ID</th>
                <th>Patient Name</th>
                <th>Patient ID</th>
                <th>LMP Date</th>
                <th>EDD Date</th>
                <th>GA (Wks)</th>
                <th>Gravida / Para</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="tbl-pregnancies-body">
              <tr><td colspan="8" class="text-center py-4 text-muted">Loading pregnancy records...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  try {
    const res = await apiRequest('/pregnancies');
    if (res.success) {
      const tbody = document.getElementById('tbl-pregnancies-body');
      if (!tbody) return;
      if (res.pregnancies.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No pregnancy records found.</td></tr>`;
        return;
      }
      tbody.innerHTML = res.pregnancies.map((p) => `
        <tr>
          <td><span class="badge bg-light text-primary border">${p.pregnancyId}</span></td>
          <td class="fw-semibold cursor-pointer text-primary" onclick="viewPatientProfile('${p.patient ? p.patient._id : p.patientId}')">${p.patient ? p.patient.fullName : p.patientId}</td>
          <td><small class="text-muted">${p.patientId}</small></td>
          <td>${p.lmp ? p.lmp.split('T')[0] : ''}</td>
          <td><strong>${p.edd ? p.edd.split('T')[0] : ''}</strong></td>
          <td><span class="badge bg-info-subtle text-info border border-info">${p.gestationalAgeWeeks} wks</span></td>
          <td>G${p.gravida} P${p.para}</td>
          <td><span class="badge ${p.status === 'Active' ? 'bg-success' : 'bg-secondary'}">${p.status}</span></td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load pregnancies:', err);
  }
}
