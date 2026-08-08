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

// Global Safe Bootstrap Modal Trigger Helpers with Vanilla DOM Fallback
function openModal(modalId) {
    const el = document.getElementById(modalId);
    if (!el) {
        console.error(`[Modal Error]: Element #${modalId} not found in DOM`);
        return;
    }

    // Try Bootstrap 5 instance first
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        try {
            let modalInstance = bootstrap.Modal.getInstance(el);
            if (!modalInstance) {
                modalInstance = new bootstrap.Modal(el);
            }
            modalInstance.show();
            return;
        } catch (err) {
            console.warn(`[Bootstrap Modal Warning] Failed to use Bootstrap instance, using vanilla fallback:`, err);
        }
    }

    // Resilient Vanilla DOM Fallback (Works 100% without external Bootstrap JS)
    el.style.display = 'block';
    el.classList.add('show');
    el.removeAttribute('aria-hidden');
    el.setAttribute('aria-modal', 'true');

    // Create backdrop if not existing
    let backdrop = document.getElementById(`backdrop-${modalId}`);
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = `backdrop-${modalId}`;
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);
    }
    document.body.classList.add('modal-open');

    // Wire up close buttons
    const closeBtns = el.querySelectorAll('[data-bs-dismiss="modal"], .btn-close');
    closeBtns.forEach((btn) => {
        btn.onclick = (e) => {
            e.preventDefault();
            closeModal(modalId);
        };
    });
}

function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (!el) return;

    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        try {
            const modalInstance = bootstrap.Modal.getInstance(el);
            if (modalInstance) {
                modalInstance.hide();
            }
        } catch (err) {
            // ignore and perform DOM cleanup
        }
    }

    // Resilient Vanilla DOM Cleanup
    el.style.display = 'none';
    el.classList.remove('show');
    el.setAttribute('aria-hidden', 'true');
    el.removeAttribute('aria-modal');

    const backdrop = document.getElementById(`backdrop-${modalId}`);
    if (backdrop) backdrop.remove();

    // Clean up modal-open class if no other modals shown
    const openModals = document.querySelectorAll('.modal.show');
    if (openModals.length === 0) {
        document.body.classList.remove('modal-open');
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

// High Contrast / Dark Theme Toggle Engine
function toggleAppTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setAppTheme(newTheme);
    showToast(`Switched to ${newTheme === 'dark' ? 'Dark Eyesight High Contrast' : 'Light Standard'} theme`, 'info');
}

function setAppTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('anc_theme', theme);

    const icon = document.getElementById('theme-toggle-icon');
    if (icon) {
        if (theme === 'dark') {
            icon.className = 'bi bi-sun-fill fs-5 text-warning';
        } else {
            icon.className = 'bi bi-moon-fill fs-5 text-secondary';
        }
    }
}

function initAppTheme() {
    const savedTheme = localStorage.getItem('anc_theme') || 'light';
    setAppTheme(savedTheme);
}

document.addEventListener('DOMContentLoaded', initAppTheme);
