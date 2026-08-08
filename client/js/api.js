/* ==========================================================================
   API CLIENT UTILITY
   ========================================================================== */

const API_BASE_URL = '/api';

// Toast Notification Helper
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const bgClass = type === 'success' ? 'bg-success text-white' :
        type === 'danger' ? 'bg-danger text-white' :
            type === 'warning' ? 'bg-warning text-dark' : 'bg-primary text-white';

    const iconClass = type === 'success' ? 'bi-check-circle-fill' :
        type === 'danger' ? 'bi-exclamation-octagon-fill' :
            type === 'warning' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill';

    const toastId = `toast-${Date.now()}`;
    const toastHtml = `
    <div id="${toastId}" class="toast align-items-center ${bgClass} border-0 shadow-lg mb-2" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2 small">
          <i class="bi ${iconClass} fs-5"></i>
          <span>${message}</span>
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>
  `;

    container.insertAdjacentHTML('beforeend', toastHtml);
    if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
        const bsToast = new bootstrap.Toast(toastEl, { delay: 4000 });
        bsToast.show();
    } else {
        setTimeout(() => toastEl.remove(), 4000);
    }

    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

// Global Safe Bootstrap Modal Trigger Helpers
function openModal(modalId) {
    const el = document.getElementById(modalId);
    if (!el) {
        console.error(`[Modal Error]: Element #${modalId} not found in DOM`);
        return;
    }
    try {
        let modalInstance = bootstrap.Modal.getInstance(el);
        if (!modalInstance) {
            modalInstance = new bootstrap.Modal(el);
        }
        modalInstance.show();
    } catch (err) {
        console.error(`[Modal Error] Failed to open ${modalId}:`, err);
    }
}

function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (!el) return;
    try {
        const modalInstance = bootstrap.Modal.getInstance(el);
        if (modalInstance) {
            modalInstance.hide();
        }
    } catch (err) {
        console.error(`[Modal Error] Failed to close ${modalId}:`, err);
    }
}

// Unified API Request Handler
async function apiRequest(endpoint, method = 'GET', data = null) {
    const token = localStorage.getItem('anc_token');
    const headers = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const result = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('anc_token');
                localStorage.removeItem('anc_user');
                showToast('Session expired. Please log in again.', 'warning');
                if (typeof showLoginView === 'function') showLoginView();
            } else {
                showToast(result.message || 'An error occurred while processing request', 'danger');
            }
            throw new Error(result.message || 'API Error');
        }

        return result;
    } catch (err) {
        console.error(`[API Request Error] ${endpoint}:`, err);
        throw err;
    }
}
