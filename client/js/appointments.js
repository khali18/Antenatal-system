/* ==========================================================================
   APPOINTMENTS MODULE
   ========================================================================== */

async function openScheduleAppointmentForPatient(patientMongoId, patientFullName) {
  await populateAppointmentPatientSelect();
  const select = document.getElementById('select-appointment-patient');
  if (select && patientMongoId) select.value = patientMongoId;

  const form = document.getElementById('form-schedule-appointment');
  if (form) {
    const today = new Date().toISOString().split('T')[0];
    if (form.appointmentDate) form.appointmentDate.value = today;
  }

  openModal('modal-schedule-appointment');
}

async function populateAppointmentPatientSelect() {
  const select = document.getElementById('select-appointment-patient');
  if (!select) return;

  try {
    const res = await apiRequest('/patients');
    if (res.success) {
      select.innerHTML = res.patients.map((p) => `<option value="${p._id}">${p.fullName} (${p.patientId})</option>`).join('');
    }
  } catch (err) {
    console.error('Failed to populate appointment patients:', err);
  }
}

// Handle Schedule Appointment Submit
document.getElementById('form-schedule-appointment')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await apiRequest('/appointments', 'POST', data);
    if (res.success) {
      showToast(res.message, 'success');
      closeModal('modal-schedule-appointment');
      loadView('appointments');
    }
  } catch (err) {
    // Error handled by apiRequest
  }
});

async function loadAppointmentsView() {
  const container = document.getElementById('view-content');
  container.innerHTML = `
    <div class="custom-card">
      <div class="card-header flex-wrap gap-2">
        <h5 class="card-title"><i class="bi bi-calendar-check me-2 text-primary"></i> Master Appointments Manager</h5>
        <button class="btn btn-primary btn-sm fw-semibold shadow-sm" onclick="openScheduleAppointmentForPatient('', '')">
          <i class="bi bi-calendar-plus me-1"></i> Schedule New Appointment
        </button>
      </div>
      <div class="card-body">
        <!-- Filter Tabs -->
        <ul class="nav nav-pills mb-3" id="aptFilterTabs">
          <li class="nav-item"><button class="nav-link active small py-1 px-3 me-2" onclick="fetchAndFilterAppointments('all', this)">All Appointments</button></li>
          <li class="nav-item"><button class="nav-link small py-1 px-3 me-2" onclick="fetchAndFilterAppointments('today', this)">Today's Appointments</button></li>
          <li class="nav-item"><button class="nav-link small py-1 px-3 me-2" onclick="fetchAndFilterAppointments('upcoming', this)">Upcoming</button></li>
          <li class="nav-item"><button class="nav-link small py-1 px-3" onclick="fetchAndFilterAppointments('missed', this)">Missed Alerts</button></li>
        </ul>

        <div class="table-responsive">
          <table class="table table-custom align-middle">
            <thead>
              <tr>
                <th>Apt ID</th>
                <th>Patient Name</th>
                <th>Type</th>
                <th>Date</th>
                <th>Time</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="tbl-appointments-body">
              <tr><td colspan="8" class="text-center py-4 text-muted">Loading appointments...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  fetchAndFilterAppointments('all');
}

async function fetchAndFilterAppointments(filterType, btnEl) {
  if (btnEl) {
    document.querySelectorAll('#aptFilterTabs .nav-link').forEach((b) => b.classList.remove('active'));
    btnEl.classList.add('active');
  }

  let endpoint = '/appointments';
  if (filterType === 'today') endpoint = '/appointments?filter=today';
  else if (filterType === 'upcoming') endpoint = '/appointments?filter=upcoming';
  else if (filterType === 'missed') endpoint = '/appointments?status=Missed';

  try {
    const res = await apiRequest(endpoint);
    if (res.success) {
      const tbody = document.getElementById('tbl-appointments-body');
      if (!tbody) return;
      if (res.appointments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No appointments found matching filter.</td></tr>`;
        return;
      }
      tbody.innerHTML = res.appointments.map((a) => `
        <tr>
          <td><span class="badge bg-primary-subtle text-primary border border-primary fw-semibold">${a.appointmentId}</span></td>
          <td class="fw-semibold cursor-pointer text-primary text-decoration-underline-hover" onclick="viewPatientProfile('${a.patient ? a.patient._id : a.patientId}')">${a.patient ? a.patient.fullName : a.patientId}</td>
          <td><span class="badge bg-info-subtle text-info border border-info fw-semibold">${a.type || 'ANC'}</span></td>
          <td><strong class="text-dark">${a.appointmentDate ? a.appointmentDate.split('T')[0] : ''}</strong></td>
          <td><small class="text-muted fw-semibold">${a.appointmentTime}</small></td>
          <td><small class="text-muted">${a.reason || 'Routine Checkup'}</small></td>
          <td>
            <span class="badge ${a.status === 'Completed' ? 'bg-success text-white' : a.status === 'Missed' ? 'bg-danger text-white' : a.status === 'Cancelled' ? 'bg-secondary text-white' : 'bg-primary text-white'} p-2">
              ${a.status}
            </span>
          </td>
          <td>
            ${a.status !== 'Completed' && a.status !== 'Cancelled' ? `
              <div class="d-flex align-items-center gap-1">
                <button class="btn btn-sm btn-success py-1 px-2 fw-semibold shadow-sm text-nowrap" onclick="updateAptStatus('${a._id}', 'Completed')">
                  <i class="bi bi-check-circle-fill me-1"></i> Mark Done
                </button>
                <button class="btn btn-sm btn-outline-danger py-1 px-2 fw-semibold shadow-sm text-nowrap" onclick="updateAptStatus('${a._id}', 'Cancelled')">
                  <i class="bi bi-x-circle-fill me-1"></i> Cancel
                </button>
              </div>
            ` : `<span class="badge bg-light text-secondary border">Closed</span>`}
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load appointments:', err);
  }
}

async function updateAptStatus(aptMongoId, status) {
  try {
    const res = await apiRequest(`/appointments/${aptMongoId}/status`, 'PATCH', { status });
    if (res.success) {
      showToast(`Appointment status updated to ${status}`, 'success');
      const aptTable = document.getElementById('tbl-appointments-body');
      if (aptTable) {
        fetchAndFilterAppointments('all');
      } else if (typeof currentActiveProfileData !== 'undefined' && currentActiveProfileData && currentActiveProfileData.patient) {
        viewPatientProfile(currentActiveProfileData.patient._id);
      }
    }
  } catch (err) {
    console.error('Error updating appointment status:', err);
  }
}

window.updateAptStatus = updateAptStatus;
