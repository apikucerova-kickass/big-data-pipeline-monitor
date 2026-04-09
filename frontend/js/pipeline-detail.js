// ============================================
// Big Data Pipeline Monitor — Detail pipeline
// ============================================

// Překlad cron výrazu do češtiny
function formatSchedule(cron) {
    if (!cron) return "—";

    const translations = {
        "0 2 * * *": "Denně v 02:00",
        "0 */4 * * *": "Každé 4 hodiny",
        "0 3 * * *": "Denně v 03:00",
        "0 6 * * 1": "Každé pondělí v 06:00",
        "0 1 * * *": "Denně v 01:00",
    };

    return translations[cron] || cron;
}

// ID pipeline z URL parametru
const urlParams = new URLSearchParams(window.location.search);
const pipelineId = urlParams.get("id");

// ID běhu pro ukončení (používá modal)
let currentRunId = null;

async function loadPipelineDetail() {
    if (!pipelineId) {
        showError("pipeline-detail-content", "Chybí ID pipeline");
        return;
    }

    showLoading("pipeline-detail-content");

    try {
        const [pipeline, runs] = await Promise.all([
            apiGet(`/pipelines/${pipelineId}`),
            apiGet(`/runs?pipeline_id=${pipelineId}`)
        ]);

        const datasetName = pipeline.datasets ? pipeline.datasets.name : "—";
        const successRuns = runs.filter(r => r.status === "success").length;
        const failedRuns = runs.filter(r => r.status === "failed").length;

        let html = "";

        // --- Hlavička ---
        html += `<div class="page-header">
            <div>
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 4px;">
                    <a href="pipelines.html" style="color: #6B7084; font-size: 14px;">← Zpět na seznam</a>
                </div>
                <h1>${pipeline.name}</h1>
                <p class="subtitle">${pipeline.description || "Bez popisu"}</p>
            </div>
            ${pipeline.active
                ? `<button class="btn btn-primary" onclick="runThisPipeline()">Spustit pipeline</button>`
                : `<span class="status-badge status-inactive"><span class="status-dot"></span>neaktivní</span>`
            }
        </div>`;

        // --- Metadata ---
        html += `<div class="detail-meta">
            <div class="detail-meta-item">
                <div class="meta-label">Dataset</div>
                <div class="meta-value">${datasetName}</div>
            </div>
            <div class="detail-meta-item">
                <div class="meta-label">Plán</div>
                <div class="meta-value">${formatSchedule(pipeline.schedule)}</div>
            </div>
            <div class="detail-meta-item">
                <div class="meta-label">Stav</div>
                <div class="meta-value">${pipeline.active ? statusBadge("success").replace("úspěch", "aktivní") : statusBadge("inactive")}</div>
            </div>
            <div class="detail-meta-item">
                <div class="meta-label">Úspěšné běhy</div>
                <div class="meta-value" style="color: #4ADE80;">${successRuns}</div>
            </div>
            <div class="detail-meta-item">
                <div class="meta-label">Neúspěšné běhy</div>
                <div class="meta-value" style="color: #FCA5A5;">${failedRuns}</div>
            </div>
            <div class="detail-meta-item">
                <div class="meta-label">Celkem běhů</div>
                <div class="meta-value">${runs.length}</div>
            </div>
        </div>`;

        // --- Tabulka běhů ---
        html += `<div class="panel">`;
        html += `<div class="panel-header"><h2>Historie běhů</h2></div>`;

        if (runs.length === 0) {
            html += `<div class="panel-body"><div class="state-empty">Žádné běhy. Klikni na "Spustit pipeline" pro vytvoření prvního běhu.</div></div>`;
        } else {
            html += `<table class="data-table"><thead><tr>
                <th>Status</th>
                <th>Spuštěno</th>
                <th>Dokončeno</th>
                <th>Záznamy</th>
                <th>Chyba</th>
                <th>Akce</th>
            </tr></thead><tbody>`;

            for (const r of runs) {
                const errorMsg = r.error_message || "—";
                let actions = `<a href="run-detail.html?id=${r.id}" class="btn btn-secondary btn-sm">Detail</a>`;

                // Pokud běží, ukáž tlačítko na ukončení
                if (r.status === "running") {
                    actions += ` <button class="btn btn-primary btn-sm" onclick="openFinishModal('${r.id}')">Ukončit</button>`;
                }

                html += `<tr>
                    <td>${statusBadge(r.status)}</td>
                    <td class="cell-muted">${formatDate(r.started_at)}</td>
                    <td class="cell-muted">${formatDate(r.finished_at)}</td>
                    <td class="cell-mono">${r.records_processed ? r.records_processed.toLocaleString("cs-CZ") : "—"}</td>
                    <td style="color: #FCA5A5; font-size: 13px;">${errorMsg}</td>
                    <td>${actions}</td>
                </tr>`;
            }

            html += `</tbody></table>`;
        }
        html += `</div>`;

        document.getElementById("pipeline-detail-content").innerHTML = html;

    } catch (error) {
        showError("pipeline-detail-content", error.message);
    }
}

// Spuštění pipeline
async function runThisPipeline() {
    if (!confirm("Opravdu chceš spustit tuto pipeline?")) return;

    try {
        await apiPost(`/pipelines/${pipelineId}/run`);
        loadPipelineDetail();
    } catch (error) {
        alert("Chyba při spouštění: " + error.message);
    }
}

// Otevření modalu pro ukončení běhu
function openFinishModal(runId) {
    currentRunId = runId;
    document.getElementById("finish-modal").classList.remove("hidden");
    document.getElementById("finish-error-msg").style.display = "none";
    document.getElementById("finish-status").value = "success";
    document.getElementById("finish-records").value = "";
    document.getElementById("finish-error").value = "";
}

// Zavření modalu
function closeFinishModal() {
    document.getElementById("finish-modal").classList.add("hidden");
    currentRunId = null;
}

// Ukončení běhu
async function finishRun() {
    const status = document.getElementById("finish-status").value;
    const records = document.getElementById("finish-records").value;
    const errorMessage = document.getElementById("finish-error").value.trim();

    const data = { status: status };
    if (records) data.records_processed = parseInt(records);
    if (errorMessage) data.error_message = errorMessage;

    try {
        await apiPatch(`/runs/${currentRunId}`, data);
        closeFinishModal();
        loadPipelineDetail();
    } catch (error) {
        document.getElementById("finish-error-msg").textContent = error.message;
        document.getElementById("finish-error-msg").style.display = "block";
    }
}

// Spusť po načtení stránky
loadPipelineDetail();