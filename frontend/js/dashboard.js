// ============================================
// Big Data Pipeline Monitor — Dashboard logika
// ============================================

async function loadDashboard() {
    showLoading("dashboard-content");

    try {
        // Načti všechna data paralelně
        const [datasets, pipelines, runs, alerts] = await Promise.all([
            apiGet("/datasets"),
            apiGet("/pipelines"),
            apiGet("/runs"),
            apiGet("/alerts")
        ]);

        const activePipelines = pipelines.filter(p => p.active).length;
        const failedRuns = runs.filter(r => r.status === "failed").length;
        const successRuns = runs.filter(r => r.status === "success").length;
        const openAlerts = alerts.filter(a => a.status === "open").length;
        const successRate = runs.length > 0 ? Math.round((successRuns / runs.length) * 100) : 0;

        let html = "";

        // --- Statistické kartičky (1. pád) ---
        html += `<div class="stats-grid">`;
        html += `
            <div class="stat-card">
                <div class="stat-label">Datasety</div>
                <div class="stat-value">${datasets.length}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Pipeline</div>
                <div class="stat-value">${pipelines.length}</div>
                <div class="stat-detail">${sklonuj(activePipelines, "aktivní", "aktivní", "aktivních")}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Běhy</div>
                <div class="stat-value">${runs.length}</div>
                <div class="stat-detail">${successRate} % úspěšných</div>
            </div>
        `;

        if (failedRuns > 0 || openAlerts > 0) {
            html += `
                <div class="stat-card stat-danger">
                    <div class="stat-label">Problémy</div>
                    <div class="stat-value">${failedRuns}</div>
                    <div class="stat-detail">${sklonuj(openAlerts, "alert", "alerty", "alertů")}</div>
                </div>
            `;
        } else {
            html += `
                <div class="stat-card">
                    <div class="stat-label">Problémy</div>
                    <div class="stat-value">0</div>
                    <div class="stat-detail">Vše v pořádku</div>
                </div>
            `;
        }
        html += `</div>`;

        // --- Dva panely vedle sebe ---
        html += `<div class="panels-grid">`;

        // Panel: Stav pipeline (s hlavičkami sloupců)
        html += `<div class="panel">`;
        html += `<div class="panel-header"><h2>Stav pipeline</h2><a href="pipelines.html" class="panel-action">Zobrazit vše</a></div>`;

        if (pipelines.length === 0) {
            html += `<div class="panel-body"><div class="state-empty">Žádné pipeline</div></div>`;
        } else {
            html += `<table class="mini-table"><thead><tr>
                <th>Název</th>
                <th style="text-align: right;">Status</th>
            </tr></thead><tbody>`;

            for (const p of pipelines) {
                const pipelineRuns = runs.filter(r => r.pipeline_id === p.id);
                const lastRun = pipelineRuns.length > 0 ? pipelineRuns[0] : null;

                let statusHtml = "";
                if (lastRun) {
                    statusHtml = statusBadge(lastRun.status);
                } else if (p.active) {
                    statusHtml = statusBadge("pending");
                } else {
                    statusHtml = statusBadge("inactive");
                }

                html += `<tr>
                    <td style="font-weight: 500;">${p.name}</td>
                    <td style="text-align: right;">${statusHtml}</td>
                </tr>`;
            }

            html += `</tbody></table>`;
        }
        html += `</div>`;

        // Panel: Poslední alerty (s hlavičkami sloupců)
        html += `<div class="panel">`;
        html += `<div class="panel-header"><h2>Poslední alerty</h2><a href="alerts.html" class="panel-action">Zobrazit vše</a></div>`;

        if (alerts.length === 0) {
            html += `<div class="panel-body"><div class="state-empty">Žádné alerty</div></div>`;
        } else {
            html += `<table class="mini-table"><thead><tr>
                <th>Zpráva</th>
                <th style="text-align: right;">Čas</th>
            </tr></thead><tbody>`;

            const recentAlerts = alerts.slice(0, 5);
            for (const a of recentAlerts) {
                const severityColor = a.severity === "critical" ? "#EF4444" : (a.severity === "warning" ? "#FBBF24" : "#818CF8");
                html += `<tr>
                    <td><span style="display: inline-flex; align-items: center; gap: 8px;">
                        <span style="width: 6px; height: 6px; border-radius: 50%; background: ${severityColor}; flex-shrink: 0;"></span>
                        ${a.message}
                    </span></td>
                    <td style="text-align: right; color: #9CA3AF; font-size: 12px;">${formatDate(a.created_at)}</td>
                </tr>`;
            }

            html += `</tbody></table>`;
        }
        html += `</div>`;

        html += `</div>`; // konec panels-grid

        // --- Tabulka posledních běhů ---
        html += `<div class="panel">`;
        html += `<div class="panel-header"><h2>Poslední běhy</h2><a href="runs.html" class="panel-action">Zobrazit vše</a></div>`;

        if (runs.length === 0) {
            html += `<div class="panel-body"><div class="state-empty">Žádné běhy</div></div>`;
        } else {
            html += `<table class="data-table"><thead><tr>
                <th>Pipeline</th>
                <th>Status</th>
                <th>Spuštěno</th>
                <th>Záznamy</th>
            </tr></thead><tbody>`;

            const recentRuns = runs.slice(0, 8);
            for (const r of recentRuns) {
                const pipelineName = r.pipelines ? r.pipelines.name : "—";
                html += `<tr>
                    <td class="cell-name">${pipelineName}</td>
                    <td>${statusBadge(r.status)}</td>
                    <td class="cell-muted">${formatDate(r.started_at)}</td>
                    <td class="cell-mono">${r.records_processed ? r.records_processed.toLocaleString("cs-CZ") : "—"}</td>
                </tr>`;
            }

            html += `</tbody></table>`;
        }
        html += `</div>`;

        document.getElementById("dashboard-content").innerHTML = html;

    } catch (error) {
        showError("dashboard-content", error.message);
    }
}

// Spusť po načtení stránky
loadDashboard();
