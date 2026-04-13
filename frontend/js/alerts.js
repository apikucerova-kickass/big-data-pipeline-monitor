// ============================================
// Big Data Pipeline Monitor — Alerty logika
// ============================================

// Mapování závažnosti na české popisky
const SEVERITY_LABELS = {
    critical: "kritický",
    warning: "varování",
    info: "informace"
};

// HTML badge pro závažnost
function severityBadge(severity) {
    const label = SEVERITY_LABELS[severity] || severity;

    if (severity === "critical") {
        return `<span style="background: #231520; color: #FCA5A5; padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: 500;">${label}</span>`;
    } else if (severity === "warning") {
        return `<span style="background: #1F1D14; color: #FDE68A; padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: 500;">${label}</span>`;
    } else {
        return `<span style="background: #141827; color: #A5B4FC; padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: 500;">${label}</span>`;
    }
}

// Mapování stavu alertu
const ALERT_STATUS_LABELS = {
    open: "otevřený",
    acknowledged: "potvrzený",
    resolved: "vyřešený"
};

function alertStatusBadge(status) {
    const label = ALERT_STATUS_LABELS[status] || status;

    if (status === "open") {
        return `<span style="color: #FCA5A5; font-size: 13px;">● ${label}</span>`;
    } else if (status === "acknowledged") {
        return `<span style="color: #FDE68A; font-size: 13px;">● ${label}</span>`;
    } else {
        return `<span style="color: #4ADE80; font-size: 13px;">● ${label}</span>`;
    }
}

async function loadAlerts() {
    showLoading("alerts-content");

    try {
        const alerts = await apiGet("/alerts");

        if (alerts.length === 0) {
            showEmpty("alerts-content", "Žádné alerty. Vše je v pořádku.");
            return;
        }

        let html = `<div class="panel">`;
        html += `<table class="data-table"><thead><tr>
            <th>Pipeline</th>
            <th>Zpráva</th>
            <th>Závažnost</th>
            <th>Stav</th>
            <th>Vytvořeno</th>
        </tr></thead><tbody>`;

        for (const a of alerts) {
            // Název pipeline z vnořeného objektu
            let pipelineName = "—";
            if (a.alert_rules && a.alert_rules.pipelines) {
                pipelineName = a.alert_rules.pipelines.name;
            } else if (a.alert_rules && a.alert_rules.name) {
                pipelineName = a.alert_rules.name;
            }

            html += `<tr>
                <td class="cell-name">${pipelineName}</td>
                <td>${a.message}</td>
                <td>${severityBadge(a.severity)}</td>
                <td>${alertStatusBadge(a.status)}</td>
                <td class="cell-muted">${formatDate(a.created_at)}</td>
            </tr>`;
        }

        html += `</tbody></table></div>`;

        document.getElementById("alerts-content").innerHTML = html;

    } catch (error) {
        showError("alerts-content", error.message);
    }
}

// Spusť po načtení stránky
loadAlerts();