/*
 * Paiement en ligne (cotisation ou don), via redirection hébergée chez le
 * prestataire — Stripe Checkout Session et FedaPay renvoient tous les deux
 * une checkoutUrl, le navigateur y est simplement redirigé. Plus de carte
 * bancaire embarquée sur ce site : aucune donnée de paiement ne transite par
 * nos pages.
 *
 * Tant que l'association n'a pas ses propres identifiants Stripe/FedaPay
 * (comptes marchands à son nom, pas ceux de RMS), GET /payment/config renvoie
 * stripeEnabled=false et fedapayEnabled=false, et toute section de paiement
 * reste masquée : le site continue de fonctionner comme avant (RIB envoyé
 * par le trésorier). Le jour où les vraies clés sont configurées sur la
 * Lambda liensCulturels-payment, ces UI s'activent automatiquement.
 */
window.LCPayment = (function () {
    const API_BASE_URL = "https://8igk1o6vw4.execute-api.eu-west-3.amazonaws.com";
    let configPromise = null;

    function getConfig() {
        if (!configPromise) {
            configPromise = fetch(`${API_BASE_URL}/payment/config`)
                .then((r) => r.json())
                .catch(() => null);
        }
        return configPromise;
    }

    async function createIntent(payload) {
        const resp = await fetch(`${API_BASE_URL}/payment/create-intent`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "Erreur lors de la création du paiement.");
        return data;
    }

    // Construit les boutons de paiement (Stripe / FedaPay) dans `container`.
    // `getPayload()` est appelée au clic, pas à l'affichage, pour toujours
    // lire les valeurs les plus fraîches du formulaire (type, montant...).
    function renderButtons(container, config, getPayload, onError) {
        container.innerHTML = "";
        if (config.stripeEnabled) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "btn";
            btn.innerHTML = '<span class="lang-fr">Payer par carte (Stripe)</span><span class="lang-en">Pay by card (Stripe)</span>';
            btn.addEventListener("click", async () => {
                try {
                    const payload = getPayload();
                    if (!payload) return;
                    btn.disabled = true;
                    const result = await createIntent({ ...payload, provider: "stripe" });
                    if (result.checkoutUrl) window.location.href = result.checkoutUrl;
                } catch (e) {
                    btn.disabled = false;
                    onError(e.message);
                }
            });
            container.appendChild(btn);
        }
        if (config.fedapayEnabled) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "btn";
            btn.innerHTML = '<span class="lang-fr">Payer via FedaPay (Afrique de l\'Ouest)</span><span class="lang-en">Pay via FedaPay (West Africa)</span>';
            btn.addEventListener("click", async () => {
                try {
                    const payload = getPayload();
                    if (!payload) return;
                    btn.disabled = true;
                    const result = await createIntent({ ...payload, provider: "fedapay" });
                    if (result.checkoutUrl) window.location.href = result.checkoutUrl;
                } catch (e) {
                    btn.disabled = false;
                    onError(e.message);
                }
            });
            container.appendChild(btn);
        }
    }

    // Appelée explicitement par espace-membre.js une fois que
    // window.LCAuth.handleRedirect() a fini de résoudre l'état de connexion
    // (plutôt qu'un second écouteur DOMContentLoaded indépendant, qui pourrait
    // s'exécuter avant la fin de l'échange du code d'autorisation OAuth juste
    // après une redirection de connexion et laisser la section masquée).
    async function initMemberPayment() {
        const section = document.getElementById("member-payment-section");
        if (!section || !window.LCAuth || !window.LCAuth.isLoggedIn()) return;

        const claims = window.LCAuth.getClaims();
        const email = (claims && claims.email) || "";
        const nom = (claims && claims.name) || email;

        const config = await getConfig();
        const fallbackEl = document.getElementById("member-payment-fallback");
        const formsEl = document.getElementById("member-payment-forms");
        const feedbackEl = document.getElementById("member-payment-feedback");
        function showFeedback(text, kind) {
            feedbackEl.textContent = text;
            feedbackEl.className = `form-feedback ${kind}`;
            feedbackEl.style.display = "block";
        }

        // La carte "Cotisation & dons" reste toujours visible (comme Agenda et
        // Historique) — seul son contenu bascule entre le message d'attente et
        // les vrais formulaires, plutôt que de faire disparaître toute la
        // section tant que Stripe/FedaPay ne sont pas activés (ce qui donnait
        // l'impression que la fonctionnalité n'existait pas du tout).
        if (config && (config.stripeEnabled || config.fedapayEnabled)) {
            fallbackEl.style.display = "none";
            formsEl.style.display = "block";

            const cotisationType = document.getElementById("member-cotisation-type");
            renderButtons(
                document.getElementById("member-cotisation-buttons"),
                config,
                () => ({ type: cotisationType.value, email, nom, returnPage: "espace-membre.html" }),
                (msg) => showFeedback(msg, "error")
            );

            const donInput = document.getElementById("member-don-montant");
            renderButtons(
                document.getElementById("member-don-buttons"),
                config,
                () => {
                    const montant = parseFloat(donInput.value);
                    if (!montant || montant < (config.donMin || 1) || montant > (config.donMax || 5000)) {
                        showFeedback(`Merci d'indiquer un montant de don entre ${config.donMin || 1} € et ${config.donMax || 5000} €.`, "error");
                        return null;
                    }
                    return { type: "don", montant, email, nom, returnPage: "espace-membre.html" };
                },
                (msg) => showFeedback(msg, "error")
            );
        } else {
            fallbackEl.style.display = "block";
        }

        const params = new URLSearchParams(window.location.search);
        if (params.get("payment") === "success") {
            showFeedback("Paiement effectué, merci !", "success");
        }
    }

    return { getConfig, createIntent, renderButtons, initMemberPayment };
})();

