document.addEventListener("DOMContentLoaded", async () => {
    try {
        await window.LCAuth.handleRedirect();
    } catch (e) {
        console.error(e);
    }

    const loadingEl = document.getElementById("escales-loading");
    const deniedEl = document.getElementById("escales-denied");
    const contentEl = document.getElementById("escales-content");
    loadingEl.style.display = "none";

    // Bypass admin volontaire, comme Communication (confirmé avec l'association) —
    // à l'opposé du choix fait pour Gouvernance.
    const authorized = window.LCAuth.isLoggedIn() &&
        (window.LCAuth.hasGroup("escales") || window.LCAuth.hasGroup("admin"));
    if (!authorized) {
        deniedEl.style.display = "block";
        return;
    }
    contentEl.style.display = "block";

    const topbarUser = document.getElementById("topbar-user");
    if (topbarUser) {
        document.getElementById("topbar-user-name").textContent = window.LCAuth.getDisplayName();
        topbarUser.style.display = "inline-flex";
    }

    const RUBRIQUE_LABELS = {
        "lieux-paysages": "Lieux & Paysages",
        "savoir-faire-saveurs": "Savoir-faire & Saveurs",
        "vivre-celebrer": "Vivre & Célébrer",
        "visages-jumelage": "Visages du Jumelage",
    };
    const TERRITOIRE_LABELS = {
        "nogent-artaud": "Nogent-l'Artaud",
        "save": "Savè",
        "caraibes": "Caraïbes",
    };

    const msgEl = document.getElementById("escales-msg");
    function showMessage(text, kind) {
        msgEl.textContent = text;
        msgEl.className = `admin-msg ${kind}`;
        setTimeout(() => { msgEl.className = "admin-msg"; }, 4000);
    }

    async function api(path, options) {
        const resp = await window.LCAuth.apiFetch(path, options);
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({ error: "Erreur inconnue" }));
            throw new Error(err.error || `Erreur ${resp.status}`);
        }
        return resp.status === 200 || resp.status === 201 ? resp.json() : null;
    }

    const territoireSelect = document.getElementById("escales-territoire");
    const rubriqueSelect = document.getElementById("escales-rubrique");
    const titreInput = document.getElementById("escales-titre");
    const texteInput = document.getElementById("escales-texte");
    const fileInput = document.getElementById("escales-file");
    const fileHint = document.getElementById("escales-file-hint");
    const submitBtn = document.getElementById("escales-submit-btn");
    const cancelEditBtn = document.getElementById("escales-cancel-edit-btn");
    const formTitle = document.getElementById("escales-form-title");
    const filterSelect = document.getElementById("escales-filter-territoire");
    const grid = document.getElementById("escales-grid");

    let editingId = null;

    function resetForm() {
        editingId = null;
        titreInput.value = "";
        texteInput.value = "";
        fileInput.value = "";
        territoireSelect.selectedIndex = 0;
        rubriqueSelect.selectedIndex = 0;
        formTitle.textContent = "Ajouter une fiche";
        submitBtn.textContent = "Ajouter la fiche";
        fileHint.textContent = "Photo requise à la création.";
        cancelEditBtn.style.display = "none";
    }

    function startEdit(fiche) {
        editingId = fiche.ficheId;
        territoireSelect.value = fiche.territoire;
        rubriqueSelect.value = fiche.rubrique;
        titreInput.value = fiche.titre;
        texteInput.value = fiche.texte;
        fileInput.value = "";
        formTitle.textContent = `Modifier : ${fiche.titre}`;
        submitBtn.textContent = "Enregistrer les modifications";
        fileHint.textContent = "Laisser vide pour conserver la photo actuelle.";
        cancelEditBtn.style.display = "";
        contentEl.querySelector(".admin-card").scrollIntoView({ behavior: "smooth" });
    }

    cancelEditBtn.addEventListener("click", resetForm);

    async function loadFiches() {
        const ville = filterSelect.value;
        const qs = ville ? `?ville=${encodeURIComponent(ville)}` : "";
        const resp = await fetch(`https://8igk1o6vw4.execute-api.eu-west-3.amazonaws.com/escales${qs}`);
        const items = await resp.json();
        grid.innerHTML = "";
        items.forEach((fiche) => {
            const div = document.createElement("div");
            div.className = "gallery-admin-item";
            div.innerHTML = `
                <img src="${fiche.imageUrl}" alt="${fiche.titre}">
                <div style="font-size:0.8rem; padding:0.4rem 0.5rem;">
                    <strong>${fiche.titre}</strong><br>
                    ${TERRITOIRE_LABELS[fiche.territoire] || fiche.territoire} — ${RUBRIQUE_LABELS[fiche.rubrique] || fiche.rubrique}
                </div>
                <button class="admin-btn secondary small" data-edit="${fiche.ficheId}" style="margin:0.3rem 0.5rem;">Modifier</button>
                <button class="del-btn" data-item="${fiche.ficheId}" title="Supprimer">&times;</button>
            `;
            grid.appendChild(div);
            div.querySelector("[data-edit]").addEventListener("click", () => startEdit(fiche));
        });
        grid.querySelectorAll("button[data-item]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                if (!confirm("Supprimer cette fiche ?")) return;
                try {
                    await api(`/escales/fiches/${btn.dataset.item}`, { method: "DELETE" });
                    showMessage("Fiche supprimée.", "success");
                    if (editingId === btn.dataset.item) resetForm();
                    await loadFiches();
                } catch (e) {
                    showMessage(e.message, "error");
                }
            });
        });
    }

    filterSelect.addEventListener("change", loadFiches);

    submitBtn.addEventListener("click", async () => {
        const titre = titreInput.value.trim();
        const texte = texteInput.value.trim();
        const territoire = territoireSelect.value;
        const rubrique = rubriqueSelect.value;
        const file = fileInput.files[0];

        if (!titre || !texte) {
            showMessage("Titre et texte requis.", "error");
            return;
        }
        if (!editingId && !file) {
            showMessage("Photo requise à la création.", "error");
            return;
        }

        const body = { territoire, rubrique, titre, texte };
        if (file) {
            body.filename = file.name;
            body.contentType = file.type;
        }

        try {
            const result = editingId
                ? await api(`/escales/fiches/${editingId}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(body),
                  })
                : await api("/escales/fiches", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(body),
                  });

            if (file && result.uploadUrl) {
                const putResp = await fetch(result.uploadUrl, {
                    method: "PUT",
                    headers: { "Content-Type": file.type },
                    body: file,
                });
                if (!putResp.ok) throw new Error("Échec du téléversement de la photo.");
            }

            showMessage(editingId ? "Fiche modifiée." : "Fiche ajoutée.", "success");
            resetForm();
            await loadFiches();
        } catch (e) {
            showMessage(e.message, "error");
        }
    });

    try {
        await loadFiches();
    } catch (e) {
        showMessage(e.message, "error");
    }
});
