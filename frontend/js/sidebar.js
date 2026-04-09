// ============================================
// Big Data Pipeline Monitor — Sidebar navigace
// ============================================

// Tato funkce vygeneruje sidebar na každé stránce
function renderSidebar(activePage) {
    const sidebar = document.getElementById("sidebar");
    sidebar.innerHTML = `
        <div class="sidebar-brand">
            <span class="status-dot"></span>
            <span>Pipeline Monitor</span>
        </div>

        <div class="sidebar-section">
            <div class="sidebar-section-title">Přehled</div>
            <a href="index.html" class="sidebar-link ${activePage === 'dashboard' ? 'active' : ''}">
                <svg viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.2"/></svg>
                <span>Dashboard</span>
            </a>

            <div class="sidebar-section-title">Data</div>
            <a href="datasets.html" class="sidebar-link ${activePage === 'datasets' ? 'active' : ''}">
                <svg viewBox="0 0 16 16" fill="none"><ellipse cx="8" cy="4" rx="6" ry="2.5" stroke="currentColor" stroke-width="1.2"/><path d="M2 4v4c0 1.38 2.69 2.5 6 2.5s6-1.12 6-2.5V4" stroke="currentColor" stroke-width="1.2"/><path d="M2 8v4c0 1.38 2.69 2.5 6 2.5s6-1.12 6-2.5V8" stroke="currentColor" stroke-width="1.2"/></svg>
                <span>Datasety</span>
            </a>
            <a href="pipelines.html" class="sidebar-link ${activePage === 'pipelines' ? 'active' : ''}">
                <svg viewBox="0 0 16 16" fill="none"><path d="M2 8h3l2-4 2 8 2-4h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span>Pipeline</span>
            </a>

            <div class="sidebar-section-title">Monitoring</div>
            <a href="runs.html" class="sidebar-link ${activePage === 'runs' ? 'active' : ''}">
                <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.2"/><path d="M8 5v3l2 2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
                <span>Běhy</span>
            </a>
            <a href="alerts.html" class="sidebar-link ${activePage === 'alerts' ? 'active' : ''}">
                <svg viewBox="0 0 16 16" fill="none"><path d="M8 2l1.5 3h3.5l-2.75 2.5 1 3.5L8 9l-3.25 2 1-3.5L3 5h3.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>
                <span>Alerty</span>
                <span class="badge" id="alert-count" style="display:none;"></span>
            </a>
        </div>

        <div class="sidebar-user">
            <div class="avatar">AK</div>
            <span class="username">admin</span>
        </div>
    `;

    // Načti počet otevřených alertů
    loadAlertCount();
}

// Načte počet alertů a zobrazí badge
async function loadAlertCount() {
    try {
        const alerts = await apiGet("/alerts");
        const openAlerts = alerts.filter(a => a.status === "open").length;
        const badge = document.getElementById("alert-count");
        if (openAlerts > 0) {
            badge.textContent = openAlerts;
            badge.style.display = "inline";
        }
    } catch (e) {
        // Tiché selhání — badge se prostě nezobrazí
    }
}