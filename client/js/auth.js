/* ==========================================================================
   AUTHENTICATION & SESSION MANAGEMENT
   ========================================================================== */

function getCurrentUser() {
    const userStr = localStorage.getItem('anc_user');
    return userStr ? JSON.parse(userStr) : null;
}

function fillDemoCredentials(username, password) {
    document.getElementById('login-username').value = username;
    document.getElementById('login-password').value = password;
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const alertEl = document.getElementById('login-alert');

    alertEl.classList.add('d-none');

    try {
        const res = await apiRequest('/auth/login', 'POST', { username, password });
        if (res.success) {
            localStorage.setItem('anc_token', res.token);
            localStorage.setItem('anc_user', JSON.stringify(res.user));

            if (res.mustChangePassword) {
                openChangePasswordModal(true);
                return;
            }

            showToast(`Welcome back, ${res.user.fullName}!`, 'success');
            showAppView();
        }
    } catch (err) {
        alertEl.innerText = err.message || 'Invalid login credentials.';
        alertEl.classList.remove('d-none');
    }
}

function handleLogout() {
    localStorage.removeItem('anc_token');
    localStorage.removeItem('anc_user');
    showToast('Logged out successfully', 'info');
    showLoginView();
}

function openChangePasswordModal(forced = false) {
    const modalEl = document.getElementById('modal-change-password');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

async function handleChangePassword(e) {
    e.preventDefault();
    const form = e.target;
    const currentPassword = form.currentPassword.value;
    const newPassword = form.newPassword.value;

    try {
        const res = await apiRequest('/auth/change-password', 'PUT', { currentPassword, newPassword });
        if (res.success) {
            showToast('Password updated successfully', 'success');
            bootstrap.Modal.getInstance(document.getElementById('modal-change-password')).hide();
            form.reset();
        }
    } catch (err) {
        // Error handled by apiRequest
    }
}

function applyRoleRestrictions(user) {
    if (!user) return;

    // Show user details in topbar
    document.getElementById('user-display-name').innerText = user.fullName;
    const roleEl = document.getElementById('user-display-role');
    roleEl.innerText = user.role === 'admin' ? 'Administrator' : user.role === 'midwife_nurse' ? 'Midwife / Nurse' : 'Records Officer';
    roleEl.className = `role-pill role-${user.role}`;

    // Hide/Show Admin-only menu links
    const adminOnlyNavs = document.querySelectorAll('.role-admin-only');
    adminOnlyNavs.forEach((nav) => {
        if (user.role === 'admin') {
            nav.classList.remove('d-none');
        } else {
            nav.classList.add('d-none');
        }
    });
}
