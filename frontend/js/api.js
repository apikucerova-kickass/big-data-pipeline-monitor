// ============================================
// Big Data Pipeline Monitor — API funkce
// ============================================

// ZMĚŇ toto na URL svého backendu
// Lokálně: "http://localhost:8000"
// Na Renderu: "https://tvoje-app.onrender.com"
const API_URL = "https://pipeline-monitor-api.onrender.com";

// GET požadavek — načtení dat
async function apiGet(path) {
    const response = await fetch(API_URL + path);
    if (!response.ok) {
        throw new Error("Chyba při načítání dat");
    }
    return response.json();
}

// POST požadavek — vytvoření nového záznamu
async function apiPost(path, data) {
    const response = await fetch(API_URL + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Chyba při odesílání");
    }
    return response.json();
}

// PATCH požadavek — aktualizace záznamu
async function apiPatch(path, data) {
    const response = await fetch(API_URL + path, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Chyba při aktualizaci");
    }
    return response.json();
}

// Pomocná funkce: formátování data
function formatDate(dateString) {
    if (!dateString) return "—";
    const date = new Date(dateString);
    const now = new Date();

    // Pokud je dnes, ukáž jen čas
    if (date.toDateString() === now.toDateString()) {
        return "dnes " + date.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
    }

    return date.toLocaleDateString("cs-CZ", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// Mapování statusů na české popisky
const STATUS_LABELS = {
    success: "úspěch",
    failed: "chyba",
    running: "běží",
    pending: "čeká",
    inactive: "neaktivní"
};

// Pomocná funkce: HTML pro status badge
function statusBadge(status) {
    const label = STATUS_LABELS[status] || status;
    return `<span class="status-badge status-${status}">
        <span class="status-dot"></span>
        ${label}
    </span>`;
}

// Pomocná funkce: zobrazení loading stavu
function showLoading(elementId) {
    document.getElementById(elementId).innerHTML = `
        <div class="state-loading">
            <div class="spinner"></div>
            Načítání...
        </div>
    `;
}

// Pomocná funkce: zobrazení prázdného stavu
function showEmpty(elementId, message) {
    document.getElementById(elementId).innerHTML = `
        <div class="state-empty">${message || "Žádná data"}</div>
    `;
}

// Pomocná funkce: české skloňování (1 alert, 2 alerty, 5 alertů)
function sklonuj(count, one, few, many) {
    if (count === 1) return count + " " + one;
    if (count >= 2 && count <= 4) return count + " " + few;
    return count + " " + many;
}

// Pomocná funkce: zobrazení chyby
function showError(elementId, message) {
    document.getElementById(elementId).innerHTML = `
        <div class="state-error">Chyba: ${message}</div>
    `;
}
