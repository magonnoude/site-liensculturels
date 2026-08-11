# Documentation technique — www.liensculturels.org

Document de référence pour toute personne qui reprend la maintenance technique du site.
Décrit l'état réel de l'infrastructure au 10 août 2026 (**Version 1.00 — Release
Candidate**, tag Git `v1.00-rc`). `README.md` a été réécrit le 10 août 2026 et reflète
maintenant aussi l'état courant.

## 1. Vue d'ensemble

Site statique (HTML/CSS/JS vanilla, aucun framework, aucun build) hébergé sur **AWS S3 +
CloudFront**, avec un backend **serverless** (API Gateway HTTP API + Lambdas Python 3.11 +
DynamoDB) pour tout ce qui est dynamique : formulaires, espaces membres authentifiés,
paiements en ligne.

```
Navigateur
  ├─ Pages statiques ──────────► CloudFront (E27Z3FWSMEYT5U) ──► S3 (www.liensculturels.org)
  ├─ Connexion (Hosted UI) ────► Cognito (pool eu-west-3_nG1lWCmJK)
  └─ Appels API (fetch) ───────► API Gateway (8igk1o6vw4) ──► 11 Lambdas ──► DynamoDB / SES / S3
```

Compte AWS `928883700132`, région `eu-west-3` (Paris) pour toutes les ressources sauf le
certificat ACM du domaine nu (us-east-1, obligatoire pour CloudFront).

## 2. Frontend

- 29 pages HTML à la racine du dépôt, pas de sous-dossiers de pages (dont `guide-utilisation.html`,
  `vie-associative.html` et `trombinoscope.html`, réservées aux membres connectés — voir §2 fin
  de section).
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
- `assets/js/consent.js` (ajouté le 9 août 2026, sur les 23 pages publiques uniquement —
  pas sur les 5 espaces internes) : bannière de consentement RGPD, expose
  `window.LCConsent.reset()`. Google Analytics 4 (`G-EMTKPDTSJY`) n'est chargé qu'après clic
  "Accepter" — jamais au chargement de la page. Choix mémorisé en `localStorage`
  (`lc_analytics_consent`). Domaine `googletagmanager.com`/`google-analytics.com` autorisé
  dans la CSP CloudFront (voir piège §7).

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

## 4. Les 11 Lambdas (Python 3.11, hors dépôt Git)

Aucune n'est versionnée dans ce dépôt — leur code vit uniquement dans AWS. Toujours
`aws lambda get-function --query Code.Location` pour récupérer la source déployée avant de la
modifier, ne jamais deviner l'état actuel à partir d'une ancienne copie locale.

