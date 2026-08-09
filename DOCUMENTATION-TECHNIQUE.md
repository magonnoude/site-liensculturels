# Documentation technique — www.liensculturels.org

Document de référence pour toute personne qui reprend la maintenance technique du site.
Décrit l'état réel de l'infrastructure au 9 août 2026. Le `README.md` du dépôt est plus
ancien et partiellement obsolète (mentionne encore Brevo pour la newsletter, par exemple) —
ce document-ci fait foi pour l'état courant.

## 1. Vue d'ensemble

Site statique (HTML/CSS/JS vanilla, aucun framework, aucun build) hébergé sur **AWS S3 +
CloudFront**, avec un backend **serverless** (API Gateway HTTP API + Lambdas Python 3.11 +
DynamoDB) pour tout ce qui est dynamique : formulaires, espaces membres authentifiés,
paiements en ligne.

```
Navigateur
  ├─ Pages statiques ──────────► CloudFront (E27Z3FWSMEYT5U) ──► S3 (www.liensculturels.org)
  ├─ Connexion (Hosted UI) ────► Cognito (pool eu-west-3_nG1lWCmJK)
  └─ Appels API (fetch) ───────► API Gateway (8igk1o6vw4) ──► 8 Lambdas ──► DynamoDB / SES / S3
```

Compte AWS `928883700132`, région `eu-west-3` (Paris) pour toutes les ressources sauf le
certificat ACM du domaine nu (us-east-1, obligatoire pour CloudFront).

## 2. Frontend

- 27 pages HTML à la racine du dépôt, pas de sous-dossiers de pages.
- Bilingue FR/EN **sans pages séparées** : chaque texte existe deux fois, dans
  `<span class="lang-fr">…</span>` et `<span class="lang-en">…</span>`, basculées en JS
  (`main.js` → `switchLanguage()`), préférence persistée en `localStorage`. **Ne jamais**
  masquer une `<option>` individuellement avec `display:none` (les navigateurs l'ignorent) —
  utiliser deux `<select>` séparés par langue quand le choix est fait via une liste
  déroulante (voir `adhesion.html` pour l'exemple : `#civilite`/`#civiliteEn`,
  `#membershipType`/`#membershipTypeEn`).
- `assets/css/style.css` : une seule feuille de style pour tout le site public. Variables de
  marque : `--primary-color: #005A9C` (bleu), `--secondary-color: #8BC34A` (vert),
  `--accent-color: #FFC107` (jaune), fond crème de l'identité `#F6F0E2`.
- `assets/img/brand/` : SVG de l'identité visuelle actuelle (logo-principal, logo-horizontal,
  logo-icone, logo-monochrome — ce dernier utilisé uniquement en CSS `@media print`).
  `assets/img/logo.png` (ancien logo carré) conservé pour compatibilité avec d'anciens
  partages sociaux, ne plus l'utiliser pour du nouveau contenu.
- Espaces privés (`admin.html`, `secretariat.html`, `tresorerie.html`, `gouvernance.html`,
  `espace-membre.html`) : **volontairement absents** du nav public et de `sitemap.xml` —
  accès uniquement par lien direct ou depuis le tableau de bord `espace-membre.html`, qui
  construit dynamiquement les liens visibles selon les groupes Cognito du compte connecté
  (`assets/js/espace-membre.js`, tableau `spaceLinks`).
- `assets/js/auth.js` expose `window.LCAuth` (login/logout/handleRedirect/isLoggedIn/
  getClaims/hasGroup/apiFetch) — flux OAuth2 Authorization Code + PKCE contre le Hosted UI
  Cognito. **Stocke les tokens en `sessionStorage`**, pas `localStorage` — donc pas partagé
  entre onglets, perdu à la fermeture de l'onglet (comportement voulu, pas un bug).

## 3. Authentification — Amazon Cognito

- User pool `eu-west-3_nG1lWCmJK`, client `757mjbo05rlabup4kkai470d86`, domaine Hosted UI
  `https://liensculturels-membres.auth.eu-west-3.amazoncognito.com`.
