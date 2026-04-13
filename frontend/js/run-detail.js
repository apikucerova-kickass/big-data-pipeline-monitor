// ============================================
// Big Data Pipeline Monitor — Detail běhu
// ============================================

const urlParams = new URLSearchParams(window.location.search);
const runId = urlParams.get("id");

async function loadRunDetail() {
    if (!runId) {
        showError("run-detail-content", "Chybí ID běhu");
        return;
    }

    showLoading("run-detail-content");

    try {
        const run = await apiGet(`/runs/${runId}`);

        const pipelineName = run.pipelines ? run.pipelines.name : "—";

        // Výpočet doby běhu
        let runtime = "—";
        if (run.started_at && run.finished_at) {
            const start = new Date(run.started_at);
            const end = new Date(run.finished_at);
            const diffMs = end - start;
            const diffSec = Math.round(diffMs / 1000);
            if (diffSec < 60) {
                runtime = diffSec + " s";
            } else {
                runtime = Math.round(diffSec / 60) + " min";
            }
        } else if (run.started_at && run.status === "running") {
            runtime = "probíhá...";
        }

        let html = "";

        // --- Hlavička ---
        html += `<div class="page-header">
            <div>
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 4px;">
                    <a href="runs.html" style="color: #6B7084; font-size: 14px;">← Zpět na seznam</a>
                </div>
                <h1>Běh: ${pipelineName}</h1>
                <p class="subtitle">ID: ${run.id}</p>
            </div>
            ${statusBadge(run.status)}
        </div>`;

        // --- Metadata ---
        html += `<div class="detail-meta">
            <div class="detail-meta-item">
                <div class="meta-label">Pipeline</div>
                <div class="meta-value">${pipelineName}</div>
            </div>
            <div class="detail-meta-item">
                <div class="meta-label">Status</div>
                <div class="meta-value">${statusBadge(run.status)}</div>
            </div>
            <div class="detail-meta-item">
                <div class="meta-label">Spuštěno</div>
                <div class="meta-value">${formatDate(run.started_at)}</div>
            </div>
            <div class="detail-meta-item">
                <div class="meta-label">Dokončeno</div>
                <div class="meta-value">${formatDate(run.finished_at)}</div>
            </div>
            <div class="detail-meta-item">
                <div class="meta-label">Doba běhu</div>
                <div class="meta-value">${runtime}</div>
            </div>
            <div class="detail-meta-item">
                <div class="meta-label">Zpracované záznamy</div>
                <div class="meta-value cell-mono">${run.records_processed ? run.records_processed.toLocaleString("cs-CZ") : "—"}</div>
            </div>
        </div>`;

        // --- Chybová zpráva ---
        if (run.error_message) {
            html += `<div class="panel" style="margin-bottom: 24px; border-color: #3B1A3A;">
                <div class="panel-header"><h2 style="color: #FCA5A5;">Chybová zpráva</h2></div>
                <div class="panel-body" style="color: #FCA5A5; font-size: 14px;">
                    ${run.error_message}
                </div>
            </div>`;
        }

        // --- Kroky běhu ---
        html += `<div class="panel">`;
        html += `<div class="panel-header"><h2>Kroky běhu</h2></div>`;

        if (run.steps && run.steps.length > 0) {
            html += `<div class="panel-body"><div class="steps-list">`;

            for (let i = 0; i < run.steps.length; i++) {
                const step = run.steps[i];

                // Simulace: pokud run doběhl, ukaž kroky podle výsledku
                let stepStatus = step.status;
                if (run.status === "success") {
                    stepStatus = "success";
                } else if (run.status === "failed") {
                    // Poslední krok selhal, předchozí uspěly
                    if (i < run.steps.length - 1) {
                        stepStatus = "success";
                    } else {
                        stepStatus = "failed";
                    }
                } else if (run.status === "running") {
                    if (i === 0) {
                        stepStatus = "running";
                    }
                }

                html += `<div class="step-item">
                    <div class="step-number">${i + 1}</div>
                    <span class="step-name">${step.name}</span>
                    ${statusBadge(stepStatus)}
                </div>`;
            }

            html += `</div></div>`;
        } else {
            html += `<div class="panel-body"><div class="state-empty">Žádné kroky</div></div>`;
        }
        html += `</div>`;

        document.getElementById("run-detail-content").innerHTML = html;

    } catch (error) {
        showError("run-detail-content", error.message);
    }
}

// Spusť po načtení stránky
loadRunDetail();