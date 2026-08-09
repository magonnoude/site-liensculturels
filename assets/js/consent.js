/*
 * Bannière de consentement (RGPD) + chargement conditionnel de Google
 * Analytics 4. Le script GA4 n'est jamais chargé avant un clic explicite sur
 * "Accepter" (ou un consentement déjà enregistré lors d'une visite
 * précédente) — Google Analytics ne bénéficie pas de l'exemption CNIL de
 * consentement, contrairement à un outil d'analyse anonymisé auto-hébergé.
 */
window.LCConsent = (function () {
    const STORAGE_KEY = "lc_analytics_consent";
    const GA_MEASUREMENT_ID = "G-EMTKPDTSJY";

    function loadGA4() {
        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        function gtag() { window.dataLayer.push(arguments); }
        window.gtag = gtag;
        gtag("js", new Date());
        gtag("config", GA_MEASUREMENT_ID);
    }

    function buildBanner() {
        const banner = document.createElement("div");
        banner.className = "cookie-banner";
        banner.innerHTML = `
            <p>
                <span class="lang-fr">Ce site utilise Google Analytics pour mesurer sa fréquentation. Ces données ne sont utilisées qu'après votre accord. <a href="confidentialite.html">En savoir plus</a>.</span>
                <span class="lang-en">This site uses Google Analytics to measure traffic. This data is only used with your consent. <a href="confidentialite.html">Learn more</a>.</span>
            </p>
            <div class="cookie-banner-actions">
                <button type="button" class="btn" id="cookie-accept"><span class="lang-fr">Accepter</span><span class="lang-en">Accept</span></button>
                <button type="button" class="btn btn-outline" id="cookie-decline"><span class="lang-fr">Refuser</span><span class="lang-en">Decline</span></button>
            </div>
        `;
        document.body.appendChild(banner);

        banner.querySelector("#cookie-accept").addEventListener("click", () => {
            localStorage.setItem(STORAGE_KEY, "granted");
            banner.remove();
            loadGA4();
        });
        banner.querySelector("#cookie-decline").addEventListener("click", () => {
            localStorage.setItem(STORAGE_KEY, "denied");
            banner.remove();
        });
    }

    function init() {
        const consent = localStorage.getItem(STORAGE_KEY);
        if (consent === "granted") {
            loadGA4();
        } else if (consent !== "denied") {
            buildBanner();
        }
    }

    function reset() {
        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    return { reset };
})();
