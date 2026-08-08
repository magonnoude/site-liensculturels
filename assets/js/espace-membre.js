document.addEventListener("DOMContentLoaded", async () => {
    const loadingEl = document.getElementById("portal-loading");
    const loginEl = document.getElementById("portal-login");
    const dashboardEl = document.getElementById("portal-dashboard");

    try {
        await window.LCAuth.handleRedirect();
    } catch (e) {
        console.error("Erreur de connexion :", e);
    }

    loadingEl.style.display = "none";

    if (!window.LCAuth.isLoggedIn()) {
        loginEl.style.display = "block";
        document.getElementById("portal-login-btn").addEventListener("click", () => {
            window.LCAuth.login();
        });
        return;
    }

    dashboardEl.style.display = "block";
    document.getElementById("portal-logout-btn").addEventListener("click", (e) => {
        e.preventDefault();
        window.LCAuth.logout();
    });

    const claims = window.LCAuth.getClaims();
    document.getElementById("portal-name").textContent = (claims && claims.name) || "";

    const groups = (claims && claims["cognito:groups"]) || [];
    const isAdmin = groups.includes("admin");
    // Mirrors each Lambda's own authorization check (secretaire OR admin,
    // tresorier OR admin) — an admin can reach every space via direct URL
    // regardless of this list, so the nav has to reflect that or the link
    // is just invisible to them even though it works.
    const spaceLinks = [
        { visible: isAdmin, href: "admin.html", label: "Espace Admin" },
        { visible: isAdmin || groups.includes("secretaire"), href: "secretariat.html", label: "Espace Secrétariat" },
        { visible: isAdmin || groups.includes("tresorier"), href: "tresorerie.html", label: "Espace Trésorerie" },
    ];
    const groupsEl = document.getElementById("portal-groups");
    spaceLinks.forEach((link) => {
        if (link.visible) {
            const a = document.createElement("a");
            a.href = link.href;
            a.className = "btn";
            a.textContent = link.label;
            groupsEl.appendChild(a);
        }
    });

    const msgEl = document.getElementById("portal-msg");
    const badgeEl = document.getElementById("portal-cotisation-badge");
    const emailEl = document.getElementById("portal-email");
    const telEl = document.getElementById("portal-telephone");
    const addrEl = document.getElementById("portal-adresse");

    function showMessage(text, kind) {
        msgEl.textContent = text;
        msgEl.className = `portal-msg ${kind}`;
        msgEl.style.display = "block";
    }

    try {
        const resp = await window.LCAuth.apiFetch("/me");
        if (!resp.ok) throw new Error("Impossible de charger votre profil.");
        const profile = await resp.json();
        emailEl.value = profile.email || "";
        telEl.value = profile.telephone || "";
        addrEl.value = profile.adresse || "";
        const statut = profile.statutCotisation || "inconnu";
        const icon = statut === "a_jour" ? '<i class="fas fa-circle-check"></i> ' : '<i class="fas fa-triangle-exclamation"></i> ';
        badgeEl.innerHTML = icon + (statut === "a_jour" ? "À jour de cotisation" : statut === "impaye" ? "Cotisation impayée" : "Statut non renseigné");
        badgeEl.className = `portal-badge ${statut === "a_jour" ? "a-jour" : statut === "impaye" ? "impaye" : "inconnu"}`;
    } catch (e) {
        showMessage("Erreur lors du chargement de votre profil.", "error");
    }

    // ---- Prochains événements (réutilise le GET /agenda public, sans auth) ----
    (async () => {
        const listEl = document.getElementById("portal-agenda-list");
        const emptyEl = document.getElementById("portal-agenda-empty");
        try {
            const resp = await fetch("https://8igk1o6vw4.execute-api.eu-west-3.amazonaws.com/agenda");
            const items = await resp.json();
            const today = new Date().toISOString().slice(0, 10);
            const upcoming = (Array.isArray(items) ? items : [])
                .filter((e) => (e.start || "") >= today)
                .sort((a, b) => (a.start || "").localeCompare(b.start || ""))
                .slice(0, 5);
            if (!upcoming.length) {
                emptyEl.style.display = "block";
                return;
            }
            upcoming.forEach((e) => {
                const li = document.createElement("li");
                const date = (e.start || "").slice(0, 10);
                li.innerHTML = `<span class="agenda-date">${date}</span>${e.title || ""}${e.location ? " — " + e.location : ""}`;
                listEl.appendChild(li);
            });
        } catch (e) {
            emptyEl.style.display = "block";
        }
    })();

    // ---- Historique des paiements ----
    (async () => {
        const tableEl = document.getElementById("portal-history-table");
        const emptyEl = document.getElementById("portal-history-empty");
        try {
            const resp = await window.LCAuth.apiFetch("/me/cotisations");
            if (!resp.ok) throw new Error("Erreur");
            const items = await resp.json();
            if (!Array.isArray(items) || !items.length) return;
            emptyEl.style.display = "none";
            tableEl.style.display = "table";
            const tbody = tableEl.querySelector("tbody");
            items.forEach((c) => {
                const tr = document.createElement("tr");
                const type = c.type === "don" ? "Don" : "Cotisation";
                const montant = typeof c.montant === "number" ? c.montant : parseFloat(c.montant) || 0;
                tr.innerHTML = `<td>${c.date || ""}</td><td>${type}</td><td>${montant} €</td><td>${c.methode || ""}</td>`;
                tbody.appendChild(tr);
            });
        } catch (e) {
            // reste sur l'état "aucun paiement" par défaut
        }
    })();

    // ---- Paiement (cotisation / don) — après résolution de l'état de connexion ----
    if (window.LCPayment) {
        window.LCPayment.initMemberPayment();
    }

    document.getElementById("portal-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        msgEl.style.display = "none";
        try {
            const resp = await window.LCAuth.apiFetch("/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ telephone: telEl.value, adresse: addrEl.value }),
            });
            if (!resp.ok) throw new Error("Échec de la mise à jour.");
            showMessage("Profil mis à jour.", "success");
        } catch (e) {
            showMessage("Une erreur est survenue. Veuillez réessayer.", "error");
        }
    });
});
