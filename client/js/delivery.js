/* ==========================================================================
   DELIVERY RECORDS MODULE
   ========================================================================== */

function openRecordDeliveryModal(patientMongoId, pregnancyMongoId, patientFullName) {
  const form = document.getElementById('form-record-delivery');
  if (form) {
    form.reset();
    form.deliveryDate.value = new Date().toISOString().split('T')[0];
  }
  document.getElementById('delivery-modal-patient-id').value = patientMongoId || '';
  document.getElementById('delivery-modal-pregnancy-id').value = pregnancyMongoId || '';
  document.getElementById('delivery-modal-patient-name').value = patientFullName || '';

  openModal('modal-record-delivery');
}

// Handle Record Delivery Submit
document.getElementById('form-record-delivery')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await apiRequest('/deliveries', 'POST', data);
    if (res.success) {
      showToast(res.message, 'success');
      closeModal('modal-record-delivery');
      if (typeof currentActiveProfileData !== 'undefined' && currentActiveProfileData && currentActiveProfileData.patient._id === data.patientId) {
        viewPatientProfile(data.patientId);
      } else {
        loadView('deliveries');
      }
    }
  } catch (err) {
    // Error handled by apiRequest
  }
});

async function loadDeliveriesView() {
  const container = document.getElementById('view-content');
  container.innerHTML = `
    <div class="custom-card">
      <div class="card-header">
        <h5 class="card-title"><i class="bi bi-hospital me-2 text-primary"></i> Master Labor & Delivery Register</h5>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-custom align-middle">
            <thead>
              <tr>
                <th>Delivery ID</th>
                <th>Mother Name</th>
                <th>Delivery Date</th>
                <th>Mode of Delivery</th>
                <th>Outcome</th>
                <th>Babies</th>
                <th>Place of Delivery</th>
              </tr>
            </thead>
            <tbody id="tbl-deliveries-body">
              <tr><td colspan="7" class="text-center py-4 text-muted">Loading delivery records...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  try {
    const res = await apiRequest('/deliveries');
    if (res.success) {
      const tbody = document.getElementById('tbl-deliveries-body');
      if (!tbody) return;
      if (res.deliveries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No delivery records found.</td></tr>`;
        return;
      }
      tbody.innerHTML = res.deliveries.map((d) => `
        <tr>
          <td><span class="badge bg-light text-primary border">${d.deliveryId}</span></td>
          <td class="fw-semibold cursor-pointer text-primary" onclick="viewPatientProfile('${d.patient ? d.patient._id : d.patientId}')">${d.patient ? d.patient.fullName : d.patientId}</td>
          <td>${d.deliveryDate ? d.deliveryDate.split('T')[0] : ''}</td>
          <td><span class="badge bg-light text-dark border">${d.modeOfDelivery}</span></td>
          <td><span class="badge bg-success-subtle text-success border border-success">${d.outcome}</span></td>
          <td><strong>${d.numberOfBabies}</strong></td>
          <td><small>${d.placeOfDelivery}</small></td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load deliveries:', err);
  }
}
