/* ==========================================================================
   BABY RECORDS MODULE
   ========================================================================== */

function openRegisterBabyModal(motherMongoId, deliveryMongoId, motherFullName) {
  const form = document.getElementById('form-register-baby');
  if (form) {
    form.reset();
    form.dob.value = new Date().toISOString().split('T')[0];
  }
  document.getElementById('baby-modal-mother-id').value = motherMongoId || '';
  document.getElementById('baby-modal-delivery-id').value = deliveryMongoId || '';
  document.getElementById('baby-modal-mother-name').value = motherFullName || '';

  openModal('modal-register-baby');
}

// Handle Register Baby Submit
document.getElementById('form-register-baby')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await apiRequest('/babies', 'POST', data);
    if (res.success) {
      showToast(res.message, 'success');
      closeModal('modal-register-baby');
      if (typeof currentActiveProfileData !== 'undefined' && currentActiveProfileData && currentActiveProfileData.patient._id === data.motherPatientId) {
        viewPatientProfile(data.motherPatientId);
      } else {
        loadView('babies');
      }
    }
  } catch (err) {
    // Error handled by apiRequest
  }
});

async function loadBabiesView() {
  const container = document.getElementById('view-content');
  container.innerHTML = `
    <div class="custom-card">
      <div class="card-header">
        <h5 class="card-title"><i class="bi bi-emoji-smile-fill me-2 text-primary"></i> Registered Newborn Babies</h5>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-custom align-middle">
            <thead>
              <tr>
                <th>Baby ID</th>
                <th>Mother Name</th>
                <th>DOB</th>
                <th>Sex</th>
                <th>Birth Weight</th>
                <th>APGAR (1/5 min)</th>
                <th>Feeding Method</th>
              </tr>
            </thead>
            <tbody id="tbl-babies-body">
              <tr><td colspan="7" class="text-center py-4 text-muted">Loading baby records...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  try {
    const res = await apiRequest('/babies');
    if (res.success) {
      const tbody = document.getElementById('tbl-babies-body');
      if (!tbody) return;
      if (res.babies.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No baby records found.</td></tr>`;
        return;
      }
      tbody.innerHTML = res.babies.map((b) => `
        <tr>
          <td><span class="badge bg-light text-primary border">${b.babyId}</span></td>
          <td class="fw-semibold cursor-pointer text-primary" onclick="viewPatientProfile('${b.mother ? b.mother._id : b.motherPatientId}')">${b.mother ? b.mother.fullName : b.motherPatientId}</td>
          <td>${b.dob ? b.dob.split('T')[0] : ''}</td>
          <td>${b.sex}</td>
          <td><strong>${b.birthWeight} kg</strong></td>
          <td>${b.apgar1Min || '-'}/${b.apgar5Min || '-'}</td>
          <td>${b.feedingMethod}</td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load babies:', err);
  }
}
