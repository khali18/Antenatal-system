/* ==========================================================================
   REPORTS & ANALYTICS MODULE
   ========================================================================== */

async function loadReportsView() {
    const container = document.getElementById('view-content');
    container.innerHTML = `
    <div class="custom-card mb-4">
      <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h5 class="card-title"><i class="bi bi-file-earmark-bar-graph-fill me-2 text-primary"></i> Maternity Department Reporting & CSV Data Exports</h5>
          <small class="text-muted">Generate aggregated administrative reports and download CSV files</small>
        </div>
        <button class="btn btn-outline-secondary btn-sm" onclick="window.print()">
          <i class="bi bi-printer me-1"></i> Print Executive Report Summary
        </button>
      </div>
      <div class="card-body">
        <p class="small text-muted mb-4">Download official anonymized records for departmental reporting, statistics, and administrative audits:</p>
        
        <div class="row g-3">
          <div class="col-md-4">
            <div class="border rounded p-3 text-center bg-light">
              <i class="bi bi-people fs-2 text-primary d-block mb-2"></i>
              <h6 class="fw-bold">Patient Master Directory</h6>
              <p class="extra-small text-muted">All registered female patients, contact info, MRN, and registration dates.</p>
              <a href="/api/reports/export-csv/patients" class="btn btn-sm btn-primary w-100" download><i class="bi bi-download me-1"></i> Export Patients CSV</a>
            </div>
          </div>
          <div class="col-md-4">
            <div class="border rounded p-3 text-center bg-light">
              <i class="bi bi-journal-medical fs-2 text-teal d-block mb-2"></i>
              <h6 class="fw-bold">ANC Visit Records</h6>
              <p class="extra-small text-muted">Chronological antenatal visits, gestational age, vitals, and risk tags.</p>
              <a href="/api/reports/export-csv/anc" class="btn btn-sm btn-outline-primary w-100" download><i class="bi bi-download me-1"></i> Export ANC Visits CSV</a>
            </div>
          </div>
          <div class="col-md-4">
            <div class="border rounded p-3 text-center bg-light">
              <i class="bi bi-bandaid fs-2 text-info d-block mb-2"></i>
              <h6 class="fw-bold">PNC Visit Records</h6>
              <p class="extra-small text-muted">Postnatal maternal recovery and infant wellness assessments.</p>
              <a href="/api/reports/export-csv/pnc" class="btn btn-sm btn-outline-primary w-100" download><i class="bi bi-download me-1"></i> Export PNC Visits CSV</a>
            </div>
          </div>
          <div class="col-md-4">
            <div class="border rounded p-3 text-center bg-light">
              <i class="bi bi-calendar-check fs-2 text-success d-block mb-2"></i>
              <h6 class="fw-bold">Appointments History</h6>
              <p class="extra-small text-muted">Master appointment schedule, statuses (Upcoming, Completed, Missed).</p>
              <a href="/api/reports/export-csv/appointments" class="btn btn-sm btn-outline-primary w-100" download><i class="bi bi-download me-1"></i> Export Appointments CSV</a>
            </div>
          </div>
          <div class="col-md-4">
            <div class="border rounded p-3 text-center bg-light">
              <i class="bi bi-hospital fs-2 text-danger d-block mb-2"></i>
              <h6 class="fw-bold">Delivery & Baby Outcomes</h6>
              <p class="extra-small text-muted">Labor outcomes, delivery mode, place of delivery, and baby counts.</p>
              <a href="/api/reports/export-csv/deliveries" class="btn btn-sm btn-outline-primary w-100" download><i class="bi bi-download me-1"></i> Export Deliveries CSV</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
