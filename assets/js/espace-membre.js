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

    const topbarUser = document.getElementById("topbar-user");
    if (topbarUser) {
        document.getElementById("topbar-user-name").textContent = window.LCAuth.getDisplayName();
        topbarUser.style.display = "inline-flex";
    }

    const avatarImgEl = document.getElementById("portal-avatar-img");
    const avatarInitialsEl = document.getElementById("portal-avatar-initials");
    function setAvatar(photoUrl) {
        if (photoUrl) {
            avatarImgEl.src = photoUrl;
            avatarImgEl.style.display = "block";
            avatarInitialsEl.style.display = "none";
        } else {
            const name = (claims && claims.name) || (claims && claims.email) || "?";
            avatarInitialsEl.textContent = name.trim().charAt(0).toUpperCase();
            avatarImgEl.style.display = "none";
            avatarInitialsEl.style.display = "block";
        }
    }
    setAvatar(null);

    const groups = (claims && claims["cognito:groups"]) || [];
    const isAdmin = groups.includes("admin");
    // Mirrors each Lambda's own authorization check (secretaire OR admin,
    // tresorier OR admin) — an admin can reach every space via direct URL
    // regardless of this list, so the nav has to reflect that or the link
    // is just invisible to them even though it works.
    const spaceLinks = [
        { visible: isAdmin, href: "admin.html", label: "Espace Admin", icon: "fa-user-shield" },
        { visible: isAdmin || groups.includes("secretaire"), href: "secretariat.html", label: "Espace Secrétariat", icon: "fa-file-signature" },
        { visible: isAdmin || groups.includes("tresorier"), href: "tresorerie.html", label: "Espace Trésorerie", icon: "fa-coins" },
        // Gouvernance est volontairement à part : pas de bypass "admin" (rôle
        // technique distinct), décision confirmée avec l'association.
        { visible: groups.includes("gouvernance"), href: "gouvernance.html", label: "Espace Gouvernance", icon: "fa-landmark" },
        // Communication, à l'inverse de Gouvernance : bypass "admin" autorisé
        // (décision B13 confirmée avec l'association).
        { visible: isAdmin || groups.includes("communication"), href: "communication.html", label: "Espace Communication", icon: "fa-bullhorn" },
    ];
    const groupsEl = document.getElementById("portal-groups");
    const groupsCardEl = document.getElementById("portal-groups-card");
    const visibleSpaceLinks = spaceLinks.filter((link) => link.visible);
    if (visibleSpaceLinks.length) {
        groupsCardEl.style.display = "block";
        visibleSpaceLinks.forEach((link) => {
            const card = document.createElement("a");
            card.href = link.href;
            card.className = "promo-card impact-card";
            card.style.display = "block";
            card.innerHTML = `<h3><i class="fas ${link.icon}"></i> ${link.label}</h3>`;
            groupsEl.appendChild(card);
        });
    }

    const msgEl = document.getElementById("portal-msg");
    const statusBannerEl = document.getElementById("portal-status-banner");
    const statusTitleEl = document.getElementById("portal-status-title");
    const statusSubEl = document.getElementById("portal-status-sub");
    const statusCtaEl = document.getElementById("portal-status-cta");
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
        setAvatar(profile.photoUrl || null);
        const statut = profile.statutCotisation || "inconnu";
        const STATUS_CONTENT = {
            a_jour: {
                cls: "a-jour",
                icon: '<i class="fas fa-circle-check"></i> ',
                title: "Cotisation à jour",
                sub: "Merci pour votre engagement.",
                cta: false,
            },
            impaye: {
                cls: "impaye",
                icon: '<i class="fas fa-triangle-exclamation"></i> ',
                title: "Cotisation impayée",
                sub: "Réglez-la en un instant pour rester à jour.",
                cta: true,
            },
            inconnu: {
                cls: "inconnu",
                icon: '<i class="fas fa-triangle-exclamation"></i> ',
                title: "Statut non renseigné",
                sub: "Réglez votre cotisation pour la mettre à jour.",
                cta: true,
            },
        };
        const info = STATUS_CONTENT[statut] || STATUS_CONTENT.inconnu;
        statusTitleEl.innerHTML = info.icon + info.title;
        statusSubEl.textContent = info.sub;
        statusCtaEl.style.display = info.cta ? "inline-block" : "none";
        statusBannerEl.className = `portal-status-banner ${info.cls}`;
        statusBannerEl.style.display = "flex";
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
        const donsTotalEl = document.getElementById("portal-dons-total");
        const donsTotalAmountEl = document.getElementById("portal-dons-total-amount");
        try {
            const resp = await window.LCAuth.apiFetch("/me/cotisations");
            if (!resp.ok) throw new Error("Erreur");
            const items = await resp.json();
            if (!Array.isArray(items) || !items.length) return;
            emptyEl.style.display = "none";
            tableEl.style.display = "table";
            const tbody = tableEl.querySelector("tbody");
            let donsTotal = 0;
            items.forEach((c) => {
                const tr = document.createElement("tr");
                const type = c.type === "don" ? "Don" : "Cotisation";
                const montant = typeof c.montant === "number" ? c.montant : parseFloat(c.montant) || 0;
                if (c.type === "don") donsTotal += montant;
                // Certificat : uniquement pour les cotisations, jamais les dons
                // (pas un reçu fiscal, voir B14).
                const certCell = c.type !== "don" && c.cotisationId
                    ? `<td><button type="button" class="btn" data-cert-id="${c.cotisationId}" style="padding:0.25rem 0.6rem; font-size:0.8rem;"><i class="fas fa-file-pdf"></i> <span class="lang-fr">Certificat</span><span class="lang-en">Certificate</span></button></td>`
                    : "<td></td>";
                tr.innerHTML = `<td>${c.date || ""}</td><td>${type}</td><td>${montant} €</td><td>${c.methode || ""}</td>${certCell}`;
                tbody.appendChild(tr);
            });
            tbody.querySelectorAll("button[data-cert-id]").forEach((btn) => {
                btn.addEventListener("click", async () => {
                    btn.disabled = true;
                    try {
                        const certResp = await window.LCAuth.apiFetch(`/me/certificate/${btn.dataset.certId}`);
                        if (!certResp.ok) throw new Error("Échec du téléchargement du certificat.");
                        const blob = await certResp.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `certificat-cotisation-${btn.dataset.certId}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        URL.revokeObjectURL(url);
                    } catch (e) {
                        alert("Une erreur est survenue lors du téléchargement du certificat.");
                    } finally {
                        btn.disabled = false;
                    }
                });
            });
            if (donsTotal > 0) {
                donsTotalAmountEl.textContent = `${donsTotal} €`;
                donsTotalEl.style.display = "block";
            }
        } catch (e) {
            // reste sur l'état "aucun paiement" par défaut
        }
    })();

    // ---- Paiement (cotisation / don) — après résolution de l'état de connexion ----
    if (window.LCPayment) {
        window.LCPayment.initMemberPayment();
    }

    // ---- Photo de profil ----
    document.getElementById("portal-photo-input").addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const labelEl = document.getElementById("portal-avatar-upload-label");
        const allowed = { "image/jpeg": true, "image/png": true, "image/webp": true };
        if (!allowed[file.type]) {
            showMessage("Format d'image non supporté (JPEG, PNG ou WebP uniquement).", "error");
            e.target.value = "";
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showMessage("L'image dépasse la taille maximale de 5 Mo.", "error");
            e.target.value = "";
            return;
        }
        labelEl.classList.add("uploading");
        try {
            const resp = await window.LCAuth.apiFetch("/me/photo-upload-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contentType: file.type }),
            });
            if (!resp.ok) throw new Error("Impossible d'obtenir l'URL d'envoi.");
            const { uploadUrl, photoUrl } = await resp.json();

            const putResp = await fetch(uploadUrl, {
                method: "PUT",
                headers: { "Content-Type": file.type },
                body: file,
            });
            if (!putResp.ok) throw new Error("Échec de l'envoi de la photo.");

            const saveResp = await window.LCAuth.apiFetch("/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ photoUrl }),
            });
            if (!saveResp.ok) throw new Error("Échec de l'enregistrement de la photo.");

            setAvatar(photoUrl);
            showMessage("Photo de profil mise à jour.", "success");
        } catch (err) {
            showMessage("Une erreur est survenue lors de l'envoi de la photo.", "error");
        } finally {
            labelEl.classList.remove("uploading");
            e.target.value = "";
        }
    });

    // ---- Export RGPD (mes données) ----
    document.getElementById("portal-export-btn").addEventListener("click", async () => {
        const btn = document.getElementById("portal-export-btn");
        btn.disabled = true;
        try {
            const resp = await window.LCAuth.apiFetch("/me/export");
            if (!resp.ok) throw new Error("Échec de l'export.");
            const data = await resp.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            const dateStr = new Date().toISOString().slice(0, 10);
            a.href = url;
            a.download = `mes-donnees-liensculturels-${dateStr}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            showMessage("Export téléchargé.", "success");
        } catch (err) {
            showMessage("Une erreur est survenue lors de l'export de vos données.", "error");
        } finally {
            btn.disabled = false;
        }
    });
});
