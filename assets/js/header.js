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
});
