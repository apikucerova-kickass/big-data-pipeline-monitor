// ============================================
// Big Data Pipeline Monitor — Běhy logika
// ============================================

// Načti pipeline do filtru (jen jednou při startu)
async function loadPipelineFilter() {
    try {
        const pipelines = await apiGet("/pipelines");
        const select = document.getElementById("filter-pipeline");
        for (const p of pipelines) {
            select.innerHTML += `<option value="${p.id}">${p.name}</option>`;
        }
    } catch (e) {
        // Tiché selhání — filtr prostě nebude mít možnosti
    }
}

// Načtení seznamu běhů
async function loadRuns() {
    showLoading("runs-content");

    try {
        // Sestav URL s filtry
        const pipelineId = document.getElementById("filter-pipeline").value;
        const status = document.getElementById("filter-status").value;

        let path = "/runs?";
        if (pipelineId) path += `pipeline_id=${pipelineId}&`;
        if (status) path += `status=${status}&`;

        const runs = await apiGet(path);

        if (runs.length === 0) {
            showEmpty("runs-content", "Žádné běhy odpovídající filtrům.");
            return;
        }

        let html = `<div class="panel">`;
        html += `<table class="data-table"><thead><tr>
            <th>Pipeline</th>
            <th>Status</th>
            <th>Spuštěno</th>
            <th>Dokončeno</th>
            <th>Záznamy</th>
            <th>Akce</th>
        </tr></thead><tbody>`;

        for (const r of runs) {
            const pipelineName = r.pipelines ? r.pipelines.name : "—";

            html += `<tr>
                <td class="cell-name">${pipelineName}</td>
                <td>${statusBadge(r.status)}</td>
                <td class="cell-muted">${formatDate(r.started_at)}</td>
                <td class="cell-muted">${formatDate(r.finished_at)}</td>
                <td class="cell-mono">${r.records_processed ? r.records_processed.toLocaleString("cs-CZ") : "—"}</td>
                <td><a href="run-detail.html?id=${r.id}" class="btn btn-secondary btn-sm">Detail</a></td>
            </tr>`;
        }

        html += `</tbody></table></div>`;

        document.getElementById("runs-content").innerHTML = html;

    } catch (error) {
        showError("runs-content", error.message);
    }
}

// Spusť po načtení stránky
loadPipelineFilter();
loadRuns();