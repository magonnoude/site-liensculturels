# Paiement en ligne des cotisations — mise en route

Le paiement en ligne (Stripe pour les cartes, FedaPay pour l'Afrique de l'Ouest) est
**codé et déployé, mais désactivé** — `GET /payment/config` renvoie `stripeEnabled: false`
et `fedapayEnabled: false` tant qu'aucune vraie clé n'est configurée. Le site continue de
fonctionner exactement comme avant (le trésorier envoie le RIB après validation de la
demande d'adhésion) jusqu'à ce que ce runbook soit suivi.

**Important — comptes marchands** : ces comptes doivent être ouverts au nom de
**l'association Liens Culturels** (RNA W021005524, SIREN 988 913 364), pas au nom de RMS.
L'argent des cotisations des membres doit atterrir sur un compte qui appartient légalement
à l'association.

## 1. Ouvrir les comptes

- **Stripe** : https://dashboard.stripe.com/register — association loi 1901, IBAN de
  l'association pour les virements.
- **FedaPay** : https://fedapay.com — nécessaire seulement si l'association encaisse des
  cotisations depuis l'Afrique de l'Ouest (XOF).

## 2. Récupérer les clés

| Variable | Où la trouver |
|---|---|
| `STRIPE_SECRET_KEY` | Dashboard Stripe → Développeurs → Clés API → clé secrète (`sk_live_…` en prod, `sk_test_…` pour tester) |
| `STRIPE_PUBLIC_KEY` | Même page → clé publique (`pk_live_…` / `pk_test_…`) |
| `FEDAPAY_SECRET_KEY` | Dashboard FedaPay → API keys → clé secrète (`sk_…`) |

## 3. Configurer la Lambda

```bash
aws lambda update-function-configuration \
  --function-name liensCulturels-payment \
  --region eu-west-3 \
  --environment "Variables={
    COTISATIONS_TABLE=liensculturels-cotisations,
    MEMBERS_TABLE=liensculturels-members,
    SITE_URL=https://www.liensculturels.org,
    FEDAPAY_MODE=sandbox,
    STRIPE_SECRET_KEY=sk_test_...,
    STRIPE_PUBLIC_KEY=pk_test_...,
    STRIPE_WEBHOOK_SECRET=whsec_...,
    FEDAPAY_SECRET_KEY=sk_...,
    FEDAPAY_WEBHOOK_SECRET=<chaîne aléatoire de votre choix>
  }"
```

Aucun redéploiement de code n'est nécessaire — changer les variables d'environnement
suffit. `adhesion.html` détecte automatiquement que le paiement est actif au chargement
suivant de la page.

## 4. Configurer les webhooks (confirmation fiable du paiement)

Le webhook est ce qui enregistre réellement la cotisation dans
`liensculturels-cotisations` (visible immédiatement dans l'espace trésorerie) — même si
la personne ferme son navigateur juste après avoir payé.

**Stripe** : Dashboard → Développeurs → Webhooks → Ajouter un endpoint
- URL : `https://8igk1o6vw4.execute-api.eu-west-3.amazonaws.com/webhook/stripe`
- Événement à écouter : `payment_intent.succeeded`
- Copier le « signing secret » (`whsec_…`) → variable `STRIPE_WEBHOOK_SECRET`

**FedaPay** : Dashboard → Webhooks
- URL : `https://8igk1o6vw4.execute-api.eu-west-3.amazonaws.com/webhook/fedapay`
- Secret : une chaîne aléatoire que vous choisissez → même valeur dans
  `FEDAPAY_WEBHOOK_SECRET`
- Événement : `transaction.approved`

## 5. Tester en mode sandbox/test avant le passage en LIVE

1. Utiliser les clés `sk_test_…`/`pk_test_…` (Stripe) et le mode `sandbox` (FedaPay).
2. Carte de test Stripe : `4242 4242 4242 4242`, n'importe quelle date future, n'importe
   quel CVC.
3. Sur `adhesion.html`, remplir le formulaire, choisir un type de cotisation, cliquer
   « Payer par carte », vérifier que la cotisation apparaît dans
   [tresorerie.html](https://www.liensculturels.org/tresorerie.html) après paiement.

## 6. Passage en production

1. Remplacer `sk_test_…`/`pk_test_…` par `sk_live_…`/`pk_live_…`.
2. Recréer le webhook Stripe dans le dashboard **live** (pas le même que sandbox) et
   remettre à jour `STRIPE_WEBHOOK_SECRET`.
3. Passer `FEDAPAY_MODE` à `live` et utiliser la clé secrète de production FedaPay.

## Montants actuels

Définis en dur dans `lambda_payment/index.py` (constante `AMOUNTS`) et dans
`adhesion.html` (texte + `<select id="membershipType">`) : 30 € individuel, 50 € famille.
Pour les changer, éditer les deux endroits et redéployer la Lambda.
