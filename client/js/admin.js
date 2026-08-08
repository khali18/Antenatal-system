/* ==========================================================================
   ADMINISTRATIVE & AUDIT LOGS MODULE
   ========================================================================== */

// USER MANAGEMENT VIEW
async function loadUsersView() {
  const container = document.getElementById('view-content');
  container.innerHTML = `
    <div class="custom-card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="card-title"><i class="bi bi-person-gear me-2 text-primary"></i> Staff User Management (Admin)</h5>
        <button class="btn btn-primary btn-sm fw-semibold shadow-sm" onclick="openCreateUserModal()">
          <i class="bi bi-person-plus-fill me-1"></i> Create Staff User
        </button>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-custom align-middle">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Full Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="tbl-users-body">
              <tr><td colspan="7" class="text-center py-4 text-muted">Loading staff accounts...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  try {
    const res = await apiRequest('/users');
    if (res.success) {
      const tbody = document.getElementById('tbl-users-body');
      if (!tbody) return;
      tbody.innerHTML = res.users.map((u) => `
        <tr>
          <td><span class="badge bg-light text-primary border">${u.userId}</span></td>
          <td class="fw-semibold">${u.fullName}</td>
          <td><code>${u.username}</code></td>
          <td>${u.email}</td>
          <td><span class="role-pill role-${u.role}">${u.role === 'admin' ? 'Admin' : u.role === 'midwife_nurse' ? 'Midwife/Nurse' : 'Records'}</span></td>
          <td><span class="badge ${u.isActive ? 'bg-success' : 'bg-danger'}">${u.isActive ? 'Active' : 'Disabled'}</span></td>
          <td>
            <button class="btn btn-sm ${u.isActive ? 'btn-outline-danger' : 'btn-outline-success'} py-0 px-2 me-1" onclick="toggleUserStatus('${u._id}')">
              ${u.isActive ? 'Disable' : 'Enable'}
            </button>
            <button class="btn btn-sm btn-outline-secondary py-0 px-2" onclick="resetUserPassword('${u._id}')">Reset Password</button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load users:', err);
  }
}

function openCreateUserModal() {
  const form = document.getElementById('form-create-user');
  if (form) form.reset();
  openModal('modal-create-user');
}

document.getElementById('form-create-user')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await apiRequest('/users', 'POST', data);
    if (res.success) {
      showToast(res.message, 'success');
      closeModal('modal-create-user');
      loadUsersView();
    }
  } catch (err) {
    // Error handled by apiRequest
  }
});

async function toggleUserStatus(userMongoId) {
  try {
    const res = await apiRequest(`/users/${userMongoId}/toggle-status`, 'PATCH');
    if (res.success) {
      showToast(res.message, 'success');
      loadUsersView();
    }
  } catch (err) {
    // Error handled by apiRequest
  }
}

async function resetUserPassword(userMongoId) {
  if (!confirm('Are you sure you want to reset password for this staff account to default "Hospital@123"?')) return;
  try {
    const res = await apiRequest(`/users/${userMongoId}/reset-password`, 'PUT', { newPassword: 'Hospital@123' });
    if (res.success) {
      showToast('Password reset to Hospital@123', 'success');
    }
  } catch (err) {
    // Error handled by apiRequest
  }
}

// AUDIT LOGS VIEW (Admin Only)
async function loadAuditLogsView() {
  const container = document.getElementById('view-content');
  container.innerHTML = `
    <div class="custom-card">
      <div class="card-header flex-wrap gap-2">
        <div>
          <h5 class="card-title"><i class="bi bi-clock-history me-2 text-primary"></i> System Immutable Audit Logs</h5>
          <small class="text-muted">Security and clinical edit log history for hospital compliance</small>
        </div>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-custom align-middle">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Staff User</th>
                <th>Role</th>
                <th>Action</th>
                <th>Module</th>
                <th>Record ID</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody id="tbl-audit-body">
              <tr><td colspan="7" class="text-center py-4 text-muted">Loading audit history...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  try {
    const res = await apiRequest('/audit-logs');
    if (res.success) {
      const tbody = document.getElementById('tbl-audit-body');
      if (!tbody) return;
      if (res.logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No audit logs recorded yet.</td></tr>`;
        return;
      }
      tbody.innerHTML = res.logs.map((l) => `
        <tr>
          <td><small>${l.timestamp ? new Date(l.timestamp).toLocaleString() : ''}</small></td>
          <td class="fw-semibold">${l.userName}</td>
          <td><span class="role-pill role-${l.userRole}">${l.userRole}</span></td>
          <td><span class="badge bg-light text-dark border">${l.action}</span></td>
          <td>${l.module}</td>
          <td><code>${l.recordId || '-'}</code></td>
          <td><small class="text-muted">${l.description}</small></td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load audit logs:', err);
  }
}
