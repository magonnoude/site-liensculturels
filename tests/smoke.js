// Smoke tests CI (B15) — exécutés après chaque déploiement (voir .github/workflows/deploy.yml).
//
// Portée volontairement limitée à des vérifications qui ne créent AUCUNE donnée réelle :
// pas de soumission d'adhésion (créerait un vrai compte + 2 e-mails à chaque push), pas de
// paiement (Stripe est en mode LIVE — jamais de vrai argent dépensé automatiquement). Un
// compte de test permanent, dédié, groupe "membre" uniquement, sert uniquement à se
// connecter et consulter des pages — jamais à écrire de donnée.
//
// Échoue (process.exit(1)) si une seule assertion échoue.

const { chromium } = require("playwright");

const SITE_URL = process.env.SITE_URL || "https://www.liensculturels.org";
const EMAIL = process.env.SMOKE_TEST_EMAIL;
const PASSWORD = process.env.SMOKE_TEST_PASSWORD;

if (!EMAIL || !PASSWORD) {
    console.error("SMOKE_TEST_EMAIL / SMOKE_TEST_PASSWORD manquants dans l'environnement.");
    process.exit(1);
}

const failures = [];

function check(label, condition) {
    if (condition) {
        console.log(`OK   — ${label}`);
    } else {
        console.log(`FAIL — ${label}`);
        failures.push(label);
    }
}

async function loginViaHostedUI(page) {
    await page.goto(`${SITE_URL}/espace-membre.html`, { waitUntil: "networkidle" });
    await page.click("#portal-login-btn");
    // La page de connexion Cognito Hosted UI a deux formulaires dupliqués (desktop/mobile)
    // dans le DOM — toujours cibler le dernier, jamais le premier.
    const userField = page.locator('input[name="username"]').last();
    const passField = page.locator('input[name="password"]').last();
    await userField.waitFor({ state: "visible", timeout: 20000 });
    await userField.fill(EMAIL);
    await passField.fill(PASSWORD);
    await page.locator('input[type="submit"], button[type="submit"]').last().click();
    await page.waitForSelector("#portal-dashboard", { state: "visible", timeout: 20000 });
}

async function checkGatedPage(page, path, contentSelector, deniedSelector) {
    await page.goto(`${SITE_URL}/${path}`, { waitUntil: "networkidle" });
    await page.waitForSelector(contentSelector, { state: "visible", timeout: 20000 }).catch(() => {});
    const contentVisible = await page.locator(contentSelector).isVisible().catch(() => false);
    const deniedVisible = await page.locator(deniedSelector).isVisible().catch(() => false);
    return { contentVisible, deniedVisible };
}

(async () => {
    const browser = await chromium.launch();

    try {
        // ---- 1. Déconnecté : une page gated doit refuser l'accès, pas de fuite de contenu ----
        const anonPage = await browser.newPage();
        const anonResult = await checkGatedPage(anonPage, "guide-utilisation.html", "#guide-content", "#guide-denied");
        check("Déconnecté — guide-utilisation.html affiche l'écran refusé", anonResult.deniedVisible);
        check("Déconnecté — guide-utilisation.html ne montre pas le contenu", !anonResult.contentVisible);
        await anonPage.close();

        // ---- 2. Connexion réelle avec le compte de smoke-test ----
        const context = await browser.newContext();
        const page = await context.newPage();
        const consoleErrors = [];
        page.on("console", (msg) => {
            if (msg.type() === "error") consoleErrors.push(msg.text());
        });

        let loginOk = true;
        try {
            await loginViaHostedUI(page);
        } catch (e) {
            loginOk = false;
            console.log(`FAIL — connexion via Hosted UI (${e.message})`);
            failures.push("connexion via Hosted UI");
        }
        check("Connexion réussie — dashboard espace-membre.html visible", loginOk);

        if (loginOk) {
            check("Aucune erreur console sur espace-membre.html", consoleErrors.length === 0);
            if (consoleErrors.length) {
                consoleErrors.forEach((e) => console.log(`       ↳ ${e}`));
            }

            // ---- 3. Pages membres gated : contenu visible une fois connecté ----
            const gatedPages = [
                { path: "guide-utilisation.html", content: "#guide-content", denied: "#guide-denied" },
                { path: "vie-associative.html", content: "#va-content", denied: "#va-denied" },
                { path: "trombinoscope.html", content: "#trombi-content", denied: "#trombi-denied" },
            ];
            for (const gp of gatedPages) {
                const result = await checkGatedPage(page, gp.path, gp.content, gp.denied);
                check(`Connecté — ${gp.path} affiche le contenu`, result.contentVisible);
                check(`Connecté — ${gp.path} ne montre pas l'écran refusé`, !result.deniedVisible);
            }
        }

        await context.close();
    } finally {
        await browser.close();
    }

    console.log("");
    if (failures.length) {
        console.log(`${failures.length} échec(s) : ${failures.join(", ")}`);
        process.exit(1);
    }
    console.log("Tous les smoke tests passent.");
})();
