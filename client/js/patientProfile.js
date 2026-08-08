/* ==========================================================================
   PATIENT 360 PROFILE LOOKUP & 10-TAB VIEW MODULE
   ========================================================================== */

let currentActiveProfileData = null;

async function viewPatientProfile(patientMongoId) {
  const container = document.getElementById('view-content');
  container.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2 text-muted">Loading Patient 360 Profile...</p>
    </div>
  `;

  try {
    const res = await apiRequest(`/patients/${patientMongoId}/profile`);
    if (res.success) {
      const profile = {
        patient: res.patient,
        activePregnancy: res.activePregnancy,
        ancVisits: res.ancVisits || [],
        appointments: res.appointments || [],
        delivery: res.deliveries && res.deliveries.length > 0 ? res.deliveries[0] : (res.delivery || null),
        baby: res.babies || [],
        pncVisits: res.pncVisits || [],
        labRecords: res.labRecords || [],
        medRecords: res.medicationRecords || []
      };
      currentActiveProfileData = profile;
      renderPatientProfileView(profile);
    }
  } catch (err) {
    console.error('Error fetching patient profile:', err);
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger my-4 text-center">
          <i class="bi bi-exclamation-triangle-fill fs-3 d-block mb-2"></i>
          Failed to load patient profile details. <button class="btn btn-outline-danger btn-sm ms-2" onclick="loadView('patients')">Back to Directory</button>
        </div>
      `;
    }
  }
}