document.addEventListener("DOMContentLoaded", async () => {
    // ---- adhesion.html : régler la cotisation lors de l'inscription ----
    // Le sélecteur de type de cotisation existe en double (un par langue,
    // convention du site : jamais masquer des <option> individuelles).
    // #membershipType (FR) reste la seule source de vérité pour la
    // soumission du formulaire et le paiement ; on y recopie la valeur dès
    // que la version EN change.
    const membershipTypeFr = document.getElementById("membershipType");
    const membershipTypeEn = document.getElementById("membershipTypeEn");
    if (membershipTypeFr && membershipTypeEn) {
        membershipTypeEn.addEventListener("change", () => {
            membershipTypeFr.value = membershipTypeEn.value;
        });
        membershipTypeFr.addEventListener("change", () => {
            membershipTypeEn.value = membershipTypeFr.value;
        });
    }

    const paymentSection = document.getElementById("payment-section");
    if (paymentSection) {
        const paymentOptions = document.getElementById("payment-options");
        const paymentFallback = document.getElementById("payment-fallback");
        const feedbackEl = document.getElementById("payment-feedback");
        function showFeedback(text, kind) {
            feedbackEl.textContent = text;
            feedbackEl.className = `form-feedback ${kind}`;
            feedbackEl.style.display = "block";
        }

        const config = await window.LCPayment.getConfig();
        if (config && (config.stripeEnabled || config.fedapayEnabled)) {
            window.LCPayment.renderButtons(
                paymentOptions,
                config,
                () => {
                    const email = document.getElementById("email").value;
                    const nom = document.getElementById("fullName") ? document.getElementById("fullName").value
                        : `${document.getElementById("prenom").value} ${document.getElementById("nom").value}`.trim();
                    const type = membershipTypeFr.value;
                    if (!email || !nom) {
                        showFeedback("Merci de renseigner votre nom et e-mail dans le formulaire ci-dessus d'abord.", "error");
                        return null;
                    }
                    return { type, email, nom, returnPage: "adhesion.html" };
                },
                (msg) => showFeedback(msg, "error")
            );
            paymentSection.style.display = "block";
        } else if (paymentFallback) {
            paymentFallback.style.display = "block";
        }

        const params = new URLSearchParams(window.location.search);
        if (params.get("payment") === "success") {
            showFeedback("Paiement effectué, merci !", "success");
        }
    }

    // ---- bourse-scolaire.html : don libre pour le programme de bourses ----
    // Même route/type "don" générique que le don depuis espace-membre.html —
    // le backend n'a pas de notion de campagne/affectation par programme, ce
    // don n'est donc pas distingué d'un don "libre" une fois enregistré.
    const bourseDonSection = document.getElementById("bourse-don-section");
    if (bourseDonSection) {
        const bourseDonFallback = document.getElementById("bourse-don-fallback");
        const bourseDonFeedbackEl = document.getElementById("bourse-don-feedback");
        function showBourseDonFeedback(text, kind) {
            bourseDonFeedbackEl.textContent = text;
            bourseDonFeedbackEl.className = `form-feedback ${kind}`;
            bourseDonFeedbackEl.style.display = "block";
        }

        const config = await window.LCPayment.getConfig();
        if (config && (config.stripeEnabled || config.fedapayEnabled)) {
            window.LCPayment.renderButtons(
                document.getElementById("bourse-don-options"),
                config,
                () => {
                    const nom = document.getElementById("bourse-don-nom").value.trim();
                    const email = document.getElementById("bourse-don-email").value.trim();
                    const montant = parseFloat(document.getElementById("bourse-don-montant").value);
                    if (!nom || !email) {
                        showBourseDonFeedback("Merci de renseigner votre nom et e-mail.", "error");
                        return null;
                    }
                    if (!montant || montant < (config.donMin || 1) || montant > (config.donMax || 5000)) {
                        showBourseDonFeedback(`Merci d'indiquer un montant de don entre ${config.donMin || 1} € et ${config.donMax || 5000} €.`, "error");
                        return null;
                    }
                    return { type: "don", montant, email, nom, returnPage: "bourse-scolaire.html" };
                },
                (msg) => showBourseDonFeedback(msg, "error")
            );
            bourseDonSection.style.display = "block";
        } else if (bourseDonFallback) {
            bourseDonFallback.style.display = "block";
        }

        const bourseParams = new URLSearchParams(window.location.search);
        if (bourseParams.get("payment") === "success") {
            showBourseDonFeedback("Don effectué, merci pour votre générosité !", "success");
        }
    }

    // Note : la section paiement de espace-membre.html n'est PAS initialisée
    // ici (voir window.LCPayment.initMemberPayment, appelée explicitement par
    // espace-membre.js une fois l'état de connexion résolu).
});
