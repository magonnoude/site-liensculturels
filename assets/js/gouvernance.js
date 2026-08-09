document.addEventListener("DOMContentLoaded", async () => {
    try {
        await window.LCAuth.handleRedirect();
    } catch (e) {
        console.error(e);
    }

    const loadingEl = document.getElementById("gouv-loading");
    const deniedEl = document.getElementById("gouv-denied");
    const contentEl = document.getElementById("gouv-content");
    loadingEl.style.display = "none";

    // Volontairement pas de bypass "admin" ici : Gouvernance est un rôle distinct
    // d'Admin (technique), décision confirmée avec l'association.
    const authorized = window.LCAuth.isLoggedIn() && window.LCAuth.hasGroup("gouvernance");
    if (!authorized) {
        deniedEl.style.display = "block";
        return;
    }
    contentEl.style.display = "block";

    function euros(n) {
        const value = typeof n === "number" ? n : parseFloat(n) || 0;
        return `${value} €`;
    }

    try {
        const resp = await window.LCAuth.apiFetch("/gouvernance/summary");
        if (!resp.ok) throw new Error("Erreur de chargement.");
        const data = await resp.json();

        document.getElementById("gouv-nb-adherents").textContent = data.nombreAdherents ?? "—";
        const statuts = data.repartitionCotisationStatut || {};
        document.getElementById("gouv-statut-a-jour").textContent = statuts.a_jour ?? 0;
        document.getElementById("gouv-statut-impaye").textContent = statuts.impaye ?? 0;
        document.getElementById("gouv-statut-inconnu").textContent = statuts.inconnu ?? 0;

        document.getElementById("gouv-cotisations").textContent = euros(data.totalCotisations);
        document.getElementById("gouv-dons").textContent = euros(data.totalDons);
        document.getElementById("gouv-depenses").textContent = euros(data.totalDepenses);
        document.getElementById("gouv-solde").textContent = euros(data.solde);

        const parType = data.depensesParType || {};
        document.getElementById("gouv-depenses-fixe").textContent = euros(parType.fixe);
        document.getElementById("gouv-depenses-exceptionnelle").textContent = euros(parType.exceptionnelle);

        const parCategorie = data.depensesParCategorie || {};
        const tbody = document.querySelector("#gouv-categories-table tbody");
        const entries = Object.entries(parCategorie);
        if (!entries.length) {
            document.getElementById("gouv-categories-empty").style.display = "block";
            document.getElementById("gouv-categories-table").style.display = "none";
        } else {
            entries.sort((a, b) => b[1] - a[1]);
            entries.forEach(([categorie, montant]) => {
                const tr = document.createElement("tr");
                tr.innerHTML = `<td>${categorie}</td><td>${euros(montant)}</td>`;
                tbody.appendChild(tr);
            });
        }
    } catch (e) {
        contentEl.innerHTML = `<p style="text-align:center; color:#c0392b; padding:3rem 0;">Une erreur est survenue lors du chargement du tableau de bord.</p>`;
    }
});