- 5 groupes : `admin` (gestion technique du site : documents, agenda, galerie, newsletter,
  invitation de membres), `secretaire`, `tresorier`, `gouvernance` (tableau de bord
  stratégique du CA, créé le 9 août 2026 — **volontairement séparé d'`admin`**, aucune des
  Lambdas ne fait de bypass "admin voit tout" pour ce groupe), `membre` (par défaut).
- **Un compte peut appartenir à plusieurs groupes.** ⚠️ Voir §7 "Pièges connus" — le format
  de sérialisation de `cognito:groups` côté API Gateway a été une source de bug réel.
- Création de compte : soit via le formulaire d'adhésion public (`POST /adhesion`, groupe
  `membre` automatique), soit via l'admin ("Inviter un membre", `POST /admin/members/invite`,
  choix du/des groupe(s)), soit en direct par script (`admin-create-user` +
  `admin-add-user-to-group`, utilisé pour le provisioning en masse du bureau).
- Aucun compte ne reçoit l'e-mail d'invitation Cognito par défaut sur ce projet — jugé peu
  fiable (adresse générique, souvent filtré en spam). À la place : `MessageAction=SUPPRESS`
  + mot de passe temporaire généré côté serveur, transmis par un autre canal.

## 4. Les 8 Lambdas (Python 3.11, hors dépôt Git)

Aucune n'est versionnée dans ce dépôt — leur code vit uniquement dans AWS. Toujours
`aws lambda get-function --query Code.Location` pour récupérer la source déployée avant de la
modifier, ne jamais deviner l'état actuel à partir d'une ancienne copie locale.

| Lambda | Rôle | Routes principales |
|---|---|---|
| `liensCulturels-contact-form` | Formulaire de contact public | `POST /contact` |
| `liensCulturels-adhesion-form` | Formulaire d'adhésion — crée directement le compte Cognito + la fiche membre (groupe `membre`), envoie 2 e-mails (confirmation + notification trésorerie) | `POST /adhesion` |
| `liensCulturels-payment` | Paiement Stripe/FedaPay (cotisation ou don), webhooks, e-mails de confirmation | `GET /payment/config`, `POST /payment/create-intent`, `POST /webhook/stripe`, `POST /webhook/fedapay` |
| `liensCulturels-member-profile` | Profil du membre connecté (lecture seule côté membre pour téléphone/adresse — gérés par le secrétariat), photo de profil, historique de paiements | `GET/PUT /me`, `GET /me/cotisations`, `POST /me/photo-upload-url` |
| `liensCulturels-admin-api` | Gestion technique : membres (statut cotisation, rôles), documents, agenda, galerie, newsletter | `GET/PUT /admin/members`, `PUT /admin/members/{id}/groups`, `.../documents`, `.../agenda`, `.../gallery`, `.../newsletter` |
| `liensCulturels-secretariat-api` | Réunions, comptes-rendus, décisions ; alimente aussi la page publique `vie-associative.html` | `.../secretariat/reunions`, `.../comptes-rendus`, `.../decisions`, `GET /public/vie-associative` (sans authorizer) |
| `liensCulturels-tresorerie-api` | Cotisations, dépenses (avec champ `type` Fixe/Exceptionnelle depuis le 9 août 2026), export CSV, synthèse | `.../tresorerie/cotisations`, `.../depenses`, `GET /tresorerie/summary`, `GET /tresorerie/membres` |
| `liensCulturels-gouvernance-api` | **Nouvelle (9 août 2026), lecture seule** — tableau de bord agrégé pour le CA | `GET /gouvernance/summary` |

Convention d'autorisation commune (sauf `contact-form`/`adhesion-form`/routes publiques,
sans authorizer) : claims lues dans
`event["requestContext"]["authorizer"]["jwt"]["claims"]`, groupes extraits via
`_parse_groups()` (voir §7), vérification du ou des groupes requis, sinon 403.

## 5. API Gateway

Une seule API HTTP `liensCulturels-API` (id `8igk1o6vw4`), CORS restreint à
`https://www.liensculturels.org` + `https://liensculturels.org`. Autorizer JWT unique
(id `lzyig4`) pointant vers le pool Cognito, réutilisé par toutes les routes privées.

