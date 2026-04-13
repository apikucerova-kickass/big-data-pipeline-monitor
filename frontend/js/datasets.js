// ============================================
// Big Data Pipeline Monitor — Datasety logika
// ============================================

async function loadDatasets() {
    showLoading("datasets-content");

    try {
        const datasets = await apiGet("/datasets");

        if (datasets.length === 0) {
            showEmpty("datasets-content", "Žádné datasety. Klikni na '+ Nový dataset' pro vytvoření.");
            return;
        }

        let html = `<div class="panel">`;
        html += `<table class="data-table"><thead><tr>
            <th>Název</th>
            <th>Popis</th>
            <th>Vlastník</th>
            <th>Verze schématu</th>
            <th>Vytvořeno</th>
        </tr></thead><tbody>`;

        for (const ds of datasets) {
            html += `<tr>
                <td class="cell-name">${ds.name}</td>
                <td class="cell-muted">${ds.description || "—"}</td>
                <td class="cell-muted">${ds.owner}</td>
                <td class="cell-mono">${ds.schema_version}</td>
                <td class="cell-muted">${formatDate(ds.created_at)}</td>
            </tr>`;
        }

        html += `</tbody></table></div>`;

        document.getElementById("datasets-content").innerHTML = html;

    } catch (error) {
        showError("datasets-content", error.message);
    }
}

// Otevření modalu
function openCreateModal() {
    document.getElementById("create-modal").classList.remove("hidden");
    document.getElementById("create-error").style.display = "none";
}

// Zavření modalu
function closeCreateModal() {
    document.getElementById("create-modal").classList.add("hidden");
    document.getElementById("dataset-name").value = "";
    document.getElementById("dataset-description").value = "";
    document.getElementById("dataset-owner").value = "";
}

// Vytvoření datasetu
async function createDataset() {
    const name = document.getElementById("dataset-name").value.trim();
    const description = document.getElementById("dataset-description").value.trim();
    const owner = document.getElementById("dataset-owner").value.trim();

    if (!name) {
        document.getElementById("create-error").textContent = "Název je povinný";
        document.getElementById("create-error").style.display = "block";
        return;
    }

    if (!owner) {
        document.getElementById("create-error").textContent = "Vlastník je povinný";
        document.getElementById("create-error").style.display = "block";
        return;
    }

    try {
        await apiPost("/datasets", {
            name: name,
            description: description || null,
            owner: owner
        });

        closeCreateModal();
        loadDatasets();
    } catch (error) {
        document.getElementById("create-error").textContent = error.message;
        document.getElementById("create-error").style.display = "block";
    }
}

// Spusť po načtení stránky
loadDatasets();