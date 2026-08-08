/* ==========================================================================
   PATIENT RECORDS MANAGEMENT MODULE
   ========================================================================== */

let allPatientsCache = [];

async function loadPatientsView() {
  const container = document.getElementById('view-content');

  container.innerHTML = `
    <div class="custom-card">
      <div class="card-header flex-wrap gap-2">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-people-fill fs-4 text-primary"></i>
          <div>
            <h5 class="card-title">Patient Directory</h5>
            <small class="text-muted">Master database of registered hospital patients</small>
          </div>
        </div>

        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-primary btn-sm fw-semibold shadow-sm" data-bs-toggle="modal" data-bs-target="#modal-register-patient" onclick="openRegisterPatientModal()">
            <i class="bi bi-person-plus-fill me-1"></i> Register New Patient
          </button>
        </div>
      </div>

      <div class="card-body">
        <!-- Search & Filter Controls -->
        <div class="row g-2 mb-3">
          <div class="col-md-6">
            <div class="input-group">
              <span class="input-group-text bg-light"><i class="bi bi-search text-muted"></i></span>
              <input type="text" id="input-search-patients" class="form-control" placeholder="Search by Name, Patient ID, Phone, or MRN..." onkeyup="filterPatientsTable()">
            </div>
          </div>
          <div class="col-md-3">
            <select id="select-filter-status" class="form-select" onchange="filterPatientsTable()">
              <option value="all">All Statuses</option>
              <option value="active" selected>Active Patients Only</option>
              <option value="inactive">Inactive Patients</option>
            </select>
          </div>
          <div class="col-md-3 text-end">
            <span id="patient-count-badge" class="badge bg-light text-dark border p-2">Total Records: 0</span>
          </div>
        </div>

        <!-- Patients Table -->
        <div class="table-responsive">
          <table class="table table-custom align-middle">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Full Name</th>
                <th>Age</th>
                <th>Phone</th>
                <th>Emergency Contact</th>
                <th>MRN</th>
                <th>Status</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody id="tbl-patients-body">
              <tr><td colspan="8" class="text-center py-4 text-muted">Loading patient records...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  await fetchPatients();
}

async function fetchPatients() {
  try {
    const res = await apiRequest('/patients');
    if (res.success) {
      allPatientsCache = res.patients;
      filterPatientsTable();
    }
  } catch (err) {
    console.error('Failed to fetch patients:', err);
  }
}

function filterPatientsTable() {
  const searchInput = document.getElementById('input-search-patients');
  const search = searchInput ? searchInput.value.toLowerCase() : '';
  const statusFilterEl = document.getElementById('select-filter-status');
  const statusFilter = statusFilterEl ? statusFilterEl.value : 'all';
  const tbody = document.getElementById('tbl-patients-body');

  if (!tbody) return;

  const filtered = allPatientsCache.filter((p) => {
    const matchesSearch = p.fullName.toLowerCase().includes(search) ||
      p.patientId.toLowerCase().includes(search) ||
      (p.phone && p.phone.includes(search)) ||
      (p.medicalRecordNumber && p.medicalRecordNumber.toLowerCase().includes(search));
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const badge = document.getElementById('patient-count-badge');
  if (badge) badge.innerText = `Total Records: ${filtered.length}`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No patient records matching search criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((p) => `
    <tr>
      <td><span class="badge bg-light text-primary border fw-semibold">${p.patientId}</span></td>
      <td>
        <strong class="text-dark cursor-pointer text-decoration-underline-hover" onclick="viewPatientProfile('${p._id}')">${p.fullName}</strong>
      </td>
      <td>${p.age || 'N/A'} yrs</td>
      <td>${p.phone}</td>
      <td><small>${p.emergencyContactName || '-'}<br><span class="text-muted">${p.emergencyContactNumber || ''}</span></small></td>
      <td><small class="text-muted">${p.medicalRecordNumber}</small></td>
      <td>
        <span class="badge ${p.status === 'active' ? 'bg-success-subtle text-success border border-success' : 'bg-secondary-subtle text-secondary border'}">
          ${p.status ? p.status.toUpperCase() : 'ACTIVE'}
        </span>
      </td>
      <td class="text-end">
        <div class="btn-group btn-group-sm" role="group">
          <button class="btn btn-outline-primary" title="View 360 Profile" onclick="viewPatientProfile('${p._id}')">
            <i class="bi bi-eye-fill me-1"></i> View
          </button>
          <button class="btn btn-outline-secondary" title="Edit Patient" data-bs-toggle="modal" data-bs-target="#modal-edit-patient" onclick="openEditPatientModal('${p._id}')">
            <i class="bi bi-pencil-square me-1"></i> Edit
          </button>
          <button class="btn btn-outline-danger" title="Delete Patient" data-bs-toggle="modal" data-bs-target="#modal-delete-patient" onclick="confirmDeletePatient('${p._id}', '${escapeHtml(p.fullName)}')">
            <i class="bi bi-trash3-fill me-1"></i> Delete
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function openRegisterPatientModal() {
  const form = document.getElementById('form-register-patient');
  if (form) form.reset();
  openModal('modal-register-patient');
}

// Handle Patient Registration Submit
document.getElementById('form-register-patient')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await apiRequest('/patients', 'POST', data);
    if (res.success) {
      showToast(res.message, 'success');
      closeModal('modal-register-patient');
      fetchPatients();
    }
  } catch (err) {
    // Error toast handled by apiRequest
  }
});