**Permissions Lambda ⇄ API Gateway** : deux styles coexistent selon la Lambda —
`admin-api`/`secretariat-api`/`tresorerie-api` ont une permission **wildcard** sur tout leur
préfixe (`/admin/*`, etc.), tandis que `member-profile`, `adhesion-form` et
`gouvernance-api` ont des permissions **scopées route par route** (`add-permission` avec un
`--source-arn` précis). **Toute nouvelle route sur une Lambda à permissions scopées a besoin
de son propre `add-permission`, sinon 500 silencieux** — piège déjà rencontré deux fois cette
session, voir §7.

Pour la liste exacte et à jour des routes : `aws apigatewayv2 get-routes --api-id 8igk1o6vw4
--region eu-west-3 --query "Items[].RouteKey" --output text`.

## 6. DynamoDB

| Table | Clé | Notes |
|---|---|---|
| `liensculturels-members` | `memberId` (= `sub` Cognito) | `email`, `nom`, `telephone`, `adresse`, `statutCotisation` (`inconnu`/`a_jour`/`impaye`), `photoUrl`, `familyMembers` (liste, pour le pack famille de l'adhésion), `createdAt` |
| `liensculturels-cotisations` | `cotisationId` | ⚠️ **`memberId` de cette table est l'e-mail du payeur, pas le `sub` Cognito** (héritage du paiement, qui ne connaît que l'e-mail saisi) — toute agrégation par membre doit joindre par e-mail. `type` = `"cotisation"` ou `"don"`. |
| `liensculturels-depenses` | `depenseId` | `libelle`, `montant`, `date`, `categorie` (texte libre), `type` (`"fixe"`/`"exceptionnelle"`, depuis le 9 août 2026), `justificatifKey` (S3, optionnel) |
| `liensculturels-agenda` | `eventId` | Alimente `agenda.html` (public) et le widget de `espace-membre.html` |
| `liensculturels-gallery` | `itemId` | Photothèque/vidéothèque |
| `liensculturels-newsletter` | `email` | `status` (`pending`/`confirmed`/`unsubscribed`), double opt-in |
| `liensculturels-reunions` / `-comptes-rendus` / `-decisions` | id dédié | Secrétariat — voir aussi `GET /public/vie-associative` pour la vue publique (texte seulement, jamais les PDF scannés) |

## 7. Pièges connus (vécus, pas hypothétiques)

- **`cognito:groups` arrive à l'autorizer JWT sous forme de chaîne séparée par des ESPACES**
  (`"[admin secretaire]"`), **pas des virgules.** Toute Lambda qui parse cette chaîne doit
  splitter sur `[,\s]+`, jamais juste `,`. Bug réel : un compte dans 2+ groupes se voyait
  refuser toute action d'écriture sur admin/secrétariat/trésorerie, silencieusement (403 sans
  exception serveur), pendant plusieurs jours avant d'être détecté — parce que tous les tests
  précédents utilisaient des comptes à un seul groupe.
- **Permissions Lambda scopées par route** (voir §5) — une nouvelle route sur
  `member-profile`/`adhesion-form`/`gouvernance-api` a besoin de son propre
  `aws lambda add-permission`, sinon 500 silencieux côté navigateur.
- **`put-role-policy` remplace tout le document, pas seulement le statement qu'on modifie.**
  Ne jamais construire la nouvelle version d'une policy à partir d'une lecture *filtrée*
  (`--query "PolicyDocument.Statement[?Sid==...]"`) — ça tronque silencieusement tous les
  autres statements. Toujours relire la policy complète juste avant, ou (plus sûr) créer une
  policy inline **séparée** pour chaque ajout de permission plutôt que de fusionner dans une
  existante.
- **Buckets S3 recevant des envois directs depuis le navigateur (URL présignée) ont besoin
  d'une config CORS explicite** (`aws s3api put-bucket-cors`) — sans ça, le préflight
  `OPTIONS` échoue silencieusement côté navigateur (invisible en test `curl`, qui n'applique
  pas CORS). Concerne `www.liensculturels.org` (photos de profil),
  `liensculturels-secretariat-docs`, `liensculturels-tresorerie-docs`.
