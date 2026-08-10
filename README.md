# site-liensculturels

## Site web et plateforme numérique de l'Association Liens Culturels

![Logo de Liens Culturels](assets/img/brand/logo-horizontal.svg)

Dépôt du site officiel **et** de la plateforme numérique de l'association **Liens
Culturels** (loi 1901, Nogent-l'Artaud — France, Antilles, Bénin) : vitrine publique
bilingue FR/EN, adhésion et paiement en ligne, et quatre espaces internes authentifiés
(membre, admin, secrétariat, trésorerie, gouvernance).

**Version 1.00 — Release Candidate, 10 août 2026.** Voir `ROADMAP.md` pour l'historique
complet des rounds de développement et le backlog des points ouverts après cette version.

---

## 🎯 Objectif

* **Informer** le public sur la vision et les actions de l'association.
* **Gérer les adhésions** : inscription en ligne, paiement de la cotisation par carte
  bancaire (Stripe, en production), pack famille.
* **Outiller le bureau** : gestion des membres et des rôles, documents, agenda,
  médiathèque, newsletter, réunions/comptes-rendus/décisions, trésorerie (cotisations,
  dons, dépenses), et un tableau de bord de pilotage pour le Conseil d'Administration.
* **Mesurer l'audience**, avec le consentement explicite des visiteurs (RGPD).

## ✨ Fonctionnalités principales

* **Site public bilingue** (FR/EN, 28 pages) : présentation de l'association, projets,
  bourse scolaire "Avenir Partagé" (avec don en ligne), agenda, médiathèque, vie
  associative, mentions légales/CGU/confidentialité, guide d'utilisation + FAQ.
* **Adhésion et paiement en ligne** : fiche d'adhésion (individuelle ou pack famille),
  paiement de la cotisation ou don libre par carte bancaire via **Stripe** (mode
  **production**, FedaPay/Mobile Money prévu pour le Bénin, pas encore activé).
* **Espace membre authentifié** (Amazon Cognito) : profil, statut de cotisation, photo,
  historique des paiements, agenda personnalisé.
* **Quatre espaces internes**, selon le rôle du compte connecté :
  * **Admin** — membres, rôles, documents, agenda, médiathèque, newsletter.
  * **Secrétariat** — réunions, comptes-rendus, décisions (alimente la page publique
    "Vie associative").
  * **Trésorerie** — cotisations, dons, dépenses (catégorisées), export CSV.
  * **Gouvernance** — tableau de bord de pilotage pour le Conseil d'Administration :
    adhérents, point financier, dépenses par type et catégorie.
* **Conformité RGPD** : bannière de consentement avant tout chargement de Google
  Analytics 4, politique de confidentialité à jour.

## 🛠️ Technologies utilisées

* **Frontend** : HTML5 / CSS3 / JavaScript vanilla (aucun framework, aucun build),
  Font Awesome, Lightbox2.
* **Backend serverless** (AWS, non versionné dans ce dépôt — voir
  `DOCUMENTATION-TECHNIQUE.md`) : API Gateway (HTTP API), 8 fonctions Lambda
  (Python 3.11), DynamoDB, Amazon Cognito (authentification), Amazon SES (e-mails
  transactionnels), Stripe (paiements).

## 🚀 Installation et déploiement

Le site est hébergé en production sur **AWS S3 + CloudFront**.

```bash
git clone https://github.com/magonnoude/site-liensculturels.git
python3 -m http.server   # aperçu local depuis la racine du dépôt
```

**Déploiement automatique** : tout push sur `main` déclenche
`.github/workflows/deploy.yml` (sync S3 + invalidation CloudFront).

**Déploiement manuel** :
```bash
cd ~/RMS_Projects/www.liensculturels.org
./deploy.sh "message de commit"
```

## 📂 Structure du dépôt

```
.
├── .github/workflows/       # deploy.yml (déploiement auto), lint.yml (validation HTML)
├── assets/
│   ├── css/style.css        # feuille de style principale
│   ├── img/                 # images, identité visuelle (assets/img/brand/)
│   └── js/                  # main.js, auth.js, payment.js, consent.js, espace-membre.js, ...
├── documents/                # PDFs publics (statuts, PV d'AG)
├── index.html, a-propos.html, ... # 28 pages HTML à la racine (pas de sous-dossiers de pages)
├── admin.html, secretariat.html, tresorerie.html, gouvernance.html, espace-membre.html
│                              # espaces internes — hors nav publique et sitemap.xml
├── sitemap.xml / robots.txt  # SEO
├── deploy.sh                  # déploiement manuel (miroir du workflow GitHub Actions)
├── CLAUDE.md                  # règles de travail pour Claude Code sur ce dépôt
├── DOCUMENTATION-TECHNIQUE.md  # référence technique complète (architecture, Lambdas, pièges connus)
├── ROADMAP.md                  # historique des rounds de développement + backlog
└── README.md                   # ce fichier
```

## 📚 Pour aller plus loin

- **`DOCUMENTATION-TECHNIQUE.md`** — architecture complète, les 8 Lambdas et leurs routes,
  schéma DynamoDB, Cognito, et une section "pièges connus" tirée d'incidents réels.
  Document de référence pour toute personne qui reprend la maintenance technique.
- **`ROADMAP.md`** — historique complet des demandes traitées, round par round, plus le
  backlog des points ouverts après la Version 1.00.
- **`PAYMENTS-SETUP.md`** — configuration Stripe/FedaPay.
- Guide d'utilisation en ligne (membres connectés) :
  [www.liensculturels.org/guide-utilisation.html](https://www.liensculturels.org/guide-utilisation.html).

## Contact

Pour toute question, utilisez le formulaire de contact du site ou écrivez à
**contact@liensculturels.org**.
