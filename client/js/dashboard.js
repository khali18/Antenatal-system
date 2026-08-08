/* ==========================================================================
   EXECUTIVE DASHBOARD & CHART.JS VISUALIZATIONS
   ========================================================================== */

let chartInstances = {};

async function loadDashboardView() {
    const container = document.getElementById('view-content');

    // Render Dashboard Markup Skeleton
    container.innerHTML = `
    <div class="row g-3 mb-4">
      <!-- 10 Summary Metric Cards -->
      <div class="col-xl-2 col-md-4 col-6">
        <div class="metric-card">
          <div class="card-icon icon-teal"><i class="bi bi-people-fill"></i></div>
          <div class="metric-value" id="card-total-patients">0</div>
          <div class="metric-label">Registered Patients</div>
        </div>
      </div>
      <div class="col-xl-2 col-md-4 col-6">
        <div class="metric-card">
          <div class="card-icon icon-blue"><i class="bi bi-person-heart"></i></div>
          <div class="metric-value" id="card-active-preg">0</div>
          <div class="metric-label">Active Pregnancies</div>
        </div>
      </div>
      <div class="col-xl-2 col-md-4 col-6">
        <div class="metric-card">
          <div class="card-icon icon-emerald"><i class="bi bi-journal-medical"></i></div>
          <div class="metric-value" id="card-anc-month">0</div>
          <div class="metric-label">ANC Visits (Month)</div>
        </div>
      </div>
      <div class="col-xl-2 col-md-4 col-6">
        <div class="metric-card">
          <div class="card-icon icon-amber"><i class="bi bi-calendar-event"></i></div>
          <div class="metric-value" id="card-todays-apt">0</div>
          <div class="metric-label">Today's Appointments</div>
        </div>
      </div>
      <div class="col-xl-2 col-md-4 col-6">
        <div class="metric-card">
          <div class="card-icon icon-rose"><i class="bi bi-exclamation-triangle"></i></div>
          <div class="metric-value" id="card-missed-apt">0</div>
          <div class="metric-label">Missed Appointments</div>
        </div>
      </div>
      <div class="col-xl-2 col-md-4 col-6">
        <div class="metric-card">
          <div class="card-icon icon-teal"><i class="bi bi-hospital"></i></div>
          <div class="metric-value" id="card-deliveries">0</div>
          <div class="metric-label">Deliveries Recorded</div>
        </div>
      </div>
    </div>

    <!-- 6 Dynamic Chart.js Analytics Panels -->
    <div class="row g-3 mb-4">
      <div class="col-lg-6">
        <div class="custom-card h-100">
          <div class="card-header">
            <h6 class="card-title"><i class="bi bi-graph-up-arrow me-2 text-primary"></i> Monthly ANC Registrations & Visits</h6>
          </div>
          <div class="card-body">
            <canvas id="chart-anc-monthly" height="220"></canvas>
          </div>
        </div>
      </div>
      <div class="col-lg-6">
        <div class="custom-card h-100">
          <div class="card-header">
            <h6 class="card-title"><i class="bi bi-pie-chart-fill me-2 text-info"></i> Appointment Status Breakdown</h6>
          </div>
          <div class="card-body">
            <canvas id="chart-apt-breakdown" height="220"></canvas>
          </div>
        </div>
      </div>
      <div class="col-lg-4">
        <div class="custom-card h-100">
          <div class="card-header">
            <h6 class="card-title"><i class="bi bi-bar-chart-fill me-2 text-success"></i> Patient Age Distribution</h6>
          </div>
          <div class="card-body">
            <canvas id="chart-age-distribution" height="220"></canvas>
          </div>
        </div>
      </div>
      <div class="col-lg-4">
        <div class="custom-card h-100">
          <div class="card-header">
            <h6 class="card-title"><i class="bi bi-bandaid me-2 text-primary"></i> Monthly PNC Follow-up Visits</h6>
          </div>
          <div class="card-body">
            <canvas id="chart-pnc-monthly" height="220"></canvas>
          </div>
        </div>
      </div>
      <div class="col-lg-4">
        <div class="custom-card h-100">
          <div class="card-header">
            <h6 class="card-title"><i class="bi bi-heart-pulse-fill me-2 text-danger"></i> Monthly Delivery Outcomes</h6>
          </div>
          <div class="card-body">
            <canvas id="chart-delivery-trends" height="220"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity & Quick Action Lists -->
    <div class="row g-3">
      <div class="col-lg-6">
        <div class="custom-card">
          <div class="card-header">
            <h6 class="card-title"><i class="bi bi-person-lines-fill me-2 text-primary"></i> Today's Scheduled Appointments</h6>
            <button class="btn btn-sm btn-outline-primary" onclick="loadView('appointments')">View All</button>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-custom">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Type</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody id="tbl-todays-apts-body">
                  <tr><td colspan="4" class="text-center py-3 text-muted">Loading appointments...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-6">
        <div class="custom-card">
          <div class="card-header">
            <h6 class="card-title"><i class="bi bi-clock-history me-2 text-info"></i> Recent Patient Registrations</h6>
            <button class="btn btn-sm btn-outline-primary" onclick="loadView('patients')">View All</button>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-custom">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Reg. Date</th>
                  </tr>
                </thead>
                <tbody id="tbl-recent-patients-body">
                  <tr><td colspan="4" class="text-center py-3 text-muted">Loading patient records...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

    // Fetch Dashboard Stats from API
    try {
        const res = await apiRequest('/reports/dashboard-stats');
        if (res.success) {
            // 1. Populate Metric Cards
            document.getElementById('card-total-patients').innerText = res.cards.totalPatients;
            document.getElementById('card-active-preg').innerText = res.cards.activePregnancies;
            document.getElementById('card-anc-month').innerText = res.cards.ancVisitsThisMonth;
            document.getElementById('card-todays-apt').innerText = res.cards.todaysAppointments;
            document.getElementById('card-missed-apt').innerText = res.cards.missedAppointments;
            document.getElementById('card-deliveries').innerText = res.cards.deliveriesRecorded;

            // 2. Initialize Visual Charts
            initDashboardCharts(res.charts);

            // 3. Populate Recent Activity Tables
            renderTodaysAppointmentsTable(res.recent.todaysAppointments);
            renderRecentPatientsTable(res.recent.patients);
        }
    } catch (err) {
        console.error('Failed to load dashboard data:', err);
    }
}

function initDashboardCharts(chartsData) {
    // Destroy existing chart instances if re-rendering
    Object.keys(chartInstances).forEach((k) => chartInstances[k].destroy());

    // Chart 1: Monthly ANC Registrations & Visits (Line/Bar)
    const ctxAnc = document.getElementById('chart-anc-monthly').getContext('2d');
    chartInstances.anc = new Chart(ctxAnc, {
        type: 'bar',
        data: {
            labels: chartsData.labels,
            datasets: [
                {
                    label: 'ANC Registrations',
                    data: chartsData.ancRegistrations,
                    backgroundColor: 'rgba(15, 118, 110, 0.75)',
                    borderRadius: 6,
                },
                {
                    label: 'ANC Visits',
                    data: chartsData.ancVisits,
                    backgroundColor: 'rgba(2, 132, 199, 0.75)',
                    borderRadius: 6,
                },
            ],
        },
        options: { responsive: true, maintainAspectRatio: false },
    });

    // Chart 2: Appointment Breakdown (Doughnut)
    const ctxApt = document.getElementById('chart-apt-breakdown').getContext('2d');
    chartInstances.apt = new Chart(ctxApt, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Pending/Upcoming', 'Missed', 'Cancelled'],
            datasets: [{
                data: [
                    chartsData.appointmentBreakdown.completed,
                    chartsData.appointmentBreakdown.pending,
                    chartsData.appointmentBreakdown.missed,
                    chartsData.appointmentBreakdown.cancelled,
                ],
                backgroundColor: ['#16a34a', '#0284c7', '#e11d48', '#94a3b8'],
            }],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } },
    });

    // Chart 3: Age Distribution (Bar)
    const ctxAge = document.getElementById('chart-age-distribution').getContext('2d');
    chartInstances.age = new Chart(ctxAge, {
        type: 'bar',
        data: {
            labels: Object.keys(chartsData.ageDistribution),
            datasets: [{
                label: 'Patients Count',
                data: Object.values(chartsData.ageDistribution),
                backgroundColor: '#0f766e',
                borderRadius: 4,
            }],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
    });

    // Chart 4: PNC Visits Monthly (Line)
    const ctxPnc = document.getElementById('chart-pnc-monthly').getContext('2d');
    chartInstances.pnc = new Chart(ctxPnc, {
        type: 'line',
        data: {
            labels: chartsData.labels,
            datasets: [{
                label: 'PNC Visits',
                data: chartsData.pncVisits,
                borderColor: '#0284c7',
                backgroundColor: 'rgba(2, 132, 199, 0.1)',
                fill: true,
                tension: 0.3,
            }],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
    });

    // Chart 5: Delivery Trends (Line)
    const ctxDel = document.getElementById('chart-delivery-trends').getContext('2d');
    chartInstances.del = new Chart(ctxDel, {
        type: 'line',
        data: {
            labels: chartsData.labels,
            datasets: [{
                label: 'Deliveries Recorded',
                data: chartsData.deliveryTrends,
                borderColor: '#e11d48',
                backgroundColor: 'rgba(225, 29, 72, 0.1)',
                fill: true,
                tension: 0.3,
            }],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
    });
}

function renderTodaysAppointmentsTable(apts) {
    const tbody = document.getElementById('tbl-todays-apts-body');
    if (!apts || apts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-3 text-muted">No appointments scheduled for today.</td></tr>`;
        return;
    }

    tbody.innerHTML = apts.map((a) => `
    <tr>
      <td class="fw-semibold">${a.patient ? a.patient.fullName : a.patientId}</td>
      <td><span class="badge bg-light text-dark border">${a.type}</span></td>
      <td>${a.appointmentTime || '09:00 AM'}</td>
      <td><span class="badge bg-info-subtle text-info border border-info">${a.status}</span></td>
    </tr>
  `).join('');
}

function renderRecentPatientsTable(patients) {
    const tbody = document.getElementById('tbl-recent-patients-body');
    if (!patients || patients.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-3 text-muted">No patients registered recently.</td></tr>`;
        return;
    }

    tbody.innerHTML = patients.map((p) => `
    <tr>
      <td><span class="badge bg-light text-primary border">${p.patientId}</span></td>
      <td class="fw-semibold cursor-pointer text-primary" onclick="viewPatientProfile('${p._id}')">${p.fullName}</td>
      <td>${p.phone}</td>
      <td>${p.registrationDate ? p.registrationDate.split('T')[0] : ''}</td>
    </tr>
  `).join('');
}