| Lambda | Rôle | Routes principales |
|---|---|---|
| `liensCulturels-contact-form` | Formulaire de contact public | `POST /contact` |
| `liensCulturels-adhesion-form` | Formulaire d'adhésion — crée directement le compte Cognito + la fiche membre (groupe `membre`), envoie 2 e-mails (confirmation + notification trésorerie). Depuis le 10/08/2026, avertit aussi contact@ (dans le corps de l'e-mail admin uniquement, jamais montré au public) si le téléphone saisi correspond déjà à un membre existant — signal utile quand la même personne se réinscrit avec un e-mail différent, ce que la détection par e-mail exact ne peut pas voir | `POST /adhesion` |
| `liensCulturels-payment` | Paiement Stripe/FedaPay (cotisation ou don), webhooks, e-mails de confirmation. Depuis le 11/08/2026, un paiement "pack famille" crée aussi un compte Cognito + une fiche membre par personne de la famille avec e-mail (metadata Stripe/FedaPay chunkées sur plusieurs clés `fm_N`, limite 500 car./valeur) — **non vérifié par un paiement réel**, voir ROADMAP.md B10 | `GET /payment/config`, `POST /payment/create-intent`, `POST /webhook/stripe`, `POST /webhook/fedapay` |
| `liensCulturels-member-profile` | Profil du membre connecté (lecture seule côté membre pour téléphone/adresse — gérés par le secrétariat), photo de profil, historique de paiements, export RGPD | `GET/PUT /me`, `GET /me/cotisations`, `POST /me/photo-upload-url`, `GET /me/export` |
| `liensCulturels-admin-api` | Gestion technique : membres (statut cotisation, rôles), documents, agenda, galerie, newsletter | `GET/PUT /admin/members`, `PUT /admin/members/{id}/groups`, `.../documents`, `.../agenda`, `.../gallery`, `.../newsletter` |
| `liensCulturels-secretariat-api` | Réunions, comptes-rendus, décisions ; alimente aussi `vie-associative.html` (réservée aux membres connectés depuis le 11/08/2026 — round 2 puis B12) | `.../secretariat/reunions`, `.../comptes-rendus`, `.../decisions`, `GET /public/vie-associative` (autorizer JWT, n'importe quel membre connecté) |
| `liensCulturels-tresorerie-api` | Cotisations, dépenses (avec champ `type` Fixe/Exceptionnelle depuis le 9 août 2026), export CSV, synthèse | `.../tresorerie/cotisations`, `.../depenses`, `GET /tresorerie/summary`, `GET /tresorerie/membres` |
| `liensCulturels-gouvernance-api` | **Nouvelle (9 août 2026), lecture seule** — tableau de bord agrégé pour le CA | `GET /gouvernance/summary` |
| `liensCulturels-newsletter` | Inscription/confirmation/désinscription newsletter (double opt-in) | `POST /newsletter/subscribe`, `GET /newsletter/confirm`, `GET /newsletter/unsubscribe` |
| `liensCulturels-public-content` | Contenu public en lecture seule (agenda, galerie) consommé par le site sans authentification | `GET /agenda`, `GET /gallery` |
| `liensCulturels-cotisation-reminder` | **Nouvelle (11/08/2026)**, pas de route API — déclenchée uniquement par EventBridge (règle `liensculturels-cotisation-reminder-annuel`, 1er novembre 8h UTC). Rappelle par e-mail aux membres dont la cotisation la plus récente n'est pas celle de l'année en cours. | — (invocation planifiée uniquement) |

Les deux avant-dernières manquaient à une version antérieure de ce document (10 Lambdas
réellement déployées à l'époque, pas 8) — corrigé le 11/08/2026 en vérifiant
`aws lambda list-functions`.

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

**Supervision (depuis le 11/08/2026)** : une alarme CloudWatch par Lambda sur la métrique
`Errors` (seuil ≥ 1 sur 5 min) publie sur le topic SNS `liensculturels-alerts` (abonnement
e-mail `contact@liensculturels.org`). **PITR activé** sur `liensculturels-members`,
`-cotisations` et `-depenses` (restauration possible jusqu'à 35 jours en arrière).
**Throttling** par route sur `POST /adhesion`/`/contact`/`/newsletter/subscribe` (2 req/s,
rafale 5) via `RouteSettings` du stage `$default` — anti-abus, testé en conditions réelles.

## 6. DynamoDB

| Table | Clé | Notes |
|---|---|---|
| `liensculturels-members` | `memberId` (= `sub` Cognito) | `email`, `nom`, `telephone`, `adresse`, `statutCotisation` (`inconnu`/`a_jour`/`impaye`), `photoUrl`, `familyMembers` (liste, pour le pack famille de l'adhésion), `createdAt` |
| `liensculturels-cotisations` | `cotisationId` | ⚠️ **`memberId` de cette table est l'e-mail du payeur, pas le `sub` Cognito** (héritage du paiement, qui ne connaît que l'e-mail saisi) — toute agrégation par membre doit joindre par e-mail. `type` = `"cotisation"` ou `"don"`. |
| `liensculturels-depenses` | `depenseId` | `libelle`, `montant`, `date`, `categorie` (liste standardisée côté `tresorerie.html` depuis le 9 août 2026 — téléphone, Gandi, Zoho, AWS, Qonto, Stripe, RMS, internet, + "Autre" en saisie libre ; reste un champ texte côté Lambda, pas de contrainte serveur), `type` (`"fixe"`/`"exceptionnelle"`), `justificatifKey` (S3, optionnel) |
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
- **Stripe est passé en mode LIVE le 10 août 2026** (`sk_live_`/`pk_live_`/`whsec_` sur
  `liensCulturels-payment`) — les paiements sont désormais réels. **Piège rencontré au
  passage en live** : le endpoint webhook créé côté Stripe pointait vers
  `/payment/webhook` (probablement par analogie avec `/payment/config` et
  `/payment/create-intent`) au lieu du vrai chemin `/webhook/stripe` — 2 tentatives de
  livraison en échec, un vrai paiement passé côté Stripe sans jamais être enregistré côté
  site (silencieux : `stripe_webhook()` ne loggue rien en cas d'échec de vérification de
  signature, seulement un `return 400`). Diagnostiqué via **Stripe → Développeurs →
  Webhooks → historique des tentatives** (le plus rapide) plutôt que les logs Lambda.
  Rattrapé en interrogeant directement l'API Stripe (`GET /v1/checkout/sessions`) pour
  retrouver le paiement manqué et en rejouant manuellement `_record_cotisation()` +
  `_send_payment_emails()`. Toujours vérifier l'URL exacte du endpoint webhook dans Stripe
  après toute reconfiguration.
- **Suite directe du piège précédent — webhook non idempotent** : une fois l'URL corrigée,
  Stripe a automatiquement renvoyé la notification en échec (comportement normal et
  documenté par Stripe — un webhook peut toujours être livré plusieurs fois), ce qui a
  recréé le même paiement une deuxième fois en base (le paiement manqué avait déjà été
  rattrapé manuellement). `_record_cotisation()` ne vérifiait pas l'unicité de
  `external_id` avant d'insérer. Corrigé : nouveau champ `externalId` sur chaque cotisation,
  vérifié par un `scan` avant tout `put_item` — si une référence existe déjà, l'insertion et
  les e-mails de confirmation sont ignorés. **A nécessité l'ajout de `dynamodb:Scan`** sur
  `liensculturels-cotisations` au rôle `liensculturels-payment-lambda-role` (le rôle n'avait
  que `PutItem`/`GetItem`/`Query` — sans ce correctif IAM, la vérification d'idempotence
  aurait échoué silencieusement, capturée par un `try/except`, sans jamais rien bloquer).
- **`liensCulturels-payment` valide `returnPage` contre une liste blanche codée en dur**
  (`ALLOWED_RETURN_PAGES`, anti-open-redirect volontaire) — toute nouvelle page qui appelle
  `window.LCPayment.renderButtons()` avec un nouveau `returnPage` doit être ajoutée à cette
  liste côté Lambda, sinon le paiement aboutit normalement mais la redirection finale retombe
  silencieusement sur `adhesion.html` (aucune erreur, juste la mauvaise page d'atterrissage).
  Bug réel rencontré en branchant `bourse-scolaire.html` sur le paiement.
- **La Response Headers Policy CloudFront `liensculturels-security-headers` a un
  Content-Security-Policy strict** — tout nouveau domaine externe appelé depuis le navigateur
  (script, XHR/fetch, police, iframe...) doit être ajouté explicitement à `script-src`/
  `connect-src`/etc., sinon le navigateur bloque silencieusement la requête (visible uniquement
  dans la console DevTools, pas d'erreur réseau côté serveur). Rencontré en activant Google
  Analytics 4 le 9 août 2026 : `gtag.js` bloqué par `script-src`, puis le beacon de mesure
  (`region1.google-analytics.com/g/collect`) bloqué par `connect-src` — corrigé en ajoutant
  `https://www.googletagmanager.com` à `script-src` et `https://www.google-analytics.com
  https://analytics.google.com https://*.google-analytics.com` à `connect-src`.

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

## 8bis. Convention : notification systématique de `contact@liensculturels.org`

Toute action significative sur un compte ou une transaction envoie une notification
séparée à `SENDER_EMAIL` (`contact@liensculturels.org`) — **pas une copie (CC) sur l'e-mail
envoyé à l'utilisateur**, un second `ses.send_email()` distinct. Déjà en place :

| Flux | Vers l'utilisateur | Vers contact@ |
|---|---|---|
| `liensCulturels-contact-form` | — | ✅ (c'est son seul but) |
| `liensCulturels-adhesion-form` | ✅ confirmation | ✅ notification séparée |
| `liensCulturels-payment` (`_send_payment_emails`) | ✅ confirmation | ✅ notification séparée |
| `liensCulturels-admin-api` (`update_member_groups`, depuis le 10/08/2026) | — | ✅ résumé du changement de rôle |

**Toute nouvelle route qui modifie un compte, une cotisation ou un rôle doit suivre cette
même convention** — envoi enveloppé dans un `try/except ClientError` pour ne jamais faire
échouer l'action principale si l'e-mail ne part pas (voir le pattern dans
`_send_payment_emails` ou `update_member_groups`). Les envois manuels/ponctuels (ex. :
invitations groupées) doivent aussi notifier contact@ séparément — un oubli réel s'est déjà
produit sur ce point (round 11).

## 9. Paiements

Voir `PAYMENTS-SETUP.md` pour la configuration complète. Stripe Checkout Session (hébergé,
pas de formulaire de carte embarqué) — **en mode LIVE depuis le 10 août 2026**, paiements
réels. FedaPay pour le Mobile Money au Bénin pas encore activé (ni clé de test ni clé live
configurée à ce jour). Les deux passent par `liensCulturels-payment`, qui envoie un e-mail de
confirmation au payeur et une notification à `contact@liensculturels.org` après chaque
paiement réussi (webhook `checkout.session.completed` pour Stripe, sur
`POST /webhook/stripe` — **pas** `/payment/webhook`, voir piège §7 — `transaction.approved`
pour FedaPay sur `POST /webhook/fedapay`).

`ALLOWED_RETURN_PAGES` (anti-open-redirect) inclut désormais `adhesion.html`,
`espace-membre.html` et `bourse-scolaire.html`.

## 10. Pour aller plus loin

- `ROADMAP.md` : historique complet des demandes traitées, round par round, avec le détail
  technique de chaque correctif — la source la plus riche pour comprendre *pourquoi* une
  décision a été prise.
- `PAYMENTS-SETUP.md` : mise en production de Stripe/FedaPay.
- `CLAUDE.md` : règles de travail (quand demander confirmation avant d'agir, hygiène du
  dépôt public, etc.) — à lire avant toute intervention future, humaine ou automatisée.