- **`deploy.yml` ne fait jamais `aws s3 sync --delete`** (choix volontaire, voir commentaire
  dans le workflow) — supprimer un fichier du dépôt ne le supprime **pas** du bucket S3 en
  production. Après un `git rm`, il faut `aws s3 rm` + une invalidation CloudFront à la main
  pour les chemins concernés, sinon l'ancien fichier reste servi indéfiniment.
- **stripe-python 15.x** : les objets retournés par `stripe.Webhook.construct_event()`
  (`StripeObject`) n'ont pas de méthode `.get()` — seulement `__getitem__`/attributs. Appeler
  `.get()` dessus lève `AttributeError`, pas un comportement dict normal. Toujours faire
  `.to_dict()` (récursif par défaut) avant de manipuler l'objet comme un dictionnaire.
- **Inkscape (snap)** ne peut lire/écrire que sous `$HOME` — jamais `/tmp`, échoue
  silencieusement avec un message qui ressemble à une erreur de chemin.
- **`sk_test_`/`whsec_` de Stripe sont en mode TEST** (configurés le 9 août 2026 sur
  `liensCulturels-payment`) — aucune vraie transaction. Voir `PAYMENTS-SETUP.md` pour passer
  en mode live (comptes marchands au nom de l'association nécessaires au préalable).
- **`liensCulturels-payment` valide `returnPage` contre une liste blanche codée en dur**
  (`ALLOWED_RETURN_PAGES`, anti-open-redirect volontaire) — toute nouvelle page qui appelle
  `window.LCPayment.renderButtons()` avec un nouveau `returnPage` doit être ajoutée à cette
  liste côté Lambda, sinon le paiement aboutit normalement mais la redirection finale retombe
  silencieusement sur `adhesion.html` (aucune erreur, juste la mauvaise page d'atterrissage).
  Bug réel rencontré en branchant `bourse-scolaire.html` sur le paiement.

## 8. Déploiement

- Push sur `main` → `.github/workflows/deploy.yml` : `aws s3 sync` (exclusions : `.git`,
  `.github`, `.claude`, `tasks/`, `*.md`, `.gitignore`, `*.docx`, `*.sh`,
  `*.Zone.Identifier`) puis invalidation CloudFront. Cache-Control `no-cache` forcé sur les
  fichiers HTML pour que les mises à jour de contenu soient visibles immédiatement.
- **Le dossier `logo-liens-culturels/`** (SVG sources bruts de l'identité visuelle) est
  volontairement **jamais commité** — il n'a donc jamais besoin d'être exclu explicitement,
  il n'existe simplement pas dans ce que GitHub Actions déploie.
- Déploiement manuel : `./deploy.sh "message de commit"` (miroir du workflow).
- IAM de déploiement : utilisateur `github-actions-liensculturels`, policy scopée S3 (ce
  bucket uniquement) + invalidation CloudFront (cette distribution uniquement).

## 9. Paiements

Voir `PAYMENTS-SETUP.md` pour la configuration complète. En résumé : Stripe Checkout Session
(hébergé, pas de formulaire de carte embarqué) + FedaPay pour le Mobile Money au Bénin (pas
encore activé — ni clé de test ni clé live configurée à ce jour). Les deux passent par
`liensCulturels-payment`, qui envoie un e-mail de confirmation au payeur et une notification
à `contact@liensculturels.org` après chaque paiement réussi (webhook `checkout.session.
completed` pour Stripe, `transaction.approved` pour FedaPay).

## 10. Pour aller plus loin

- `ROADMAP.md` : historique complet des demandes traitées, round par round, avec le détail
  technique de chaque correctif — la source la plus riche pour comprendre *pourquoi* une
  décision a été prise.
- `PAYMENTS-SETUP.md` : mise en production de Stripe/FedaPay.
- `CLAUDE.md` : règles de travail (quand demander confirmation avant d'agir, hygiène du
  dépôt public, etc.) — à lire avant toute intervention future, humaine ou automatisée.
