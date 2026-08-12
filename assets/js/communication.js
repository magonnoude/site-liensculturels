document.addEventListener("DOMContentLoaded", async () => {
    try {
        await window.LCAuth.handleRedirect();
    } catch (e) {
        console.error(e);
    }

    const loadingEl = document.getElementById("comm-loading");
    const deniedEl = document.getElementById("comm-denied");
    const contentEl = document.getElementById("comm-content");
    loadingEl.style.display = "none";

    // Contrairement à Gouvernance (volontairement sans bypass admin) : Communication
    // AUTORISE le bypass admin — décision confirmée avec l'association (B13).
    const authorized = window.LCAuth.isLoggedIn() &&
        (window.LCAuth.hasGroup("communication") || window.LCAuth.hasGroup("admin"));
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

    const msgEl = document.getElementById("comm-msg");
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

    async function loadNewsletter() {
        const items = await api("/communication/newsletter");
        const confirmedCount = items.filter((s) => s.status === "confirmed").length;
        document.getElementById("newsletter-count").textContent =
            `${confirmedCount} confirmé(s) sur ${items.length} inscription(s).`;
        document.getElementById("comm-sum-newsletter").textContent = confirmedCount;
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
                    await api(`/communication/newsletter/${btn.dataset.delSub}`, { method: "DELETE" });
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
            const result = await api("/communication/newsletter/send", {
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
        await loadNewsletter();
    } catch (e) {
        showMessage(e.message, "error");
    }
});
