# ROADMAP — www.liensculturels.org

Backlog établi après audit du site, du dépôt Git et de l'infrastructure AWS (2026-08-07),
complété le même jour. Priorisé par impact / effort. `[x]` = corrigé.

**Statut : les 6 priorités mécaniques (P1–P6) sont closes**, y compris la restriction CORS.
**Les 4 espaces authentifiés (membre / admin / secrétariat / trésorerie) demandés
séparément sont également construits, déployés et vérifiés en production** (2026-08-08) —
voir la section dédiée ci-dessous. Ce qui reste ouvert : le câblage des photos de bureau
(bloqué en attente d'une info de l'association, voir P5) et la traduction du contenu de 13
pages restantes (l'infrastructure bilingue et 5 pages sont déjà en ligne, voir tableau).

## Tableau de suivi — demandes du 7–8 août 2026

Toutes les demandes reçues par message, dans l'ordre, avec leur statut réel au 8 août.
`✅` fait et vérifié en production · `🟡` fait partiellement · `⛔` bloqué (dépend d'une
action externe, pas de moi) · `💬` répondu comme conseil, pas une action à faire.

| # | Demande | Statut | Détail |
|---|---|---|---|
| 1 | Infos d'immatriculation (RNA, SIREN, dates JOAFE) dans le site + footer | ✅ | Déjà correctes dans `mentions-legales.html` et `post-creation.html` avant même cette session ; seul le téléphone manquait, ajouté partout. |
| 2 | Newsletter avec les outils AWS, abandonner Brevo | ✅ | DynamoDB + Lambda + SES, double opt-in, `admin.html` affiche les vrais abonnés. |
| 3a | Header façon kesho.grouperms.com | ✅ | Reconstruit une 2ᵉ fois le 8 août après un premier essai incomplet : bandeau utilitaire + barre principale en un seul bloc épinglé, CTA en pilule distincte, nav en tuiles, menu mobile. |
| 3b | Cognito vs Keycloak — logique d'utiliser le Keycloak RMS avec un realm séparé pour un client comme GARA ? | 💬 | Conseil donné : garder Cognito dédié (déjà construit, testé) plutôt que coupler la disponibilité d'un client à l'infra partagée de RMS. Reconsidérer seulement si RMS industrialise ce pattern sur plusieurs clients. |
| 4 | Invitations via SES + vérifier le domaine `liensculturels.org` dans AWS | 🟡 | Domaine bien déclaré dans AWS mais vérification DNS expirée (DKIM manquant chez Gandi) — enregistrements transmis, **en attente que vous les ajoutiez**. L'envoi fonctionne déjà via l'identité e-mail `contact@liensculturels.org`, vérifiée séparément. |
| 5 | Stripe + FedaPay pour les cotisations, fiche d'adhésion avec paiement direct détaillé, sur le modèle d'academy | 🟡 | Codé, déployé, **volontairement pas actif** — comptes marchands à ouvrir au nom de l'association (confirmé avec vous), voir `PAYMENTS-SETUP.md`. |
| 6 | Footer avec Mentions Légales / CGU / Confidentialité façon academy | ✅ | `cgu.html` et `confidentialite.html` créées (contenu propre à l'association, pas copié), footer refait sur les 25 pages. |
| 7 | Email officiel `contact@liensculturels.com` + téléphone `+33674437609` | ✅ | `.com` confirmé être une coquille pour `.org` (déjà l'email utilisé partout) ; téléphone ajouté. |
| 8 | Boutons séparés « Devenir Membre / Nous Rejoindre » (1ʳᵉ inscription + paiement) et « Accès Membre » | ✅ | Les deux existaient déjà dans des zones différentes mais avec des libellés trop proches ; nommage clarifié, puis le header entier reconstruit le 8 août pour vraiment séparer les deux visuellement (pilule CTA vs lien discret). |
| 9 | Site multilingue EN/FR | 🟡 | Infrastructure en ligne sur les 25 pages (bascule FR/EN dans le header, persistée) + navigation et pied de page entièrement bilingues partout + contenu traduit sur 5 pages clés (accueil, qui sommes-nous, contact, adhésion, bourse scolaire). **13 pages avec chrome bilingue mais contenu encore en français uniquement** : `projets.html`, `agenda.html`, `blog.html` + les 3 articles `post-*.html`, `bureau.html`, `mot-des-dirigeants.html`, `phototheque.html`, `videotheque.html`, `mentions-legales.html`, `cgu.html`, `confidentialite.html`. |
| 10 | Tableau de suivi + mise à jour de la roadmap .md et web | ✅ | Ce tableau, et l'artefact web republié (voir lien dans le fil de discussion). |

## Espaces authentifiés (membre / admin / secrétariat / trésorerie)

Construits et vérifiés de bout en bout le 2026-08-08, chacun avec compte jetable de test
avant d'être considéré fini. Architecture : Cognito (pool dédié, isolé du Keycloak
d'academy.grouperms.com) + DynamoDB + une Lambda par espace (rôle IAM scopé) + pages HTML
statiques classiques, aucune donnée sensible commitée dans ce dépôt public.

- [x] **[espace-membre.html](https://www.liensculturels.org/espace-membre.html)** —
  connexion Cognito (PKCE), profil, statut de cotisation. Hub qui affiche les liens vers
  les 3 espaces suivants selon les groupes Cognito du compte connecté.
- [x] **[admin.html](https://www.liensculturels.org/admin.html)** — membres (liste,
  cotisation, invitation), documents publics (`documents/`), agenda (alimente désormais
  `agenda.html` dynamiquement, les 9 événements historiques ont été migrés), photothèque/
  vidéothèque (section dynamique ajoutée sous la grille existante, laissée intacte),
  newsletter (liste des vrais abonnés depuis le 8 août, Brevo abandonné).
- [x] **[secretariat.html](https://www.liensculturels.org/secretariat.html)** — réunions,
  comptes-rendus (PDF stockés dans un bucket S3 **privé** dédié, jamais le bucket public du
  site), décisions.
- [x] **[tresorerie.html](https://www.liensculturels.org/tresorerie.html)** — cotisations
  (l'enregistrement d'un paiement met à jour le statut du membre, visible aussi côté admin),
  dépenses avec justificatifs (bucket privé dédié), export CSV, tuiles de synthèse (solde).
- [x] **Bug de nav corrigé** : `espace-membre.html` n'affichait un lien d'espace que si le
  compte était dans le groupe exact correspondant, alors que le backend autorise déjà
  secrétariat/trésorerie à un compte `admin`. Un admin ne voyait donc pas de lien vers des
  espaces auxquels il avait pourtant accès par URL directe. Corrigé.
- [ ] **Fiabilité des e-mails d'invitation Cognito.** Le service d'envoi par défaut de
  Cognito (adresse générique, filtré en spam, ~50 e-mails/jour) n'est pas fiable pour de
  vraies invitations. À faire avant d'inviter de vrais membres : brancher Amazon SES avec un
  domaine d'envoi vérifié (ex. `noreply@liensculturels.org`).

Détails techniques complets (IDs de ressources AWS, bugs trouvés en cours de route, schéma
des tables DynamoDB) dans la mémoire de session — demander un résumé si besoin pour une
prochaine session.

## Priorité 1 — Bugs actifs en production

- [x] **Domaine nu cassé.** `https://liensculturels.org` (sans `www`) échouait en TLS et
  renvoyait une 403 CloudFront. Corrigé : nouveau certificat ACM avec SAN sur le domaine nu,
  validé via Gandi, alias + certificat mis à jour sur CloudFront `E27Z3FWSMEYT5U`. Redirige
  désormais en 301 vers `www.liensculturels.org`.
- [x] **CSS/JS cassés sur les pages de confirmation newsletter.** `merci-newsletter.html`
  et `validation-newsletter.html` pointaient vers `css/style.css`/`js/main.js` au lieu de
  `assets/css/…`/`assets/js/…`.
- [x] **Header/footer vides sur ces deux mêmes pages.** Remplacés par le header/footer
  standard du site (navigation, coordonnées, réseaux sociaux). Balisage `<p>`/`<strong>`
  invalide corrigé au passage.
- [x] **CORS API Gateway trop permissif.** `AllowOrigins` restreint de `"*"` à
  `https://www.liensculturels.org` + `https://liensculturels.org` sur `liensCulturels-API`.
  Vérifié : une origine tierce ne reçoit plus les en-têtes CORS en preflight.

## Priorité 2 — SEO & découvrabilité

- [x] **Open Graph / Twitter Card** ajoutées sur les 18 pages (title, description, image,
  url, type, locale).
- [x] **Balises canonical** ajoutées sur les 18 pages.
- [x] **Sitemap incomplet.** `phototheque.html`, `videotheque.html`,
  `mentions-legales.html` ajoutées.
- [x] **Pages de confirmation indexables.** `noindex` ajouté.
- [x] **Données structurées schema.org.** Bloc JSON-LD `NGO` (logo, adresse, réseaux
  sociaux) ajouté sur `index.html`.
- [x] **Favicon/manifest câblé** sur les 18 pages + `404.html` (favicon.ico, 16×16, 32×32,
  apple-touch-icon, manifest).

## Priorité 3 — Performance

- [x] **Images `projets.html` optimisées.** `carte-nogent-l-artaud.png` (7,5 Mo) et
  `carte-save.png` (3,7 Mo) → WebP redimensionnées à 1100×1100 (273 Ko + 116 Ko — réduction
  de 97 %). PNG originales retirées du dépôt.
- [x] **`loading="lazy"`** ajouté sur les images hors zone visible (accueil, mot des
  dirigeants, bureau, jumelage, photothèque, vidéothèque, cartes projets).
- [x] **Font Awesome allégé.** `all.min.css` remplacé par `fontawesome.min.css` +
  `solid.min.css` + `brands.min.css` (seules familles réellement utilisées : `fas`, `fab`).

## Priorité 4 — Robustesse infra

- [x] **Page d'erreur personnalisée.** `404.html` créé (identité du site), et la
  distribution CloudFront mappe les erreurs 403/404 vers cette page (statut HTTP 404).
- [x] **Logging CloudFront activé.** Bucket dédié `www-liensculturels-org-logs` (chiffré,
  accès public bloqué, expiration 30 jours), délivrance via CloudWatch Logs "vended logs"
  (`liensculturels-cf-access-logs` → `liensculturels-logs-s3-dest`).
- [x] **Politique d'en-têtes de sécurité.** Response Headers Policy CloudFront
  (`liensculturels-security-headers`) : CSP, `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Strict-Transport-Security` (1 an). Vérifié en direct.

## Priorité 5 — Hygiène de dépôt / code

- [x] **Fichier dupliqué `index - Copie.html`** retiré du suivi Git.
- [x] **`File Structure.docx`** exclu du déploiement S3.
- [x] **Images FBTT supprimées** (`Logo FBTT*.png/.gif/.jpeg/.pdf`, `Logo_FBTT.png`) —
  sans rapport avec l'association, aucune référence trouvée.
- [x] **`assets/js/loader.js` (code mort) supprimé** — n'était référencé par aucune page.
- [x] **Balisage HTML invalide** sur les pages de confirmation newsletter — corrigé avec
  le point header/footer de P1.
- [ ] **Photos de bureau encore non câblées dans `assets/img/`** — 4 fiches utilisent
  encore une image placeholder sur `bureau.html` (Stéphane ANAKPO, Ronel Jethem ATINDEHOU,
  François DREMONT, Teddy FAROT). Les photos disponibles
  (`Abdel_Kader_SALIFOU2.jpg`, `Francis DOSSOU2.jpg`, `dossou.jpg`, `Lionel_WILSON.jpg`,
  `sg.jpeg`, `sga.jpeg`, `tg.jpeg`, `tga.jpeg`, `vp.jpeg`, `pct.jpeg`, `adjointe1-orga.jpeg`)
  ne correspondent par leur nom à aucune de ces 4 personnes, et les abréviations de rôle
  (SG/SGA/TG/TGA/VP) ne correspondent à aucun rôle vacant actuel — bloqué en attente de la
  correspondance exacte photo → personne/rôle de la part de l'association (demandé le
  2026-08-08, pas encore reçu).
- [ ] **Fonds de header/hero non câblés** (`fond_header.png`, `fond_header1.png`,
  `fond_hero.jpg`, `fond_hero1.jpg`) — changement visuel qui doit être validé avant
  d'écraser le style actuel, pas fait sans confirmation.

## Priorité 6 — Au-delà

- [x] **CI légère.** `.github/workflows/lint.yml` : validation HTML (Nu Html Checker) +
  vérification des liens internes cassés, sur chaque pull request.
- [🟡] **Site bilingue FR/EN.** Demandé explicitement le 8 août — n'est plus optionnel.
  Infrastructure + chrome (nav, footer) en ligne sur les 25 pages ; contenu traduit sur 5
  pages, 13 restantes. Voir point 9 du tableau de suivi ci-dessus pour le détail exact.

## Note — bug de déploiement trouvé et corrigé pendant cette session

`.github/workflows/deploy.yml` et `deploy.sh` prétendaient exclure les scripts shell du
déploiement mais le pattern `--exclude "*.sh"` manquait réellement de la liste : `deploy.sh`
s'est retrouvé publié sur le bucket public. Corrigé (pattern ajouté aux deux), et les objets
S3 orphelins (fichiers FBTT, anciennes cartes PNG, `loader.js`, `deploy.sh`) ont été
supprimés manuellement puisque le workflow de sync n'utilise volontairement pas `--delete`.
CloudFront invalidé et 404 vérifiée sur chacun de ces chemins.
