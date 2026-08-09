document.addEventListener("DOMContentLoaded", async () => {
    try {
        await window.LCAuth.handleRedirect();
    } catch (e) {
        console.error(e);
    }

    const loadingEl = document.getElementById("admin-loading");
    const deniedEl = document.getElementById("admin-denied");
    const contentEl = document.getElementById("admin-content");
    loadingEl.style.display = "none";

    if (!window.LCAuth.isLoggedIn() || !window.LCAuth.hasGroup("admin")) {
        deniedEl.style.display = "block";
        return;
    }
    contentEl.style.display = "block";

    const msgEl = document.getElementById("admin-msg");
    function showMessage(text, kind) {
        msgEl.textContent = text;
        msgEl.className = `admin-msg ${kind}`;
        setTimeout(() => { msgEl.className = "admin-msg"; }, 4000);
    }

    // ---- tabs ----
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

    // ---- membres ----
    const GROUP_LABELS = { admin: "Admin", secretaire: "Secrétaire", tresorier: "Trésorier", membre: "Membre" };

    async function loadMembers() {
        const members = await api("/admin/members");
        const tbody = document.querySelector("#members-table tbody");
        tbody.innerHTML = "";
        members.forEach((m) => {
            const tr = document.createElement("tr");
            const groups = m.groups || [];
            const groupOptions = Object.entries(GROUP_LABELS)
                .map(([value, label]) => `<option value="${value}" ${groups.includes(value) ? "selected" : ""}>${label}</option>`)
                .join("");
            tr.innerHTML = `
                <td>${m.nom || ""}</td>
                <td>${m.email || ""}</td>
                <td>${m.telephone || ""}</td>
                <td>
                    <select data-member="${m.memberId}">
                        <option value="inconnu" ${m.statutCotisation === "inconnu" ? "selected" : ""}>Non renseigné</option>
                        <option value="a_jour" ${m.statutCotisation === "a_jour" ? "selected" : ""}>À jour</option>
                        <option value="impaye" ${m.statutCotisation === "impaye" ? "selected" : ""}>Impayée</option>
                    </select>
                </td>
                <td>
                    <select multiple size="4" data-groups-member="${m.memberId}" data-groups-email="${m.email || ""}" title="Ctrl/Cmd+clic pour sélectionner plusieurs rôles">
                        ${groupOptions}
                    </select>
                </td>
            `;
            tbody.appendChild(tr);
        });
        tbody.querySelectorAll("select[data-member]").forEach((sel) => {
            sel.addEventListener("change", async () => {
                try {
                    await api(`/admin/members/${sel.dataset.member}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ statutCotisation: sel.value }),
                    });
                    showMessage("Statut de cotisation mis à jour.", "success");
                } catch (e) {
                    showMessage(e.message, "error");
                }
            });
        });
        tbody.querySelectorAll("select[data-groups-member]").forEach((sel) => {
            sel.addEventListener("change", async () => {
                const newGroups = Array.from(sel.selectedOptions).map((o) => o.value);
                if (!newGroups.includes("admin") && Array.from(sel.options).some((o) => o.value === "admin" && o.defaultSelected)) {
                    if (!confirm("Retirer le rôle Admin à ce compte ? Il perdra l'accès à l'espace admin.")) {
                        sel.querySelector('option[value="admin"]').selected = true;
                        return;
                    }
                }
                try {
                    await api(`/admin/members/${sel.dataset.groupsMember}/groups`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: sel.dataset.groupsEmail, groups: newGroups }),
                    });
                    showMessage("Rôles mis à jour.", "success");
                    sel.querySelectorAll("option").forEach((o) => { o.defaultSelected = o.selected; });
                } catch (e) {
                    showMessage(e.message, "error");
                }
            });
        });
    }

    document.getElementById("invite-btn").addEventListener("click", async () => {
        const nom = document.getElementById("invite-nom").value.trim();
        const email = document.getElementById("invite-email").value.trim();
        const groups = Array.from(document.getElementById("invite-groups").selectedOptions).map((o) => o.value);
        if (!nom || !email) { showMessage("Nom et e-mail requis.", "error"); return; }
        try {
            await api("/admin/members/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nom, email, groups }),
            });
            showMessage("Invitation envoyée.", "success");
            document.getElementById("invite-nom").value = "";
            document.getElementById("invite-email").value = "";
            await loadMembers();
        } catch (e) {
            showMessage(e.message, "error");
        }
    });

    // ---- documents ----
    async function loadDocuments() {
        const docs = await api("/admin/documents");
        const tbody = document.querySelector("#documents-table tbody");
        tbody.innerHTML = "";
        docs.forEach((d) => {
            const tr = document.createElement("tr");
            const sizeKo = Math.round(d.size / 1024);
            tr.innerHTML = `
                <td><a href="${d.url}" target="_blank">${d.filename}</a></td>
                <td>${sizeKo} Ko</td>
                <td><button class="admin-btn danger small" data-doc="${d.filename}">Supprimer</button></td>
            `;
            tbody.appendChild(tr);
        });
        tbody.querySelectorAll("button[data-doc]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                if (!confirm(`Supprimer ${btn.dataset.doc} ?`)) return;
                try {
                    await api(`/admin/documents/${encodeURIComponent(btn.dataset.doc)}`, { method: "DELETE" });
                    showMessage("Document supprimé.", "success");
                    await loadDocuments();
                } catch (e) {
                    showMessage(e.message, "error");
                }
            });
        });
    }

    document.getElementById("doc-upload-btn").addEventListener("click", async () => {
        const fileInput = document.getElementById("doc-file");
        const file = fileInput.files[0];
        if (!file) { showMessage("Choisissez un fichier PDF.", "error"); return; }
        try {
            const { uploadUrl } = await api("/admin/documents/upload-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename: file.name, contentType: file.type || "application/pdf" }),
            });
            const putResp = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type || "application/pdf" }, body: file });
            if (!putResp.ok) throw new Error("Échec du téléversement.");
            showMessage("Document ajouté.", "success");
            fileInput.value = "";
            await loadDocuments();
        } catch (e) {
            showMessage(e.message, "error");
        }
    });

    // ---- agenda ----
    async function loadAgenda() {
        const events = await fetch("https://8igk1o6vw4.execute-api.eu-west-3.amazonaws.com/agenda").then((r) => r.json());
        const tbody = document.querySelector("#agenda-table tbody");
        tbody.innerHTML = "";
        events.forEach((e) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${e.start}${e.end ? " → " + e.end : ""}</td>
                <td>${e.title}</td>
                <td>${e.location || ""}</td>
                <td><button class="admin-btn danger small" data-event="${e.eventId}">Supprimer</button></td>
            `;
            tbody.appendChild(tr);
        });
        tbody.querySelectorAll("button[data-event]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                if (!confirm("Supprimer cet événement ?")) return;
                try {
                    await api(`/admin/agenda/${btn.dataset.event}`, { method: "DELETE" });
                    showMessage("Événement supprimé.", "success");
                    await loadAgenda();
                } catch (e) {
                    showMessage(e.message, "error");
                }
            });
        });
    }

    document.getElementById("event-add-btn").addEventListener("click", async () => {
        const title = document.getElementById("event-title").value.trim();
        const start = document.getElementById("event-start").value;
        const end = document.getElementById("event-end").value;
        const time = document.getElementById("event-time").value.trim();
        const location = document.getElementById("event-location").value.trim();
        const description = document.getElementById("event-description").value.trim();
        if (!title || !start) { showMessage("Titre et date de début requis.", "error"); return; }
        const payload = { title, start, time, location, description };
        if (end) payload.end = end;
        try {
            await api("/admin/agenda", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            showMessage("Événement ajouté.", "success");
            ["event-title", "event-start", "event-end", "event-time", "event-location", "event-description"].forEach(
                (id) => (document.getElementById(id).value = "")
            );
            await loadAgenda();
        } catch (e) {
            showMessage(e.message, "error");
        }
    });

    // ---- galerie ----
    async function loadGallery() {
        const [photos, videos] = await Promise.all([
            fetch("https://8igk1o6vw4.execute-api.eu-west-3.amazonaws.com/gallery?type=photo").then((r) => r.json()),
            fetch("https://8igk1o6vw4.execute-api.eu-west-3.amazonaws.com/gallery?type=video").then((r) => r.json()),
        ]);
        const grid = document.getElementById("gallery-admin-grid");
        grid.innerHTML = "";
        [...photos, ...videos].forEach((item) => {
            const div = document.createElement("div");
            div.className = "gallery-admin-item";
            const media =
                item.mediaType === "photo"
                    ? `<img src="${item.imageUrl}" alt="${item.title}">`
                    : `<div class="video-placeholder"><i class="fas fa-video"></i></div>`;
            div.innerHTML = `${media}<button class="del-btn" data-item="${item.itemId}" title="Supprimer">&times;</button>`;
            grid.appendChild(div);
        });
        grid.querySelectorAll("button[data-item]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                if (!confirm("Supprimer cet élément de la galerie ?")) return;
                try {
                    await api(`/admin/gallery/${btn.dataset.item}`, { method: "DELETE" });
                    showMessage("Supprimé.", "success");
                    await loadGallery();
                } catch (e) {
                    showMessage(e.message, "error");
                }
            });
        });
    }

    document.getElementById("photo-add-btn").addEventListener("click", async () => {
        const title = document.getElementById("photo-title").value.trim();
        const fileInput = document.getElementById("photo-file");
        const file = fileInput.files[0];
        if (!title || !file) { showMessage("Légende et fichier requis.", "error"); return; }
        try {
            const created = await api("/admin/gallery", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, mediaType: "photo", filename: file.name, contentType: file.type }),
            });
            const putResp = await fetch(created.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
            if (!putResp.ok) throw new Error("Échec du téléversement.");
            showMessage("Photo ajoutée.", "success");
            document.getElementById("photo-title").value = "";
            fileInput.value = "";
            await loadGallery();
        } catch (e) {
            showMessage(e.message, "error");
        }
    });

    document.getElementById("video-add-btn").addEventListener("click", async () => {
        const title = document.getElementById("video-title").value.trim();
        const videoUrl = document.getElementById("video-url").value.trim();
        if (!title || !videoUrl) { showMessage("Titre et lien requis.", "error"); return; }
        try {
            await api("/admin/gallery", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, mediaType: "video", videoUrl }),
            });
            showMessage("Vidéo ajoutée.", "success");
            document.getElementById("video-title").value = "";
            document.getElementById("video-url").value = "";
            await loadGallery();
        } catch (e) {
            showMessage(e.message, "error");
        }
    });

    // ---- newsletter ----
    async function loadNewsletter() {
        const items = await api("/admin/newsletter");
        document.getElementById("newsletter-count").textContent =
            `${items.filter((s) => s.status === "confirmed").length} confirmé(s) sur ${items.length} inscription(s).`;
        const tbody = document.querySelector("#newsletter-table tbody");
        tbody.innerHTML = "";
        items.forEach((s) => {
            const tr = document.createElement("tr");
            const date = s.subscribedAt ? new Date(s.subscribedAt * 1000).toLocaleDateString("fr-FR") : "";
            tr.innerHTML = `
                <td>${s.email}</td>
                <td>${s.status === "confirmed" ? "Confirmé" : s.status === "unsubscribed" ? "Désinscrit" : "En attente"}</td>
                <td>${date}</td>
                <td><button class="admin-btn danger small" data-del-sub="${encodeURIComponent(s.email)}">Supprimer</button></td>
            `;
            tbody.appendChild(tr);
        });
        tbody.querySelectorAll("button[data-del-sub]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                if (!confirm("Supprimer cet abonné ?")) return;
                try {
                    await api(`/admin/newsletter/${btn.dataset.delSub}`, { method: "DELETE" });
                    showMessage("Abonné supprimé.", "success");
                    await loadNewsletter();
                } catch (e) { showMessage(e.message, "error"); }
            });
        });
    }

    document.getElementById("newsletter-send-btn").addEventListener("click", async () => {
        const subject = document.getElementById("newsletter-subject").value.trim();
        const message = document.getElementById("newsletter-message").value.trim();
        const statusEl = document.getElementById("newsletter-send-status");
        if (!subject || !message) {
            showMessage("Objet et message sont requis.", "error");
            return;
        }
        const countText = document.getElementById("newsletter-count").textContent || "";
        if (!confirm(`Envoyer cette newsletter aux abonnés confirmés ? (${countText})`)) return;
        const btn = document.getElementById("newsletter-send-btn");
        btn.disabled = true;
        statusEl.textContent = "Envoi en cours…";
        try {
            const result = await api("/admin/newsletter/send", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subject, message }),
            });
            statusEl.textContent = `Envoyé à ${result.sent}/${result.total} abonné(s) confirmé(s)${result.failed.length ? `, ${result.failed.length} échec(s)` : ""}.`;
            showMessage("Newsletter envoyée.", "success");
        } catch (e) {
            statusEl.textContent = "";
            showMessage(e.message, "error");
        } finally {
            btn.disabled = false;
        }
    });

    try {
        await Promise.all([loadMembers(), loadDocuments(), loadAgenda(), loadGallery(), loadNewsletter()]);
    } catch (e) {
        showMessage(e.message, "error");
    }
});
