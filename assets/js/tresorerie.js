document.addEventListener("DOMContentLoaded", async () => {
    try {
        await window.LCAuth.handleRedirect();
    } catch (e) {
        console.error(e);
    }

    const loadingEl = document.getElementById("tres-loading");
    const deniedEl = document.getElementById("tres-denied");
    const contentEl = document.getElementById("tres-content");
    loadingEl.style.display = "none";

    const authorized = window.LCAuth.isLoggedIn() && (window.LCAuth.hasGroup("tresorier") || window.LCAuth.hasGroup("admin"));
    if (!authorized) {
        deniedEl.style.display = "block";
        return;
    }
    contentEl.style.display = "block";

    const msgEl = document.getElementById("tres-msg");
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

    async function downloadCsv(path, filename) {
        const resp = await window.LCAuth.apiFetch(path);
        if (!resp.ok) throw new Error("Échec de l'export.");
        const text = await resp.text();
        const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    const eur = (n) => `${Number(n).toFixed(2)} €`;

    async function loadSummary() {
        const s = await api("/tresorerie/summary");
        document.getElementById("sum-cotisations").textContent = eur(s.totalCotisations);
        document.getElementById("sum-depenses").textContent = eur(s.totalDepenses);
        document.getElementById("sum-solde").textContent = eur(s.solde);
    }

    let membersById = {};

    async function loadMembersDropdown() {
        const members = await api("/tresorerie/membres");
        membersById = Object.fromEntries(members.map((m) => [m.memberId, m]));
        const select = document.getElementById("cotisation-membre");
        select.innerHTML = members.map((m) => `<option value="${m.memberId}">${m.nom || m.email}</option>`).join("");
    }

    // ---- cotisations ----
    async function loadCotisations() {
        const items = await api("/tresorerie/cotisations");
        const tbody = document.querySelector("#cotisations-table tbody");
        tbody.innerHTML = "";
        items.forEach((c) => {
            const member = membersById[c.memberId];
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${c.date}</td>
                <td>${member ? member.nom || member.email : c.memberId}</td>
                <td>${eur(c.montant)}</td>
                <td>${c.methode || ""}</td>
                <td><button class="admin-btn danger small" data-del-cot="${c.cotisationId}">Supprimer</button></td>
            `;
            tbody.appendChild(tr);
        });
        tbody.querySelectorAll("button[data-del-cot]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                if (!confirm("Supprimer cet enregistrement de cotisation ?")) return;
                try {
                    await api(`/tresorerie/cotisations/${btn.dataset.delCot}`, { method: "DELETE" });
                    showMessage("Cotisation supprimée.", "success");
                    await Promise.all([loadCotisations(), loadSummary()]);
                } catch (e) { showMessage(e.message, "error"); }
            });
        });
    }

    document.getElementById("cotisation-add-btn").addEventListener("click", async () => {
        const memberId = document.getElementById("cotisation-membre").value;
        const montant = document.getElementById("cotisation-montant").value;
        const date = document.getElementById("cotisation-date").value;
        const methode = document.getElementById("cotisation-methode").value;
        const annee = document.getElementById("cotisation-annee").value.trim();
        if (!memberId || !montant || !date) { showMessage("Membre, montant et date requis.", "error"); return; }
        try {
            await api("/tresorerie/cotisations", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memberId, montant: Number(montant), date, methode, annee }),
            });
            showMessage("Cotisation enregistrée.", "success");
            document.getElementById("cotisation-montant").value = "";
            document.getElementById("cotisation-annee").value = "";
            await Promise.all([loadCotisations(), loadSummary()]);
        } catch (e) { showMessage(e.message, "error"); }
    });

    document.getElementById("cotisations-export-btn").addEventListener("click", async (e) => {
        e.preventDefault();
        try {
            await downloadCsv("/tresorerie/cotisations/export", "cotisations.csv");
        } catch (e) { showMessage(e.message, "error"); }
    });

    // ---- dépenses ----
    async function loadDepenses() {
        const items = await api("/tresorerie/depenses");
        const tbody = document.querySelector("#depenses-table tbody");
        tbody.innerHTML = "";
        items.forEach((d) => {
            const tr = document.createElement("tr");
            const justif = d.justificatifUrl ? `<a href="${d.justificatifUrl}" target="_blank">Voir</a>` : "—";
            tr.innerHTML = `
                <td>${d.date}</td>
                <td>${d.libelle}</td>
                <td>${eur(d.montant)}</td>
                <td>${d.categorie || ""}</td>
                <td>${justif}</td>
                <td><button class="admin-btn danger small" data-del-dep="${d.depenseId}">Supprimer</button></td>
            `;
            tbody.appendChild(tr);
        });
        tbody.querySelectorAll("button[data-del-dep]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                if (!confirm("Supprimer cette dépense ?")) return;
                try {
                    await api(`/tresorerie/depenses/${btn.dataset.delDep}`, { method: "DELETE" });
                    showMessage("Dépense supprimée.", "success");
                    await Promise.all([loadDepenses(), loadSummary()]);
                } catch (e) { showMessage(e.message, "error"); }
            });
        });
    }

    const depenseCategorieSelect = document.getElementById("depense-categorie");
    const depenseCategorieAutre = document.getElementById("depense-categorie-autre");
    depenseCategorieSelect.addEventListener("change", () => {
        depenseCategorieAutre.style.display = depenseCategorieSelect.value === "autre" ? "inline-block" : "none";
        if (depenseCategorieSelect.value !== "autre") depenseCategorieAutre.value = "";
    });

    document.getElementById("depense-add-btn").addEventListener("click", async () => {
        const libelle = document.getElementById("depense-libelle").value.trim();
        const montant = document.getElementById("depense-montant").value;
        const date = document.getElementById("depense-date").value;
        const categorie = depenseCategorieSelect.value === "autre"
            ? depenseCategorieAutre.value.trim()
            : depenseCategorieSelect.value;
        const type = document.getElementById("depense-type").value;
        const fileInput = document.getElementById("depense-file");
        const file = fileInput.files[0];
        if (!libelle || !montant || !date) { showMessage("Libellé, montant et date requis.", "error"); return; }
        try {
            let justificatifKey = null;
            if (file) {
                const { uploadUrl, justificatifKey: key } = await api("/tresorerie/depenses/upload-url", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ filename: file.name, contentType: file.type }),
                });
                const putResp = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
                if (!putResp.ok) throw new Error("Échec du téléversement du justificatif.");
                justificatifKey = key;
            }
            const payload = { libelle, montant: Number(montant), date, categorie };
            if (type) payload.type = type;
            if (justificatifKey) payload.justificatifKey = justificatifKey;
            await api("/tresorerie/depenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            showMessage("Dépense enregistrée.", "success");
            ["depense-libelle", "depense-montant"].forEach((id) => (document.getElementById(id).value = ""));
            depenseCategorieSelect.value = "";
            depenseCategorieAutre.value = "";
            depenseCategorieAutre.style.display = "none";
            document.getElementById("depense-type").value = "";
            fileInput.value = "";
            await Promise.all([loadDepenses(), loadSummary()]);
        } catch (e) { showMessage(e.message, "error"); }
    });

    document.getElementById("depenses-export-btn").addEventListener("click", async (e) => {
        e.preventDefault();
        try {
            await downloadCsv("/tresorerie/depenses/export", "depenses.csv");
        } catch (e) { showMessage(e.message, "error"); }
    });

    try {
        await loadMembersDropdown();
        await Promise.all([loadSummary(), loadCotisations(), loadDepenses()]);
    } catch (e) {
        showMessage(e.message, "error");
    }
});
