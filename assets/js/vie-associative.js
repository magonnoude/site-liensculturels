document.addEventListener("DOMContentLoaded", async () => {
    const API_BASE_URL = "https://8igk1o6vw4.execute-api.eu-west-3.amazonaws.com";

    const STATUS_LABELS = {
        planifiee: "Planifiée", terminee: "Terminée", annulee: "Annulée",
        en_cours: "En cours", appliquee: "Appliquée", abandonnee: "Abandonnée",
    };

    function esc(str) {
        const div = document.createElement("div");
        div.textContent = str == null ? "" : String(str);
        return div.innerHTML;
    }

    function statusBadge(statut) {
        if (!statut) return "";
        const label = STATUS_LABELS[statut] || statut;
        return `<span class="va-status ${statut}">${label}</span>`;
    }

    function renderReunions(items) {
        const container = document.getElementById("va-reunions");
        const emptyEl = document.getElementById("va-reunions-empty");
        if (!items.length) { emptyEl.style.display = "block"; return; }
        items.forEach((r) => {
            const div = document.createElement("div");
            div.className = "va-card";
            div.innerHTML = `
                <span class="va-date">${esc(r.date)}${r.heure ? " · " + esc(r.heure) : ""}</span>
                ${statusBadge(r.statut)}
                <h3>${esc(r.titre)}</h3>
                ${r.lieu ? `<p><i class="fas fa-location-dot"></i> ${esc(r.lieu)}</p>` : ""}
                ${r.ordreDuJour ? `<p>${esc(r.ordreDuJour)}</p>` : ""}
            `;
            container.appendChild(div);
        });
    }

    function renderComptesRendus(items) {
        const container = document.getElementById("va-cr");
        const emptyEl = document.getElementById("va-cr-empty");
        if (!items.length) { emptyEl.style.display = "block"; return; }
        items.forEach((c) => {
            const div = document.createElement("div");
            div.className = "va-card";
            div.innerHTML = `
                <span class="va-date">${esc(c.date)}</span>
                <h3>${esc(c.titre)}</h3>
                ${c.contenu ? `<p>${esc(c.contenu)}</p>` : ""}
            `;
            container.appendChild(div);
        });
    }

    function renderDecisions(items) {
        const container = document.getElementById("va-decisions");
        const emptyEl = document.getElementById("va-decisions-empty");
        if (!items.length) { emptyEl.style.display = "block"; return; }
        items.forEach((d) => {
            const div = document.createElement("div");
            div.className = "va-card";
            div.innerHTML = `
                <span class="va-date">${esc(d.date)}</span>
                ${statusBadge(d.statut)}
                <h3>${esc(d.titre)}</h3>
                ${d.description ? `<p>${esc(d.description)}</p>` : ""}
            `;
            container.appendChild(div);
        });
    }

    try {
        const resp = await fetch(`${API_BASE_URL}/public/vie-associative`);
        const data = await resp.json();
        renderReunions(data.reunions || []);
        renderComptesRendus(data.comptesRendus || []);
        renderDecisions(data.decisions || []);
    } catch (e) {
        ["va-reunions-empty", "va-cr-empty", "va-decisions-empty"].forEach((id) => {
            document.getElementById(id).style.display = "block";
        });
    }
});
