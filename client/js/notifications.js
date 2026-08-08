/* ==========================================================================
   INTERNAL NOTIFICATIONS MODULE
   ========================================================================== */

async function fetchNotifications() {
    const badge = document.getElementById('notification-badge');
    const drawerBody = document.getElementById('notification-drawer-body');

    try {
        const res = await apiRequest('/notifications');
        if (res.success) {
            if (res.count > 0) {
                badge.innerText = res.count;
                badge.classList.remove('d-none');
            } else {
                badge.classList.add('d-none');
            }

            if (res.notifications.length === 0) {
                drawerBody.innerHTML = `<div class="text-center py-5 text-muted"><i class="bi bi-bell-slash fs-2 d-block mb-2"></i>No active notifications at this time.</div>`;
                return;
            }

            drawerBody.innerHTML = res.notifications.map((n) => `
        <div class="p-3 border-bottom hover-bg-light">
          <div class="d-flex align-items-start gap-2">
            <div class="badge bg-${n.type} rounded-circle p-2 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
              <i class="bi ${n.icon}"></i>
            </div>
            <div class="flex-grow-1">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <h6 class="fw-bold small mb-0 text-dark">${n.title}</h6>
                <span class="text-muted extra-small">${n.time}</span>
              </div>
              <p class="small text-muted mb-0" style="line-height: 1.3;">${n.message}</p>
            </div>
          </div>
        </div>
      `).join('');
        }
    } catch (err) {
        console.error('Failed to fetch notifications:', err);
    }
}
