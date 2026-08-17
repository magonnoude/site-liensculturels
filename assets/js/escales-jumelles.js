document.addEventListener("DOMContentLoaded", async () => {
    const API_BASE = "https://8igk1o6vw4.execute-api.eu-west-3.amazonaws.com";

    const VILLES = ["nogent-artaud", "save", "caraibes"]; // ordre fixe
    const VILLE_PHOTO_CLASS = {
        "nogent-artaud": "photo-nogent",
        "save": "photo-save",
        "caraibes": "photo-caraibes",
    };
    const RUBRIQUES = [
        { id: "lieux-paysages", fr: "Lieux & Paysages", en: "Places & Landscapes" },
        { id: "savoir-faire-saveurs", fr: "Savoir-faire & Saveurs", en: "Craftsmanship & Flavours" },
        { id: "vivre-celebrer", fr: "Vivre & Célébrer", en: "Living & Celebrating" },
        { id: "visages-jumelage", fr: "Visages du Jumelage", en: "Faces of the Twinning" },
    ];

    const content = document.getElementById("escale-content");
    const header = document.getElementById("escale-header");
    const territoryButtons = document.querySelectorAll(".escale-territory-nav button");

    let fiches = [];
    try {
        const resp = await fetch(`${API_BASE}/escales`);
        if (resp.ok) fiches = await resp.json();
    } catch (e) {
        console.error("Impossible de charger Escales Jumelles :", e);
    }

    function syncLangDisplay() {
        const lang = localStorage.getItem("lc_lang") === "en" ? "en" : "fr";
        content.querySelectorAll(".lang-fr").forEach((el) => { el.style.display = lang === "fr" ? "" : "none"; });
        content.querySelectorAll(".lang-en").forEach((el) => { el.style.display = lang === "en" ? "" : "none"; });
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str || "";
        return div.innerHTML;
    }

    function render(ville) {
        territoryButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.ville === ville));
        header.className = `page-header with-photo ${VILLE_PHOTO_CLASS[ville]}`;
        header.querySelectorAll(".page-header-credit").forEach((el) => {
            el.style.display = el.dataset.ville === ville ? "" : "none";
        });

        const villeFiches = fiches.filter((f) => f.territoire === ville);

        content.innerHTML = RUBRIQUES.map((rubrique) => {
            const items = villeFiches.filter((f) => f.rubrique === rubrique.id);
            const cards = items.length
                ? `<div class="escale-fiche-grid">${items.map((f) => `
                    <div class="escale-fiche-card">
                        <a href="${f.imageUrl}" data-lightbox="escale-${ville}-${rubrique.id}" data-title="${escapeHtml(f.titre)}">
                            <img src="${f.imageUrl}" alt="${escapeHtml(f.titre)}" loading="lazy">
                        </a>
                        <div class="escale-fiche-body">
                            <h4>${escapeHtml(f.titre)}</h4>
                            <p>${escapeHtml(f.texte)}</p>
                        </div>
                    </div>`).join("")}</div>`
                : `<p class="escale-empty"><span class="lang-fr">Contenu à venir.</span><span class="lang-en">Content coming soon.</span></p>`;
            return `
                <section class="escale-rubrique-block">
                    <h3 class="escale-rubrique-title"><span class="lang-fr">${rubrique.fr}</span><span class="lang-en">${rubrique.en}</span></h3>
                    ${cards}
                </section>`;
        }).join("");

        syncLangDisplay();
    }

    territoryButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const params = new URLSearchParams(location.search);
            params.set("ville", btn.dataset.ville);
            history.replaceState(null, "", `${location.pathname}?${params.toString()}`);
            render(btn.dataset.ville);
        });
    });

    const requested = new URLSearchParams(location.search).get("ville");
    const initialVille = VILLES.includes(requested) ? requested : VILLES[0];
    render(initialVille);
});
