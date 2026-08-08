/* ==========================================================================
   VISUAL TIMELINE GENERATOR FOR PATIENT ANC/PNC JOURNEY
   ========================================================================== */

function formatDateSafe(d) {
    if (!d) return 'N/A';
    try {
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return 'N/A';
        return dt.toISOString().split('T')[0];
    } catch (e) {
        return 'N/A';
    }
}

function renderPatientTimeline(profileData) {
    if (!profileData) return `<div class="text-center text-muted py-4">No profile data available.</div>`;
    const { pregnancy, ancVisits, delivery, baby, pncVisits } = profileData;
    const timelineEvents = [];

    // 1. Pregnancy Registration Event
    if (pregnancy) {
        timelineEvents.push({
            date: new Date(pregnancy.registeredDate || pregnancy.createdAt || Date.now()),
            title: 'Pregnancy Registered',
            badgeClass: 'badge-primary',
            icon: 'bi-balloon-heart',
            details: `Gravida ${pregnancy.gravida || 1}, Para ${pregnancy.para || 0}. LMP: ${formatDateSafe(pregnancy.lmp)}, EDD: ${formatDateSafe(pregnancy.edd)}`,
        });
    }

    // 2. ANC Visits Events
    if (ancVisits && ancVisits.length > 0) {
        ancVisits.forEach((anc) => {
            timelineEvents.push({
                date: new Date(anc.visitDate || Date.now()),
                title: `ANC Visit #${anc.visitNumber || 1} (${anc.gestationalAgeWeeks || '-'} Weeks GA)`,
                badgeClass: 'badge-info',
                icon: 'bi-journal-medical',
                details: `Weight: ${anc.weight || '-'}kg | BP: ${anc.bloodPressure || '-'} | Fundal Height: ${anc.fundalHeight || 'N/A'}cm | FHR: ${anc.fetalHeartRate || 'N/A'} bpm. ${anc.staffRiskFlags ? 'Tag: ' + anc.staffRiskFlags : ''}`,
            });
        });
    }

    // 3. Delivery Event
    if (delivery) {
        timelineEvents.push({
            date: new Date(delivery.deliveryDate || Date.now()),
            title: `Labor & Delivery Recorded (${delivery.modeOfDelivery || 'SVD'})`,
            badgeClass: 'badge-del',
            icon: 'bi-hospital-fill',
            details: `Outcome: ${delivery.outcome || 'Live Birth'} (${delivery.numberOfBabies || 1} baby/babies). Place: ${delivery.placeOfDelivery || 'Hospital'}`,
        });
    }

    // 4. PNC Visits Events
    if (pncVisits && pncVisits.length > 0) {
        pncVisits.forEach((pnc) => {
            timelineEvents.push({
                date: new Date(pnc.visitDate || Date.now()),
                title: `Postnatal Visit #${pnc.visitNumber || 1}`,
                badgeClass: 'badge-pnc',
                icon: 'bi-bandaid-fill',
                details: `Mother Weight: ${pnc.motherWeight || 'N/A'}kg | BP: ${pnc.motherBloodPressure || 'N/A'} | Breastfeeding: ${pnc.breastfeedingInformation || 'Active'}. Notes: ${pnc.notes || 'Normal recovery'}`,
            });
        });
    }

    // Sort chronological descending
    timelineEvents.sort((a, b) => b.date - a.date);

    if (timelineEvents.length === 0) {
        return `<div class="text-center text-muted py-4"><i class="bi bi-clock-history fs-3 d-block mb-2"></i>No clinical journey events recorded yet for this patient.</div>`;
    }

    let html = `<div class="timeline">`;
    timelineEvents.forEach((ev) => {
        let formattedDate = 'N/A';
        try {
            formattedDate = ev.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (e) {
            formattedDate = 'N/A';
        }
        html += `
      <div class="timeline-item">
        <div class="timeline-badge ${ev.badgeClass}"></div>
        <div class="timeline-content">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <h6 class="fw-bold mb-0 text-dark"><i class="bi ${ev.icon} me-1 text-primary"></i> ${ev.title}</h6>
            <span class="badge bg-light text-dark border extra-small">${formattedDate}</span>
          </div>
          <p class="small text-muted mb-0" style="line-height: 1.4;">${ev.details}</p>
        </div>
      </div>
    `;
    });
    html += `</div>`;

    return html;
}
