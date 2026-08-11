/*
 * Comportement du nouvel en-tête à deux niveaux : menu mobile + bascule de
 * langue FR/EN. Chargé sur toutes les pages, indépendamment de main.js.
 *
 * La bascule de langue suit le même principe que rmsimpact.org /
 * www.grouperms.com : deux blocs de contenu (.lang-fr / .lang-en) présents
 * dans le HTML, un seul affiché à la fois via display:none, le choix
 * persisté dans localStorage. Pas de routage par URL, pas de duplication de
 * page — ce site n'a pas de build, dupliquer 25 fichiers par langue serait
 * une vraie charge de maintenance pour une asso bénévole.
 */
document.addEventListener("DOMContentLoaded", () => {
    // ---- menu mobile ----
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.querySelector("header nav");
    if (toggle && nav) {
        toggle.addEventListener("click", () => {
            const open = nav.classList.toggle("nav-open");
            toggle.setAttribute("aria-expanded", open ? "true" : "false");
        });
    }

    // ---- langue ----
    const STORAGE_KEY = "lc_lang";
    const buttons = document.querySelectorAll(".lang-toggle button[data-lang]");

    function applyLanguage(lang) {
        document.querySelectorAll(".lang-fr").forEach((el) => {
            el.style.display = lang === "fr" ? "" : "none";
        });
        document.querySelectorAll(".lang-en").forEach((el) => {
            el.style.display = lang === "en" ? "" : "none";
        });
        buttons.forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.lang === lang);
        });
        document.documentElement.lang = lang;
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    const initial = saved === "en" ? "en" : "fr";
    applyLanguage(initial);

    buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const lang = btn.dataset.lang;
            localStorage.setItem(STORAGE_KEY, lang);
            applyLanguage(lang);
        });
    });

    // ---- PWA (B8) : enregistrement du service worker + bouton d'installation ----
    // Injecté en JS plutôt que dans le HTML de chaque page : header.js est déjà chargé
    // partout, ça évite de toucher les 30 pages du dépôt individuellement.
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
        || window.navigator.standalone === true; // iOS Safari
    if (!isStandalone) {
        let deferredPrompt = null;
        window.addEventListener("beforeinstallprompt", (e) => {
            e.preventDefault();
            deferredPrompt = e;
            const utility = document.querySelector(".header-utility .container");
            if (!utility || document.getElementById("pwa-install-btn")) return;

            const divider = document.createElement("span");
            divider.className = "utility-divider";
            divider.setAttribute("aria-hidden", "true");

            const btn = document.createElement("a");
            btn.href = "#";
            btn.id = "pwa-install-btn";
            btn.className = "utility-link";
            btn.innerHTML = '<i class="fas fa-download"></i> <span class="lang-fr">Installer l\'app</span><span class="lang-en">Install app</span>';
            btn.addEventListener("click", async (evt) => {
                evt.preventDefault();
                if (!deferredPrompt) return;
                deferredPrompt.prompt();
                await deferredPrompt.userChoice;
                deferredPrompt = null;
                btn.remove();
                divider.remove();
            });

            // Juste avant la bascule de langue, comme les autres boutons de cette barre.
            const langToggle = utility.querySelector(".lang-toggle");
            if (langToggle) {
                utility.insertBefore(divider, langToggle);
                utility.insertBefore(btn, langToggle);
            } else {
                utility.appendChild(divider);
                utility.appendChild(btn);
            }
        });

        window.addEventListener("appinstalled", () => {
            const btn = document.getElementById("pwa-install-btn");
            if (btn) btn.remove();
        });
    }
});