function renderPatientProfileView(profile) {
  const { patient, activePregnancy, ancVisits, appointments, delivery, baby, pncVisits, labRecords, medRecords } = profile;
  const container = document.getElementById('view-content');

  // Top header with Quick Action Buttons
  container.innerHTML = `
    <!-- Patient Header Summary Card -->
    <div class="custom-card mb-4 border-start border-primary border-4">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div class="d-flex align-items-center gap-3">
            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-3" style="width: 60px; height: 60px; background-color: var(--primary-color) !important;">
              ${patient.fullName.charAt(0)}
            </div>
            <div>
              <h4 class="fw-bold mb-1 text-dark">${patient.fullName}</h4>
              <div class="d-flex align-items-center gap-2 flex-wrap text-muted small">
                <span class="badge bg-light text-primary border">${patient.patientId}</span>
                <span><i class="bi bi-card-text me-1"></i> MRN: ${patient.medicalRecordNumber}</span>
                <span><i class="bi bi-calendar3 me-1"></i> Age: ${patient.age} yrs</span>
                <span><i class="bi bi-telephone me-1"></i> ${patient.phone}</span>
                <span class="badge ${patient.status === 'active' ? 'bg-success-subtle text-success border border-success' : 'bg-secondary'}">${patient.status.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div class="d-flex align-items-center gap-2 flex-wrap no-print">
            <button class="btn btn-outline-secondary btn-sm" onclick="window.print()">
              <i class="bi bi-printer me-1"></i> Print Profile Summary
            </button>
            <button class="btn btn-outline-primary btn-sm" data-bs-toggle="modal" data-bs-target="#modal-schedule-appointment" onclick="openScheduleAppointmentForPatient('${patient._id}', '${patient.fullName}')">
              <i class="bi bi-calendar-plus me-1"></i> Schedule Apt
            </button>
            ${!activePregnancy ? `
              <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#modal-register-pregnancy" onclick="openRegisterPregnancyModal('${patient._id}', '${patient.fullName}')">
                <i class="bi bi-plus-circle me-1"></i> Register Active Pregnancy
              </button>
            ` : `
              <button class="btn btn-success btn-sm" data-bs-toggle="modal" data-bs-target="#modal-new-anc-visit" onclick="openNewANCVisitModal('${patient._id}', '${activePregnancy._id}', '${patient.fullName}')">
                <i class="bi bi-journal-plus me-1"></i> Record ANC Visit
              </button>
              <button class="btn btn-danger btn-sm" data-bs-toggle="modal" data-bs-target="#modal-record-delivery" onclick="openRecordDeliveryModal('${patient._id}', '${activePregnancy._id}', '${patient.fullName}')">
                <i class="bi bi-hospital me-1"></i> Record Delivery
              </button>
            `}
          </div>
        </div>
      </div>
    </div>

// Vanilla DOM Tab Switcher Fallback
function switchProfileTab(targetTabId, btnEl) {
    const tabs = document.querySelectorAll('#profileTab .nav-link');
    tabs.forEach((t) => t.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');

    const panes = document.querySelectorAll('#profileTabContent .tab-pane');
    panes.forEach((p) => {
        p.classList.remove('show', 'active');
        if (p.id === targetTabId) {
            p.classList.add('show', 'active');
        }
    });
}

    <!-- 10-Tab Navigation Bar -->
    <ul class="nav nav-tabs nav-tabs-custom mb-3" id="profileTab" role="tablist">
      <li class="nav-item">
        <button class="nav-link active" id="tab-overview-btn" data-bs-toggle="tab" data-bs-target="#tab-overview" onclick="switchProfileTab('tab-overview', this)"><i class="bi bi-person me-1"></i> Overview</button>
      </li>
      <li class="nav-item">
        <button class="nav-link" id="tab-pregnancy-btn" data-bs-toggle="tab" data-bs-target="#tab-pregnancy" onclick="switchProfileTab('tab-pregnancy', this)"><i class="bi bi-person-heart me-1"></i> Pregnancy (${activePregnancy ? 'Active' : 'None'})</button>
      </li>
      <li class="nav-item">
        <button class="nav-link" id="tab-anc-btn" data-bs-toggle="tab" data-bs-target="#tab-anc" onclick="switchProfileTab('tab-anc', this)"><i class="bi bi-journal-medical me-1"></i> ANC Visits (${ancVisits ? ancVisits.length : 0})</button>
      </li>
      <li class="nav-item">
        <button class="nav-link" id="tab-timeline-btn" data-bs-toggle="tab" data-bs-target="#tab-timeline" onclick="switchProfileTab('tab-timeline', this)"><i class="bi bi-clock-history me-1"></i> Journey Timeline</button>
      </li>
      <li class="nav-item">
        <button class="nav-link" id="tab-appointments-btn" data-bs-toggle="tab" data-bs-target="#tab-appointments" onclick="switchProfileTab('tab-appointments', this)"><i class="bi bi-calendar-check me-1"></i> Appointments (${appointments ? appointments.length : 0})</button>
      </li>
      <li class="nav-item">
        <button class="nav-link" id="tab-delivery-btn" data-bs-toggle="tab" data-bs-target="#tab-delivery" onclick="switchProfileTab('tab-delivery', this)"><i class="bi bi-hospital me-1"></i> Delivery (${delivery ? 'Recorded' : '0'})</button>
      </li>
      <li class="nav-item">
        <button class="nav-link" id="tab-baby-btn" data-bs-toggle="tab" data-bs-target="#tab-baby" onclick="switchProfileTab('tab-baby', this)"><i class="bi bi-emoji-smile me-1"></i> Baby Records (${baby ? baby.length : 0})</button>
      </li>
      <li class="nav-item">
        <button class="nav-link" id="tab-pnc-btn" data-bs-toggle="tab" data-bs-target="#tab-pnc" onclick="switchProfileTab('tab-pnc', this)"><i class="bi bi-bandaid me-1"></i> PNC Visits (${pncVisits ? pncVisits.length : 0})</button>
      </li>
      <li class="nav-item">
        <button class="nav-link" id="tab-lab-btn" data-bs-toggle="tab" data-bs-target="#tab-lab" onclick="switchProfileTab('tab-lab', this)"><i class="bi bi-vial me-1"></i> Lab Logs (${labRecords ? labRecords.length : 0})</button>
      </li>
      <li class="nav-item">
        <button class="nav-link" id="tab-meds-btn" data-bs-toggle="tab" data-bs-target="#tab-meds" onclick="switchProfileTab('tab-meds', this)"><i class="bi bi-capsule me-1"></i> Meds (${medRecords ? medRecords.length : 0})</button>
      </li>
    </ul>

    <!-- Tab Content Panes -->
    <div class="tab-content" id="profileTabContent">
      <!-- TAB 1: OVERVIEW -->
      <div class="tab-pane fade show active" id="tab-overview">
        <div class="row g-3">
          <div class="col-md-6">
            <div class="custom-card h-100">
              <div class="card-header"><h6 class="card-title">Demographics & Information</h6></div>
              <div class="card-body">
                <table class="table table-borderless small m-0">
                  <tr><th class="text-muted w-40">Full Name:</th><td class="fw-semibold">${patient.fullName}</td></tr>
                  <tr><th class="text-muted">Date of Birth:</th><td>${patient.dob ? patient.dob.split('T')[0] : 'N/A'} (${patient.age} yrs)</td></tr>
                  <tr><th class="text-muted">Phone Number:</th><td>${patient.phone}</td></tr>
                  <tr><th class="text-muted">Alt Phone:</th><td>${patient.altPhone || 'N/A'}</td></tr>
                  <tr><th class="text-muted">Address:</th><td>${patient.address}</td></tr>
                  <tr><th class="text-muted">Marital Status:</th><td>${patient.maritalStatus || 'N/A'}</td></tr>
                  <tr><th class="text-muted">Occupation:</th><td>${patient.occupation || 'N/A'}</td></tr>
                  <tr><th class="text-muted">Nationality:</th><td>${patient.nationality || 'Ghanaian'}</td></tr>
                </table>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="custom-card h-100">
              <div class="card-header"><h6 class="card-title">Emergency Contact & Hospital Details</h6></div>
              <div class="card-body">
                <table class="table table-borderless small m-0">
                  <tr><th class="text-muted w-40">Emergency Contact:</th><td class="fw-semibold text-danger">${patient.emergencyContactName}</td></tr>
                  <tr><th class="text-muted">Emergency Phone:</th><td>${patient.emergencyContactNumber}</td></tr>
                  <tr><th class="text-muted">Medical Record No:</th><td>${patient.medicalRecordNumber}</td></tr>
                  <tr><th class="text-muted">Registration Date:</th><td>${patient.registrationDate ? patient.registrationDate.split('T')[0] : 'N/A'}</td></tr>
                  <tr><th class="text-muted">Notes:</th><td>${patient.notes || 'None'}</td></tr>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: PREGNANCY -->
      <div class="tab-pane fade" id="tab-pregnancy">
        <div class="custom-card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h6 class="card-title">Active Pregnancy Information</h6>
            ${!activePregnancy ? `<button class="btn btn-sm btn-primary" onclick="openRegisterPregnancyModal('${patient._id}', '${patient.fullName}')">Register Pregnancy</button>` : ''}
          </div>
          <div class="card-body">
            ${activePregnancy ? `
              <div class="row g-3">
                <div class="col-md-3">
                  <div class="border rounded p-3 text-center bg-light">
                    <small class="text-muted d-block fw-semibold">Gestational Age</small>
                    <span class="fs-2 fw-bold text-primary">${activePregnancy.gestationalAgeWeeks}</span> <span class="small text-muted">Weeks</span>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="border rounded p-3 text-center bg-light">
                    <small class="text-muted d-block fw-semibold">Estimated EDD</small>
                    <span class="fs-4 fw-bold text-dark">${activePregnancy.edd ? activePregnancy.edd.split('T')[0] : 'N/A'}</span>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="border rounded p-3 text-center bg-light">
                    <small class="text-muted d-block fw-semibold">Gravida / Para</small>
                    <span class="fs-3 fw-bold text-secondary">G${activePregnancy.gravida} P${activePregnancy.para}</span>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="border rounded p-3 text-center bg-light">
                    <small class="text-muted d-block fw-semibold">LMP Date</small>
                    <span class="fs-4 fw-bold text-dark">${activePregnancy.lmp ? activePregnancy.lmp.split('T')[0] : 'N/A'}</span>
                  </div>
                </div>
                <div class="col-12 mt-3">
                  <p class="mb-1 small"><strong>Past History:</strong> ${activePregnancy.previousHistory || 'None specified'}</p>
                  <p class="mb-0 small"><strong>Clinical Notes:</strong> ${activePregnancy.notes || 'None'}</p>
                </div>
              </div>
            ` : `<div class="text-center py-4 text-muted">No active pregnancy registered for this patient.</div>`}
          </div>
        </div>
      </div>

      <!-- TAB 3: ANC VISITS -->
      <div class="tab-pane fade" id="tab-anc">
        <div class="custom-card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h6 class="card-title">Chronological Antenatal Care (ANC) Visits</h6>
            ${activePregnancy ? `<button class="btn btn-sm btn-success" onclick="openNewANCVisitModal('${patient._id}', '${activePregnancy._id}', '${patient.fullName}')">Record ANC Visit</button>` : ''}
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-custom">
                <thead>
                  <tr>
                    <th>Visit #</th>
                    <th>Date</th>
                    <th>GA (Wks)</th>
                    <th>Weight</th>
                    <th>BP</th>
                    <th>Fundal Ht</th>
                    <th>FHR</th>
                    <th>Risk Tag / Staff Flags</th>
                  </tr>
                </thead>
                <tbody>
                  ${ancVisits && ancVisits.length > 0 ? ancVisits.map((v) => `
                    <tr>
                      <td><span class="badge bg-light text-dark border">Visit #${v.visitNumber}</span></td>
                      <td>${v.visitDate ? v.visitDate.split('T')[0] : ''}</td>
                      <td>${v.gestationalAgeWeeks} wks</td>
                      <td>${v.weight} kg</td>
                      <td><strong>${v.bloodPressure}</strong></td>
                      <td>${v.fundalHeight || '-'} cm</td>
                      <td>${v.fetalHeartRate || '-'} bpm</td>
                      <td><span class="badge bg-amber-subtle text-amber border">${v.staffRiskFlags || 'Normal'}</span></td>
                    </tr>
                  `).join('') : `<tr><td colspan="8" class="text-center py-4 text-muted">No ANC visits recorded yet.</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 4: VISUAL TIMELINE -->
      <div class="tab-pane fade" id="tab-timeline">
        <div class="custom-card">
          <div class="card-header"><h6 class="card-title">Patient ANC / PNC Clinical Journey Timeline</h6></div>
          <div class="card-body">
            ${renderPatientTimeline(profile)}
          </div>
        </div>
      </div>

      <!-- TAB 5: APPOINTMENTS -->
      <div class="tab-pane fade" id="tab-appointments">
        <div class="custom-card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h6 class="card-title">Scheduled Appointments</h6>
            <button class="btn btn-sm btn-primary" onclick="openScheduleAppointmentForPatient('${patient._id}', '${patient.fullName}')">Schedule New Apt</button>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-custom">
                <thead>
                  <tr>
                    <th>Apt ID</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${appointments && appointments.length > 0 ? appointments.map((a) => `
                    <tr>
                      <td><span class="badge bg-light text-primary border">${a.appointmentId}</span></td>
                      <td>${a.type}</td>
                      <td>${a.appointmentDate ? a.appointmentDate.split('T')[0] : ''}</td>
                      <td>${a.appointmentTime}</td>
                      <td>${a.reason || 'Routine Checkup'}</td>
                      <td><span class="badge ${a.status === 'Completed' ? 'bg-success' : a.status === 'Missed' ? 'bg-danger' : 'bg-primary'}">${a.status}</span></td>
                    </tr>
                  `).join('') : `<tr><td colspan="6" class="text-center py-4 text-muted">No appointments scheduled.</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 6: DELIVERY -->
      <div class="tab-pane fade" id="tab-delivery">
        <div class="custom-card">
          <div class="card-header"><h6 class="card-title">Labor & Delivery Summary</h6></div>
          <div class="card-body">
            ${delivery ? `
              <div class="row g-3">
                <div class="col-md-3">
                  <div class="border rounded p-3 text-center bg-light">
                    <small class="text-muted d-block fw-semibold">Delivery Date</small>
                    <span class="fs-4 fw-bold text-dark">${delivery.deliveryDate ? delivery.deliveryDate.split('T')[0] : 'N/A'}</span>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="border rounded p-3 text-center bg-light">
                    <small class="text-muted d-block fw-semibold">Mode of Delivery</small>
                    <span class="fs-5 fw-bold text-primary">${delivery.modeOfDelivery}</span>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="border rounded p-3 text-center bg-light">
                    <small class="text-muted d-block fw-semibold">Outcome</small>
                    <span class="fs-5 fw-bold text-success">${delivery.outcome}</span>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="border rounded p-3 text-center bg-light">
                    <small class="text-muted d-block fw-semibold">Number of Babies</small>
                    <span class="fs-3 fw-bold text-dark">${delivery.numberOfBabies}</span>
                  </div>
                </div>
                <div class="col-12 mt-3">
                  <p class="mb-1 small"><strong>Place of Delivery:</strong> ${delivery.placeOfDelivery}</p>
                  <p class="mb-0 small"><strong>Maternal Notes:</strong> ${delivery.maternalNotes || 'None'}</p>
                </div>
              </div>
            ` : `<div class="text-center py-4 text-muted">No delivery record registered for this patient.</div>`}
          </div>
        </div>
      </div>

      <!-- TAB 7: BABY RECORDS -->
      <div class="tab-pane fade" id="tab-baby">
        <div class="custom-card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h6 class="card-title">Registered Newborn Babies</h6>
            ${delivery ? `<button class="btn btn-sm btn-primary" onclick="openRegisterBabyModal('${patient._id}', '${delivery._id}', '${patient.fullName}')">Register Baby</button>` : ''}
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-custom">
                <thead>
                  <tr>
                    <th>Baby ID</th>
                    <th>DOB</th>
                    <th>Sex</th>
                    <th>Birth Weight</th>
                    <th>APGAR (1/5 min)</th>
                    <th>Feeding</th>
                    <th>Immunizations</th>
                  </tr>
                </thead>
                <tbody>
                  ${baby && baby.length > 0 ? baby.map((b) => `
                    <tr>
                      <td><span class="badge bg-light text-primary border">${b.babyId}</span></td>
                      <td>${b.dob ? b.dob.split('T')[0] : ''}</td>
                      <td>${b.sex}</td>
                      <td><strong>${b.birthWeight} kg</strong></td>
                      <td>${b.apgar1Min || '-'}/${b.apgar5Min || '-'}</td>
                      <td>${b.feedingMethod}</td>
                      <td><small>${b.immunizationsGiven ? b.immunizationsGiven.join(', ') : 'BCG, OPV-0'}</small></td>
                    </tr>
                  `).join('') : `<tr><td colspan="7" class="text-center py-4 text-muted">No baby records registered.</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 8: PNC VISITS -->
      <div class="tab-pane fade" id="tab-pnc">
        <div class="custom-card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h6 class="card-title">Postnatal Care (PNC) Visit Logs</h6>
            ${delivery ? `<button class="btn btn-sm btn-primary" onclick="openNewPNCVisitModal('${patient._id}', '${delivery._id}', '${patient.fullName}')">Record PNC Visit</button>` : ''}
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-custom">
                <thead>
                  <tr>
                    <th>PNC Visit ID</th>
                    <th>Visit #</th>
                    <th>Date</th>
                    <th>Mother Weight</th>
                    <th>Mother BP</th>
                    <th>Lochia</th>
                    <th>Perineum / Wound</th>
                  </tr>
                </thead>
                <tbody>
                  ${pncVisits && pncVisits.length > 0 ? pncVisits.map((p) => `
                    <tr>
                      <td><span class="badge bg-light text-primary border">${p.pncVisitId}</span></td>
                      <td>Visit #${p.visitNumber}</td>
                      <td>${p.visitDate ? p.visitDate.split('T')[0] : ''}</td>
                      <td>${p.motherWeight || '-'} kg</td>
                      <td>${p.motherBloodPressure || '-'}</td>
                      <td><small>${p.lochiaAssessment || 'Normal'}</small></td>
                      <td><small>${p.perineumHealing || 'Normal'}</small></td>
                    </tr>
                  `).join('') : `<tr><td colspan="7" class="text-center py-4 text-muted">No PNC visits recorded yet.</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 9: LAB RECORDS -->
      <div class="tab-pane fade" id="tab-lab">
        <div class="custom-card">
          <div class="card-header"><h6 class="card-title">Laboratory Test History</h6></div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-custom">
                <thead>
                  <tr>
                    <th>Lab ID</th>
                    <th>Test Name</th>
                    <th>Test Date</th>
                    <th>Result</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  ${labRecords && labRecords.length > 0 ? labRecords.map((l) => `
                    <tr>
                      <td><span class="badge bg-light text-primary border">${l.labRecordId}</span></td>
                      <td class="fw-semibold">${l.testName}</td>
                      <td>${l.testDate ? l.testDate.split('T')[0] : ''}</td>
                      <td><strong>${l.result}</strong></td>
                      <td><small>${l.remarks || 'Normal'}</small></td>
                    </tr>
                  `).join('') : `<tr><td colspan="5" class="text-center py-4 text-muted">No lab records found.</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 10: MEDICATION RECORDS -->
      <div class="tab-pane fade" id="tab-meds">
        <div class="custom-card">
          <div class="card-header"><h6 class="card-title">Prescriptions & Supplements History</h6></div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-custom">
                <thead>
                  <tr>
                    <th>Med ID</th>
                    <th>Medication / Supplement</th>
                    <th>Dosage</th>
                    <th>Frequency</th>
                    <th>Start Date</th>
                    <th>Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  ${medRecords && medRecords.length > 0 ? medRecords.map((m) => `
                    <tr>
                      <td><span class="badge bg-light text-primary border">${m.medRecordId}</span></td>
                      <td class="fw-semibold">${m.medicationName}</td>
                      <td>${m.dosage}</td>
                      <td>${m.frequency}</td>
                      <td>${m.startDate ? m.startDate.split('T')[0] : ''}</td>
                      <td><small>${m.instructions || '-'}</small></td>
                    </tr>
                  `).join('') : `<tr><td colspan="6" class="text-center py-4 text-muted">No medication records found.</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;
}
