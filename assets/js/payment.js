/*
 * Paiement en ligne de la cotisation (adhesion.html).
 *
 * Tant que l'association n'a pas ses propres identifiants Stripe/FedaPay
 * (comptes marchands à son nom, pas ceux de RMS — voir la conversation),
 * GET /payment/config renvoie stripeEnabled=false et fedapayEnabled=false,
 * et cette section reste masquée : le site continue de fonctionner comme
 * aujourd'hui (envoi du RIB par le trésorier après validation). Le jour où
 * les vraies clés sont configurées sur la Lambda liensCulturels-payment,
 * cette UI s'active automatiquement, sans rien changer côté front.
 */
document.addEventListener("DOMContentLoaded", async () => {
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
    const paymentOptions = document.getElementById("payment-options");
    const ribFallback = document.getElementById("rib-fallback");
    if (!paymentSection) return; // pas sur adhesion.html

    const API_BASE_URL = "https://8igk1o6vw4.execute-api.eu-west-3.amazonaws.com";
    let config = null;
    try {
        const resp = await fetch(`${API_BASE_URL}/payment/config`);
        config = await resp.json();
    } catch (e) {
        return; // API indisponible : on garde le flux RIB existant, silencieusement
    }

    if (!config || (!config.stripeEnabled && !config.fedapayEnabled)) {
        return; // paiement en ligne pas encore activé — rien à faire, le RIB reste affiché
    }

    const feedbackEl = document.getElementById("payment-feedback");
    function showFeedback(text, kind) {
        feedbackEl.textContent = text;
        feedbackEl.className = `form-feedback ${kind}`;
        feedbackEl.style.display = "block";
    }

    let stripeInstance = null;
    let cardElement = null;
    if (config.stripeEnabled && window.Stripe && config.stripePublicKey) {
        stripeInstance = Stripe(config.stripePublicKey);
    }

    function currentAmount() {
        const type = document.getElementById("membershipType").value;
        return config.amounts[type];
    }

    if (config.stripeEnabled) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn";
        btn.textContent = `Payer par carte (${currentAmount()} €)`;
        btn.addEventListener("click", () => {
            document.getElementById("stripe-payment-form").style.display = "block";
            if (!cardElement && stripeInstance) {
                const elements = stripeInstance.elements();
                cardElement = elements.create("card");
                cardElement.mount("#stripe-card-element");
            }
        });
        paymentOptions.appendChild(btn);
    }

    if (config.fedapayEnabled) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn";
        btn.textContent = "Payer via FedaPay (Afrique de l'Ouest)";
        btn.addEventListener("click", async () => {
            const result = await startPayment("fedapay");
            if (result && result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
            }
        });
        paymentOptions.appendChild(btn);
    }

    async function startPayment(provider) {
        const email = document.getElementById("email").value;
        const nom = document.getElementById("fullName").value;
        const type = document.getElementById("membershipType").value;
        if (!email || !nom) {
            showFeedback("Merci de renseigner votre nom et e-mail dans le formulaire ci-dessus d'abord.", "error");
            return null;
        }
        const resp = await fetch(`${API_BASE_URL}/payment/create-intent`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, provider, email, nom }),
        });
        const data = await resp.json();
        if (!resp.ok) {
            showFeedback(data.error || "Erreur lors de la création du paiement.", "error");
            return null;
        }
        return data;
    }

    document.getElementById("stripe-pay-btn").addEventListener("click", async () => {
        if (!stripeInstance || !cardElement) return;
        const result = await startPayment("stripe");
        if (!result || !result.clientSecret) return;
        const { error } = await stripeInstance.confirmCardPayment(result.clientSecret, {
            payment_method: { card: cardElement },
        });
        if (error) {
            showFeedback(error.message, "error");
        } else {
            showFeedback("Paiement effectué, merci !", "success");
            ribFallback.style.display = "none";
        }
    });

    paymentSection.style.display = "block";
});
