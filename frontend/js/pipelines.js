// ============================================
// Big Data Pipeline Monitor — Pipeline logika
// ============================================

// Načtení seznamu pipeline
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

async function loadPipelines() {
    showLoading("pipelines-content");

    try {
        const [pipelines, runs] = await Promise.all([
            apiGet("/pipelines"),
            apiGet("/runs")
        ]);

        if (pipelines.length === 0) {
            showEmpty("pipelines-content", "Žádné pipeline. Klikni na '+ Nová pipeline' pro vytvoření.");
            return;
        }

        let html = `<div class="panel">`;
        html += `<table class="data-table"><thead><tr>
            <th>Název</th>
            <th>Dataset</th>
            <th>Plán spuštění</th>
            <th>Stav</th>
            <th>Poslední běh</th>
            <th>Akce</th>
        </tr></thead><tbody>`;

        for (const p of pipelines) {
            // Najdi poslední run pro tuto pipeline
            const pipelineRuns = runs.filter(r => r.pipeline_id === p.id);
            const lastRun = pipelineRuns.length > 0 ? pipelineRuns[0] : null;

            const datasetName = p.datasets ? p.datasets.name : "—";
            const schedule = p.schedule || "—";

            // Status pipeline
            let pipelineStatus = "";
            if (!p.active) {
                pipelineStatus = statusBadge("inactive");
            } else if (lastRun) {
                pipelineStatus = statusBadge(lastRun.status);
            } else {
                pipelineStatus = statusBadge("pending");
            }

            // Poslední běh
            const lastRunDate = lastRun ? formatDate(lastRun.started_at) : "—";

            // Tlačítka
            let actions = `<a href="pipeline-detail.html?id=${p.id}" class="btn btn-secondary btn-sm">Detail</a> `;
            if (p.active) {
                actions += `<button class="btn btn-primary btn-sm" onclick="runPipeline('${p.id}')">Spustit</button>`;
            }

            html += `<tr>
                <td class="cell-name">${p.name}</td>
                <td class="cell-muted">${datasetName}</td>
                <td class="cell-muted">${formatSchedule(p.schedule)}</td>
                <td>${pipelineStatus}</td>
                <td class="cell-muted">${lastRunDate}</td>
                <td>${actions}</td>
            </tr>`;
        }

        html += `</tbody></table></div>`;

        document.getElementById("pipelines-content").innerHTML = html;

    } catch (error) {
        showError("pipelines-content", error.message);
    }
}

// Spuštění pipeline
async function runPipeline(pipelineId) {
    if (!confirm("Opravdu chceš spustit tuto pipeline?")) return;

    try {
        await apiPost(`/pipelines/${pipelineId}/run`);
        // Znovu načti seznam (aktualizuje se status)
        loadPipelines();
    } catch (error) {
        alert("Chyba při spouštění: " + error.message);
    }
}

// Otevření modalu pro vytvoření
async function openCreateModal() {
    document.getElementById("create-modal").classList.remove("hidden");
    document.getElementById("create-error").style.display = "none";

    // Načti datasety do selectu
    try {
        const datasets = await apiGet("/datasets");
        const select = document.getElementById("pipeline-dataset");
        select.innerHTML = "";
        for (const ds of datasets) {
            select.innerHTML += `<option value="${ds.id}">${ds.name}</option>`;
        }
    } catch (error) {
        document.getElementById("create-error").textContent = "Nepodařilo se načíst datasety";
        document.getElementById("create-error").style.display = "block";
    }
}

// Zavření modalu
function closeCreateModal() {
    document.getElementById("create-modal").classList.add("hidden");
    document.getElementById("pipeline-name").value = "";
    document.getElementById("pipeline-description").value = "";
    document.getElementById("pipeline-schedule").value = "";
}

// Vytvoření nové pipeline
async function createPipeline() {
    const name = document.getElementById("pipeline-name").value.trim();
    const description = document.getElementById("pipeline-description").value.trim();
    const datasetId = document.getElementById("pipeline-dataset").value;
    const schedule = document.getElementById("pipeline-schedule").value.trim();

    if (!name) {
        document.getElementById("create-error").textContent = "Název je povinný";
        document.getElementById("create-error").style.display = "block";
        return;
    }

    try {
        await apiPost("/pipelines", {
            dataset_id: datasetId,
            name: name,
            description: description || null,
            schedule: schedule || null,
            active: true
        });

        closeCreateModal();
        loadPipelines();
    } catch (error) {
        document.getElementById("create-error").textContent = error.message;
        document.getElementById("create-error").style.display = "block";
    }
}

// Spusť po načtení stránky
loadPipelines();