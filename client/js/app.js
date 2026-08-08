/* ==========================================================================
   MAIN APPLICATION ROUTER & CLIENT INITIALIZATION
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Check if session token exists
    const token = localStorage.getItem('anc_token');
    const user = getCurrentUser();

    if (token && user) {
        showAppView();
    } else {
        showLoginView();
    }

    // Setup Event Listeners
    document.getElementById('form-login')?.addEventListener('submit', handleLogin);
    document.getElementById('btn-logout')?.addEventListener('click', handleLogout);
    document.getElementById('dropdown-logout')?.addEventListener('click', handleLogout);
    document.getElementById('form-change-password')?.addEventListener('submit', handleChangePassword);

    // Setup Navigation Clicks
    document.querySelectorAll('#sidebar .nav-link').forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = link.getAttribute('data-view');
            if (view) loadView(view);
        });
    });

    // Sidebar Mobile Toggle
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('show-sidebar');
    });
});

function showLoginView() {
    document.getElementById('login-view').classList.remove('d-none');
    document.getElementById('app-view').classList.add('d-none');
}

function showAppView() {
    const user = getCurrentUser();
    document.getElementById('login-view').classList.add('d-none');
    document.getElementById('app-view').classList.remove('d-none');

    applyRoleRestrictions(user);
    fetchNotifications();
    loadView('dashboard');
}

// Single-Page View Router
function loadView(viewName) {
    const user = getCurrentUser();

    // Guard Admin-only views (Users & Audit Logs)
    if ((viewName === 'users' || viewName === 'audit-logs') && user && user.role !== 'admin') {
        showToast(`Access Restricted: ${user.role === 'midwife_nurse' ? 'Midwife/Nurse' : 'Records Officer'} is not authorized to access System Administration.`, 'warning');
        viewName = 'dashboard';
    }

    // Update sidebar active link
    document.querySelectorAll('#sidebar .nav-link').forEach((link) => {
        if (link.getAttribute('data-view') === viewName) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Update Page Title
    const titleEl = document.getElementById('page-title');
    const breadcrumbEl = document.getElementById('page-breadcrumb');

    switch (viewName) {
        case 'dashboard':
            titleEl.innerText = 'Executive Dashboard';
            breadcrumbEl.innerText = 'Maternity Care / Analytics & Quick Stats';
            loadDashboardView();
            break;

        case 'patients':
            titleEl.innerText = 'Patient Directory';
            breadcrumbEl.innerText = 'Maternity Care / Registered Patients';
            loadPatientsView();
            break;

        case 'pregnancies':
            titleEl.innerText = 'Pregnancy Records';
            breadcrumbEl.innerText = 'Clinical Modules / Active Pregnancies';
            loadPregnanciesView();
            break;

        case 'anc-visits':
            titleEl.innerText = 'Antenatal (ANC) Visits';
            breadcrumbEl.innerText = 'Clinical Modules / ANC Logs';
            loadANCVisitsView();
            break;

        case 'appointments':
            titleEl.innerText = 'Appointments Schedule';
            breadcrumbEl.innerText = 'Clinical Modules / Appointment Management';
            loadAppointmentsView();
            break;

        case 'deliveries':
            titleEl.innerText = 'Delivery Records';
            breadcrumbEl.innerText = 'Clinical Modules / Labor & Delivery';
            loadDeliveriesView();
            break;

        case 'babies':
            titleEl.innerText = 'Baby Records';
            breadcrumbEl.innerText = 'Clinical Modules / Newborn Register';
            loadBabiesView();
            break;

        case 'pnc-visits':
            titleEl.innerText = 'Postnatal (PNC) Visits';
            breadcrumbEl.innerText = 'Clinical Modules / PNC Logs';
            loadPNCVisitsView();
            break;

        case 'laboratory':
            titleEl.innerText = 'Laboratory Records';
            breadcrumbEl.innerText = 'Diagnostic Logs / Lab Tests';
            loadLaboratoryView();
            break;

        case 'medications':
            titleEl.innerText = 'Prescriptions & Supplements';
            breadcrumbEl.innerText = 'Clinical Logs / Medications';
            loadMedicationsView();
            break;

        case 'reports':
            titleEl.innerText = 'Reports & CSV Exports';
            breadcrumbEl.innerText = 'Departmental / Reporting';
            loadReportsView();
            break;

        case 'users':
            titleEl.innerText = 'Staff User Management';
            breadcrumbEl.innerText = 'Admin / Users';
            loadUsersView();
            break;

        case 'audit-logs':
            titleEl.innerText = 'System Audit Logs';
            breadcrumbEl.innerText = 'Admin / Compliance Logs';
            loadAuditLogsView();
            break;

        default:
            loadDashboardView();
    }
}