// Edit Patient Modal Handler
async function openEditPatientModal(patientMongoId) {
  try {
    const res = await apiRequest(`/patients/${patientMongoId}`);
    if (!res.success || !res.patient) return;
    const p = res.patient;

    document.getElementById('edit-patient-mongo-id').value = p._id;
    document.getElementById('edit-patient-id').value = p.patientId;
    document.getElementById('edit-patient-mrn').value = p.medicalRecordNumber;
    document.getElementById('edit-patient-name').value = p.fullName || '';
    document.getElementById('edit-patient-dob').value = p.dob ? p.dob.split('T')[0] : '';
    document.getElementById('edit-patient-phone').value = p.phone || '';
    document.getElementById('edit-patient-altphone').value = p.altPhone || '';
    document.getElementById('edit-patient-address').value = p.address || '';
    document.getElementById('edit-patient-emerg-name').value = p.emergencyContactName || '';
    document.getElementById('edit-patient-emerg-phone').value = p.emergencyContactNumber || '';
    document.getElementById('edit-patient-marital').value = p.maritalStatus || 'Married';
    document.getElementById('edit-patient-occupation').value = p.occupation || '';
    document.getElementById('edit-patient-status').value = p.status || 'active';
    document.getElementById('edit-patient-notes').value = p.notes || '';

    openModal('modal-edit-patient');
  } catch (err) {
    console.error('Error fetching patient for edit:', err);
  }
}

// Submit Edit Patient Form
document.getElementById('form-edit-patient')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());
  const id = data.id;
  delete data.id;

  try {
    const res = await apiRequest(`/patients/${id}`, 'PUT', data);
    if (res.success) {
      showToast('Patient record updated successfully!', 'success');
      closeModal('modal-edit-patient');
      fetchPatients();
    }
  } catch (err) {
    // Error toast handled by apiRequest
  }
});

// Confirm & Delete Patient Handler
function confirmDeletePatient(patientMongoId, patientName) {
  document.getElementById('delete-patient-mongo-id').value = patientMongoId;
  document.getElementById('delete-patient-name-display').innerText = patientName || 'Patient Record';
  openModal('modal-delete-patient');
}

async function executeDeletePatient() {
  const id = document.getElementById('delete-patient-mongo-id').value;
  if (!id) return;

  try {
    const res = await apiRequest(`/patients/${id}`, 'DELETE');
    if (res.success) {
      showToast('Patient record permanently deleted.', 'success');
      closeModal('modal-delete-patient');
      fetchPatients();
    }
  } catch (err) {
    // Error toast handled by apiRequest
  }
}
