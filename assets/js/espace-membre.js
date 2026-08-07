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
    const groupLinks = {
        admin: { href: "admin.html", label: "Espace Admin" },
        secretaire: { href: "secretariat.html", label: "Espace Secrétariat" },
        tresorier: { href: "tresorerie.html", label: "Espace Trésorerie" },
    };
    const groupsEl = document.getElementById("portal-groups");
    groups.forEach((g) => {
        const link = groupLinks[g];
        if (link) {
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
        badgeEl.textContent = statut === "a_jour" ? "À jour" : statut === "impaye" ? "Impayée" : "Non renseigné";
        badgeEl.className = `portal-badge ${statut === "a_jour" ? "a-jour" : statut === "impaye" ? "impaye" : "inconnu"}`;
    } catch (e) {
        showMessage("Erreur lors du chargement de votre profil.", "error");
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
