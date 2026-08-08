document.addEventListener("DOMContentLoaded", async () => {
    try {
        await window.LCAuth.handleRedirect();
    } catch (e) {
        console.error(e);
    }

    const loadingEl = document.getElementById("sec-loading");
    const deniedEl = document.getElementById("sec-denied");
    const contentEl = document.getElementById("sec-content");
    loadingEl.style.display = "none";

    const authorized = window.LCAuth.isLoggedIn() && (window.LCAuth.hasGroup("secretaire") || window.LCAuth.hasGroup("admin"));
    if (!authorized) {
        deniedEl.style.display = "block";
        return;
    }
    contentEl.style.display = "block";

    const msgEl = document.getElementById("sec-msg");
    function showMessage(text, kind) {
        msgEl.textContent = text;
        msgEl.className = `admin-msg ${kind}`;
        setTimeout(() => { msgEl.className = "admin-msg"; }, 4000);
    }

    document.querySelectorAll(".admin-tab").forEach((btn) => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".admin-tab").forEach((b) => b.classList.remove("active"));
            document.querySelectorAll(".admin-panel").forEach((p) => p.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById(`panel-${btn.dataset.tab}`).classList.add("active");
        });
    });

    async function api(path, options) {
        const resp = await window.LCAuth.apiFetch(path, options);
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({ error: "Erreur inconnue" }));
            throw new Error(err.error || `Erreur ${resp.status}`);
        }
        return resp.status === 200 || resp.status === 201 ? resp.json() : null;
    }

    // ---- réunions ----
    async function loadReunions() {
        const items = await api("/secretariat/reunions");
        const tbody = document.querySelector("#reunions-table tbody");
        tbody.innerHTML = "";
        items.forEach((r) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${r.date}${r.heure ? " " + r.heure : ""}</td>
                <td>${r.titre}</td>
                <td>${r.lieu || ""}</td>
                <td>
                    <select data-reunion="${r.reunionId}">
                        <option value="planifiee" ${r.statut === "planifiee" ? "selected" : ""}>Planifiée</option>
                        <option value="terminee" ${r.statut === "terminee" ? "selected" : ""}>Terminée</option>
                        <option value="annulee" ${r.statut === "annulee" ? "selected" : ""}>Annulée</option>
                    </select>
                </td>
                <td><button class="admin-btn danger small" data-del-reunion="${r.reunionId}">Supprimer</button></td>
            `;
            tbody.appendChild(tr);
        });
        tbody.querySelectorAll("select[data-reunion]").forEach((sel) => {
            sel.addEventListener("change", async () => {
                try {
                    await api(`/secretariat/reunions/${sel.dataset.reunion}`, {
                        method: "PUT", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ statut: sel.value }),
                    });
                    showMessage("Statut mis à jour.", "success");
                } catch (e) { showMessage(e.message, "error"); }
            });
        });
        tbody.querySelectorAll("button[data-del-reunion]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                if (!confirm("Supprimer cette réunion ?")) return;
                try {
                    await api(`/secretariat/reunions/${btn.dataset.delReunion}`, { method: "DELETE" });
                    showMessage("Réunion supprimée.", "success");
                    await loadReunions();
                } catch (e) { showMessage(e.message, "error"); }
            });
        });
    }

    document.getElementById("reunion-add-btn").addEventListener("click", async () => {
        const titre = document.getElementById("reunion-titre").value.trim();
        const date = document.getElementById("reunion-date").value;
        const heure = document.getElementById("reunion-heure").value.trim();
        const lieu = document.getElementById("reunion-lieu").value.trim();
        const ordreDuJour = document.getElementById("reunion-ordre").value.trim();
        if (!titre || !date) { showMessage("Titre et date requis.", "error"); return; }
        try {
            await api("/secretariat/reunions", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ titre, date, heure, lieu, ordreDuJour }),
            });
            showMessage("Réunion planifiée.", "success");
            ["reunion-titre", "reunion-date", "reunion-heure", "reunion-lieu", "reunion-ordre"].forEach((id) => (document.getElementById(id).value = ""));
            await loadReunions();
        } catch (e) { showMessage(e.message, "error"); }
    });

    // ---- comptes-rendus ----
    async function loadComptesRendus() {
        const items = await api("/secretariat/comptes-rendus");
        const tbody = document.querySelector("#cr-table tbody");
        tbody.innerHTML = "";
        items.forEach((c) => {
            const tr = document.createElement("tr");
            const doc = c.documentUrl ? `<a href="${c.documentUrl}" target="_blank">Voir le PDF</a>` : "—";
            tr.innerHTML = `
                <td>${c.date}</td>
                <td>${c.titre}</td>
                <td>${doc}</td>
                <td><button class="admin-btn danger small" data-del-cr="${c.crId}">Supprimer</button></td>
            `;
            tbody.appendChild(tr);
        });
        tbody.querySelectorAll("button[data-del-cr]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                if (!confirm("Supprimer ce compte-rendu ?")) return;
                try {
                    await api(`/secretariat/comptes-rendus/${btn.dataset.delCr}`, { method: "DELETE" });
                    showMessage("Compte-rendu supprimé.", "success");
                    await loadComptesRendus();
                } catch (e) { showMessage(e.message, "error"); }
            });
        });
    }

    document.getElementById("cr-add-btn").addEventListener("click", async () => {
        const titre = document.getElementById("cr-titre").value.trim();
        const date = document.getElementById("cr-date").value;
        const contenu = document.getElementById("cr-contenu").value.trim();
        const fileInput = document.getElementById("cr-file");
        const file = fileInput.files[0];
        if (!titre || !date) { showMessage("Titre et date requis.", "error"); return; }
        try {
            let documentKey = null;
            if (file) {
                const { uploadUrl, documentKey: key } = await api("/secretariat/comptes-rendus/upload-url", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ filename: file.name, contentType: file.type || "application/pdf" }),
                });
                const putResp = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type || "application/pdf" }, body: file });
                if (!putResp.ok) throw new Error("Échec du téléversement du PDF.");
                documentKey = key;
            }
            const payload = { titre, date, contenu };
            if (documentKey) payload.documentKey = documentKey;
            await api("/secretariat/comptes-rendus", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            showMessage("Compte-rendu ajouté.", "success");
            ["cr-titre", "cr-date", "cr-contenu"].forEach((id) => (document.getElementById(id).value = ""));
            fileInput.value = "";
            await loadComptesRendus();
        } catch (e) { showMessage(e.message, "error"); }
    });

    // ---- décisions ----
    async function loadDecisions() {
        const items = await api("/secretariat/decisions");
        const tbody = document.querySelector("#decisions-table tbody");
        tbody.innerHTML = "";
        items.forEach((d) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${d.date}</td>
                <td>${d.titre}</td>
                <td>
                    <select data-decision="${d.decisionId}">
                        <option value="en_cours" ${d.statut === "en_cours" ? "selected" : ""}>En cours</option>
                        <option value="appliquee" ${d.statut === "appliquee" ? "selected" : ""}>Appliquée</option>
                        <option value="abandonnee" ${d.statut === "abandonnee" ? "selected" : ""}>Abandonnée</option>
                    </select>
                </td>
                <td><button class="admin-btn danger small" data-del-decision="${d.decisionId}">Supprimer</button></td>
            `;
            tbody.appendChild(tr);
        });
        tbody.querySelectorAll("select[data-decision]").forEach((sel) => {
            sel.addEventListener("change", async () => {
                try {
                    await api(`/secretariat/decisions/${sel.dataset.decision}`, {
                        method: "PUT", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ statut: sel.value }),
                    });
                    showMessage("Statut mis à jour.", "success");
                } catch (e) { showMessage(e.message, "error"); }
            });
        });
        tbody.querySelectorAll("button[data-del-decision]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                if (!confirm("Supprimer cette décision ?")) return;
                try {
                    await api(`/secretariat/decisions/${btn.dataset.delDecision}`, { method: "DELETE" });
                    showMessage("Décision supprimée.", "success");
                    await loadDecisions();
                } catch (e) { showMessage(e.message, "error"); }
            });
        });
    }

    document.getElementById("decision-add-btn").addEventListener("click", async () => {
        const titre = document.getElementById("decision-titre").value.trim();
        const date = document.getElementById("decision-date").value;
        const description = document.getElementById("decision-description").value.trim();
        if (!titre || !date) { showMessage("Titre et date requis.", "error"); return; }
        try {
            await api("/secretariat/decisions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ titre, date, description }) });
            showMessage("Décision enregistrée.", "success");
            ["decision-titre", "decision-date", "decision-description"].forEach((id) => (document.getElementById(id).value = ""));
            await loadDecisions();
        } catch (e) { showMessage(e.message, "error"); }
    });

    try {
        await Promise.all([loadReunions(), loadComptesRendus(), loadDecisions()]);
    } catch (e) {
        showMessage(e.message, "error");
    }
});
